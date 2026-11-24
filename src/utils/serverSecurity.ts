import crypto from 'node:crypto';
import type { BulkQuoteReceipt, OrderReceipt } from '../types/dairy.ts';
import { normalizeKenyanPhone } from './security.ts';

export interface StoredOrderRecord extends OrderReceipt {
  lookupTokenHash?: string;
}

export interface StoredQuoteRecord extends BulkQuoteReceipt {
  lookupTokenHash?: string;
}

export function generateSecureOrderNumber(): string {
  return `LDF-${crypto.randomInt(10000000, 100000000)}`;
}

export function generateSecureQuoteNumber(): string {
  return `LDQ-${crypto.randomInt(10000000, 100000000)}`;
}

export function createLookupCredentials(): {
  lookupToken: string;
  lookupTokenHash: string;
} {
  const lookupToken = crypto.randomBytes(24).toString('hex');
  return {
    lookupToken,
    lookupTokenHash: hashLookupToken(lookupToken),
  };
}

export function hashLookupToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function timingSafeEqualAscii(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies ownership before returning an order or wholesale quote receipt.
 * Accepts either the per-record cryptographic lookupToken issued at creation time
 * or a timing-safe match against the normalized Kenyan phone number stored on the record.
 */
export function verifyRecordAccess(options: {
  storedPhone: string;
  storedTokenHash?: string;
  providedPhone?: unknown;
  providedToken?: unknown;
}): boolean {
  const rawToken =
    typeof options.providedToken === 'string'
      ? options.providedToken.trim().toLowerCase()
      : '';

  if (
    rawToken &&
    /^[a-f0-9]{48}$/.test(rawToken) &&
    options.storedTokenHash &&
    timingSafeEqualAscii(hashLookupToken(rawToken), options.storedTokenHash)
  ) {
    return true;
  }

  const normalizedProvidedPhone = normalizeKenyanPhone(options.providedPhone);
  const normalizedStoredPhone = normalizeKenyanPhone(options.storedPhone);
  if (
    normalizedProvidedPhone &&
    normalizedStoredPhone &&
    timingSafeEqualAscii(normalizedProvidedPhone, normalizedStoredPhone)
  ) {
    return true;
  }

  return false;
}

export function toPublicOrderReceipt(record: StoredOrderRecord): OrderReceipt {
  const { lookupTokenHash: _hidden, ...publicReceipt } = record;
  return publicReceipt;
}

export function toPublicQuoteReceipt(record: StoredQuoteRecord): BulkQuoteReceipt {
  const { lookupTokenHash: _hidden, ...publicReceipt } = record;
  return publicReceipt;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxTrackedKeys: number;

  constructor(options: {
    windowMs: number;
    maxRequests: number;
    maxTrackedKeys?: number;
  }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxTrackedKeys = options.maxTrackedKeys ?? 5000;
  }

  check(key: string, now = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;
    const existing = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart);

    if (existing.length >= this.maxRequests) {
      this.hits.set(key, existing);
      const oldestTs = existing[0] ?? now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldestTs + this.windowMs - now) / 1000)
      );
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    if (!this.hits.has(key) && this.hits.size >= this.maxTrackedKeys) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey !== undefined) {
        this.hits.delete(oldestKey);
      }
    }

    existing.push(now);
    this.hits.set(key, existing);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - existing.length),
      retryAfterSeconds: 0,
    };
  }
}

export function buildSecurityHeaders(options: {
  isDev: boolean;
  isHttps: boolean;
}): Record<string, string> {
  // Keeps AI Studio iframe embedding intact (omits X-Frame-Options & restrictive frame-ancestors).
  const scriptSrc = options.isDev
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self'";
  const connectSrc = options.isDev
    ? "connect-src 'self' ws: wss:"
    : "connect-src 'self'";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    connectSrc,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me",
  ].join('; ');

  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'X-DNS-Prefetch-Control': 'off',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  };

  if (options.isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  return headers;
}

const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSigningKey(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_SESSION_SECRET;
}

interface OtpChallengeRecord {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

const MAX_OTP_ATTEMPTS = 5;
const OTP_TTL_MS = 10 * 60_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60_000;

export class EmailOtpStore {
  private readonly challenges = new Map<string, OtpChallengeRecord>();

  issue(email: string, now = Date.now()): { code: string; expiresInMinutes: number } {
    // Prune expired records boundedly
    if (this.challenges.size >= 2000) {
      for (const [k, v] of this.challenges.entries()) {
        if (v.expiresAt <= now) this.challenges.delete(k);
      }
      if (this.challenges.size >= 2000) {
        const firstKey = this.challenges.keys().next().value;
        if (firstKey) this.challenges.delete(firstKey);
      }
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = hashLookupToken(`${email}:${code}`);
    this.challenges.set(email, {
      email,
      codeHash,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
    });
    return { code, expiresInMinutes: 10 };
  }

  verify(
    email: string,
    submittedCode: string,
    now = Date.now()
  ): { ok: true } | { ok: false; reason: string } {
    const cleanCode = submittedCode.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return { ok: false, reason: 'Please enter the 6-digit verification code.' };
    }

    const record = this.challenges.get(email);
    if (!record) {
      return { ok: false, reason: 'Request a verification code for this email first.' };
    }

    if (now > record.expiresAt) {
      this.challenges.delete(email);
      return { ok: false, reason: 'Verification code expired. Please request a new one.' };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      this.challenges.delete(email);
      return {
        ok: false,
        reason: 'Too many incorrect attempts. Please request a fresh verification code.',
      };
    }

    const candidateHash = hashLookupToken(`${email}:${cleanCode}`);
    if (!timingSafeEqualAscii(candidateHash, record.codeHash)) {
      record.attempts += 1;
      return {
        ok: false,
        reason: 'Incorrect 6-digit verification code. Please check and try again.',
      };
    }

    this.challenges.delete(email);
    return { ok: true };
  }
}

export interface SignedSessionPayload {
  email: string;
  displayName: string;
  signedInAt: string;
  exp: number;
}

export function createSignedEmailSessionToken(
  user: { email: string; displayName: string; signedInAt: string },
  now = Date.now()
): string {
  const payloadObj: SignedSessionPayload = {
    email: user.email,
    displayName: user.displayName,
    signedInAt: user.signedInAt,
    exp: now + SESSION_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sigHex = crypto
    .createHmac('sha256', getSessionSigningKey())
    .update(payloadB64)
    .digest('hex');
  return `${payloadB64}.${sigHex}`;
}

export function verifySignedEmailSessionToken(
  token: unknown,
  now = Date.now()
): SignedSessionPayload | null {
  if (typeof token !== 'string') return null;
  const trimmed = token.trim();
  const dotIdx = trimmed.indexOf('.');
  if (dotIdx <= 0) return null;

  const payloadB64 = trimmed.slice(0, dotIdx);
  const providedSig = trimmed.slice(dotIdx + 1);
  if (!/^[a-f0-9]{64}$/i.test(providedSig)) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSigningKey())
    .update(payloadB64)
    .digest('hex');

  if (!timingSafeEqualAscii(providedSig.toLowerCase(), expectedSig.toLowerCase())) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as Partial<SignedSessionPayload>;
    if (
      !parsed ||
      typeof parsed.email !== 'string' ||
      typeof parsed.displayName !== 'string' ||
      typeof parsed.signedInAt !== 'string' ||
      typeof parsed.exp !== 'number' ||
      now > parsed.exp
    ) {
      return null;
    }
    return {
      email: parsed.email,
      displayName: parsed.displayName,
      signedInAt: parsed.signedInAt,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function parseCookiesHeader(cookieHeader: unknown): Record<string, string> {
  if (typeof cookieHeader !== 'string' || !cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

