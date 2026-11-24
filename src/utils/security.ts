import type { CartItem } from '../types/dairy.ts';

export const MAX_CART_LINE_ITEMS = 25;
export const MAX_ITEM_QUANTITY = 500;
export const MAX_QUOTE_LINE_ITEMS = 20;
export const MAX_CRATES_PER_PACK = 500;

export interface SavedOrderLookup {
  orderNumber: string;
  lookupToken?: string;
}

/**
 * Strips ASCII control characters (including NUL, CR, LF, tabs) and caps string length
 * to prevent log/receipt line forging and oversized payloads.
 */
export function sanitizeTextInput(raw: unknown, maxLength: number): string {
  if (typeof raw !== 'string') return '';
  let cleaned = '';
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      cleaned += raw[i];
    } else if (code === 9 || code === 10 || code === 13) {
      cleaned += ' ';
    }
  }
  return cleaned.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Normalizes valid Kenyan mobile numbers (+2547..., 2547..., 07..., 01...) to 12-digit
 * canonical form (2547xxxxxxxx or 2541xxxxxxxx). Returns '' if invalid.
 */
export function normalizeKenyanPhone(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const compact = raw.replace(/[\s\-()]/g, '');
  if (/^\+254(?:7|1)\d{8}$/.test(compact)) {
    return compact.slice(1);
  }
  if (/^254(?:7|1)\d{8}$/.test(compact)) {
    return compact;
  }
  if (/^0(?:7|1)\d{8}$/.test(compact)) {
    return `254${compact.slice(1)}`;
  }
  return '';
}

/**
 * Sanitizes and validates an email address, returning normalized lowercase or ''.
 */
export function sanitizeAndValidateEmail(raw: unknown): string {
  const cleaned = sanitizeTextInput(raw, 160).toLowerCase();
  if (
    cleaned.length < 5 ||
    cleaned.length > 160 ||
    cleaned.includes('..') ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned)
  ) {
    return '';
  }
  return cleaned;
}

/**
 * Derives a friendly readable display name from a verified email address.
 */
export function deriveDisplayNameFromEmail(email: string): string {
  const local = sanitizeAndValidateEmail(email).split('@')[0] ?? '';
  if (!local) return 'Member';
  const words = local
    .split(/[._+\-]+/)
    .map((part) => part.replace(/\d+$/g, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  if (words.length === 0) return local.slice(0, 24);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Validates and deduplicates cart line items from untrusted request bodies or localStorage.
 */
export function sanitizeCartItemsClient(
  rawItems: unknown,
  allowedIds: ReadonlySet<string>
): CartItem[] {
  if (!Array.isArray(rawItems)) return [];
  const merged = new Map<string, number>();

  for (const entry of rawItems) {
    if (merged.size >= MAX_CART_LINE_ITEMS && typeof entry === 'object') {
      const candidateId = (entry as { productId?: unknown }).productId;
      if (typeof candidateId !== 'string' || !merged.has(candidateId)) {
        continue;
      }
    }
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as { productId?: unknown; quantity?: unknown };
    if (typeof item.productId !== 'string' || !allowedIds.has(item.productId)) {
      continue;
    }
    if (typeof item.quantity !== 'number' && typeof item.quantity !== 'string') {
      continue;
    }
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_ITEM_QUANTITY) {
      continue;
    }
    merged.set(
      item.productId,
      Math.min(MAX_ITEM_QUANTITY, (merged.get(item.productId) ?? 0) + qty)
    );
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

/**
 * Parses saved last-order reference metadata from localStorage safely.
 * Never trusts or retains PII in browser storage.
 */
export function parseSavedOrderLookup(raw: string | null): SavedOrderLookup | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^LDF-\d{4,8}$/i.test(trimmed)) {
    return { orderNumber: trimmed.toUpperCase() };
  }
  try {
    const parsed = JSON.parse(trimmed) as {
      orderNumber?: unknown;
      lookupToken?: unknown;
    };
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.orderNumber !== 'string'
    ) {
      return null;
    }
    const orderNumber = parsed.orderNumber.trim().toUpperCase();
    if (!/^LDF-\d{4,8}$/.test(orderNumber)) return null;
    const lookupToken =
      typeof parsed.lookupToken === 'string' &&
      /^[a-f0-9]{32,96}$/i.test(parsed.lookupToken.trim())
        ? parsed.lookupToken.trim().toLowerCase()
        : undefined;
    return { orderNumber, lookupToken };
  } catch {
    return null;
  }
}

/**
 * Checks if a request URL pathname targets sensitive hidden files, server code, or data storage.
 */
export function isSensitiveHiddenPath(
  pathname: string,
  options?: { allowViteDevCache?: boolean }
): boolean {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return true;
  }
  const normalized = decoded.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('\0') || normalized.includes('..')) {
    return true;
  }
  if (
    options?.allowViteDevCache &&
    normalized.startsWith('/node_modules/.vite/')
  ) {
    return false;
  }
  const segments = normalized.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.') && seg !== '.well-known')) {
    return true;
  }
  if (
    segments[0] === 'data' ||
    normalized === '/server.ts' ||
    normalized === '/package.json' ||
    normalized === '/package-lock.json' ||
    normalized === '/bun.lock' ||
    normalized === '/tsconfig.json'
  ) {
    return true;
  }
  return false;
}
