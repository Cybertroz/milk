import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import type {
  BulkQuoteLineInput,
  BulkQuoteRequest,
  CheckoutFormData,
  DeliveryZoneId,
} from './src/types/dairy.ts';
import {
  DELIVERY_ZONES,
  PRODUCTS,
  WHOLESALE_PACKS,
  calculateWholesaleQuoteEstimate,
  createOrderReceipt,
  validateBulkQuoteRequest,
  validateCheckoutForm,
} from './src/utils/catalog.ts';
import crypto from 'node:crypto';
import {
  MAX_CRATES_PER_PACK,
  MAX_QUOTE_LINE_ITEMS,
  deriveDisplayNameFromEmail,
  isSensitiveHiddenPath,
  normalizeKenyanPhone,
  sanitizeAndValidateEmail,
  sanitizeCartItemsClient,
  sanitizeTextInput,
} from './src/utils/security.ts';
import {
  initiateDarajaStkPush,
  parseDarajaStkCallback,
  queryDarajaStkStatus,
  resolveMpesaConfig,
  verifyMpesaCallbackToken,
} from './src/utils/mpesa.ts';
import {
  EmailOtpStore,
  SlidingWindowRateLimiter,
  buildSecurityHeaders,
  createLookupCredentials,
  createSignedEmailSessionToken,
  generateSecureOrderNumber,
  generateSecureQuoteNumber,
  parseCookiesHeader,
  toPublicOrderReceipt,
  toPublicQuoteReceipt,
  verifyRecordAccess,
  verifySignedEmailSessionToken,
  type StoredOrderRecord,
  type StoredQuoteRecord,
} from './src/utils/serverSecurity.ts';

interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}

interface StoreData {
  orders: StoredOrderRecord[];
  quotes: StoredQuoteRecord[];
  newsletter: NewsletterSubscriber[];
}

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'limuru-dairy-data')
  : path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'limuru-dairy-store.json');
const PORT = Number(process.env.PORT) || 3000;

const MAX_STORED_ORDERS = 2000;
const MAX_STORED_QUOTES = 2000;
const MAX_STORED_NEWSLETTER = 5000;

const ALLOWED_PRODUCT_IDS = new Set(PRODUCTS.map((p) => p.id));
const ALLOWED_PACK_IDS = new Set(WHOLESALE_PACKS.map((p) => p.id));

const writeLimiter = new SlidingWindowRateLimiter({
  windowMs: 5 * 60_000,
  maxRequests: 15,
});

const lookupLimiter = new SlidingWindowRateLimiter({
  windowMs: 5 * 60_000,
  maxRequests: 20,
});

const authLimiter = new SlidingWindowRateLimiter({
  windowMs: 5 * 60_000,
  maxRequests: 25,
});

const emailOtpStore = new EmailOtpStore();
const SESSION_COOKIE_NAME = 'limuru_session';

function extractAuthenticatedUser(req: Request) {
  const authHeader = req.get('authorization') ?? '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifySignedEmailSessionToken(bearerToken);
    if (verified) {
      return {
        email: verified.email,
        displayName: verified.displayName,
        signedInAt: verified.signedInAt,
        verified: true,
      };
    }
  }

  const cookies = parseCookiesHeader(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    const verified = verifySignedEmailSessionToken(cookieToken);
    if (verified) {
      return {
        email: verified.email,
        displayName: verified.displayName,
        signedInAt: verified.signedInAt,
        verified: true,
      };
    }
  }

  return null;
}

function buildCookieAttributes(req: Request, maxAgeSeconds: number): string {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSeconds}`,
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure', 'Partitioned');
  }
  return parts.join('; ');
}

function verifyMutationOrigin(req: Request): boolean {
  const origin = req.get('origin');
  if (!origin) return true;
  const rawHost = req.get('x-forwarded-host') || req.get('host') || '';
  const host = rawHost.split(',')[0].trim().toLowerCase();
  if (!host) return true;
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

let writeChain: Promise<void> = Promise.resolve();

async function ensureStoreFile(): Promise<StoreData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
      newsletter: Array.isArray(parsed.newsletter) ? parsed.newsletter : [],
    };
  } catch {
    const initial: StoreData = { orders: [], quotes: [], newsletter: [] };
    await atomicWriteJson(STORE_PATH, initial);
    return initial;
  }
}

async function atomicWriteJson(targetPath: string, data: unknown): Promise<void> {
  const tmpPath = `${targetPath}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  await fs.rename(tmpPath, targetPath);
}

async function readStore(): Promise<StoreData> {
  return ensureStoreFile();
}

function updateStore<T>(mutator: (data: StoreData) => T | Promise<T>): Promise<T> {
  const nextRun = writeChain.then(async () => {
    const data = await ensureStoreFile();
    const result = await mutator(data);
    await atomicWriteJson(STORE_PATH, data);
    return result;
  });
  writeChain = nextRun.then(
    () => undefined,
    () => undefined
  );
  return nextRun;
}

function isValidDeliveryZone(id: unknown): id is DeliveryZoneId {
  return typeof id === 'string' && DELIVERY_ZONES.some((z) => z.id === id);
}

function getClientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown').trim();
}

function requireJsonBody(req: Request, res: Response, next: NextFunction) {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json.' });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  return next();
}

function enforceRateLimit(limiter: SlidingWindowRateLimiter) {
  return (req: Request, res: Response, next: NextFunction) => {
    const check = limiter.check(getClientIp(req));
    if (!check.allowed) {
      res.setHeader('Retry-After', String(check.retryAfterSeconds));
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }
    return next();
  };
}

function sanitizeBulkQuoteLines(rawItems: unknown): {
  lines: BulkQuoteLineInput[];
  hasInvalidPack: boolean;
} {
  if (!Array.isArray(rawItems)) {
    return { lines: [], hasInvalidPack: false };
  }
  const merged = new Map<string, number>();

  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') {
      return { lines: [], hasInvalidPack: true };
    }
    const item = entry as { packId?: unknown; crates?: unknown };
    if (typeof item.packId !== 'string' || !ALLOWED_PACK_IDS.has(item.packId)) {
      return { lines: [], hasInvalidPack: true };
    }
    if (typeof item.crates !== 'number' && typeof item.crates !== 'string') {
      continue;
    }
    const crates = Math.floor(Number(item.crates));
    if (!Number.isFinite(crates) || crates <= 0 || crates > MAX_CRATES_PER_PACK) {
      continue;
    }
    if (merged.size >= MAX_QUOTE_LINE_ITEMS && !merged.has(item.packId)) {
      continue;
    }
    merged.set(
      item.packId,
      Math.min(MAX_CRATES_PER_PACK, (merged.get(item.packId) ?? 0) + crates)
    );
  }

  return {
    lines: Array.from(merged.entries()).map(([packId, crates]) => ({
      packId,
      crates,
    })),
    hasInvalidPack: false,
  };
}

const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', false);

// Security headers across all HTTP responses (preserves preview iframe rendering)
app.use((req, res, next) => {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  const secHeaders = buildSecurityHeaders({
    isDev: !isProd,
    isHttps,
  });
  for (const [name, value] of Object.entries(secHeaders)) {
    res.setHeader(name, value);
  }
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Block hidden dotfiles, local data directory, and server source paths
app.use((req, res, next) => {
  if (isSensitiveHiddenPath(req.path, { allowViteDevCache: !isProd })) {
    return res.status(404).end();
  }
  return next();
});

app.use(express.json({ limit: '32kb', strict: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'limuru-dairy-api' });
});

// Check current signed-in email session
app.get('/api/auth/me', (req, res) => {
  const user = extractAuthenticatedUser(req);
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user });
});

// Request a 6-digit email verification code
app.post(
  '/api/auth/request-code',
  enforceRateLimit(authLimiter),
  requireJsonBody,
  (req, res) => {
    if (!verifyMutationOrigin(req)) {
      return res.status(403).json({ error: 'Invalid request origin.' });
    }
    const rawEmail = (req.body as { email?: unknown })?.email;
    const cleanEmail = sanitizeAndValidateEmail(rawEmail);
    if (!cleanEmail) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid email address.' });
    }

    const { code, expiresInMinutes } = emailOtpStore.issue(cleanEmail);
    const hasMailer = Boolean(process.env.SMTP_HOST?.trim());
    return res.json({
      ok: true,
      email: cleanEmail,
      expiresInMinutes,
      previewMode: !hasMailer,
      ...(hasMailer ? {} : { previewCode: code }),
    });
  }
);

// Verify 6-digit email code & issue signed session
app.post(
  '/api/auth/verify-code',
  enforceRateLimit(authLimiter),
  requireJsonBody,
  (req, res) => {
    if (!verifyMutationOrigin(req)) {
      return res.status(403).json({ error: 'Invalid request origin.' });
    }
    const body = req.body as { email?: unknown; code?: unknown };
    const cleanEmail = sanitizeAndValidateEmail(body.email);
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const rawCode = sanitizeTextInput(body.code, 12);
    const check = emailOtpStore.verify(cleanEmail, rawCode);
    if (!check.ok) {
      return res.status(400).json({ error: check.reason });
    }

    const user = {
      email: cleanEmail,
      displayName: deriveDisplayNameFromEmail(cleanEmail),
      signedInAt: new Date().toISOString(),
      verified: true,
    };
    const sessionToken = createSignedEmailSessionToken(user);
    const cookieAttrs = buildCookieAttributes(req, 7 * 24 * 60 * 60);
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; ${cookieAttrs}`
    );
    return res.json({ authenticated: true, user, sessionToken });
  }
);

// Sign out email session
app.post('/api/auth/logout', (req, res) => {
  if (!verifyMutationOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin.' });
  }
  const cookieAttrs = buildCookieAttributes(req, 0);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; ${cookieAttrs}`);
  return res.json({ ok: true });
});

// Persist Retail / Wholesale Cart Order
app.post(
  '/api/orders',
  enforceRateLimit(writeLimiter),
  requireJsonBody,
  async (req, res) => {
    try {
      const body = req.body as {
        cart?: unknown;
        form?: Partial<CheckoutFormData>;
      };

      const cleanCart = sanitizeCartItemsClient(body.cart, ALLOWED_PRODUCT_IDS);
      if (cleanCart.length === 0) {
        return res
          .status(400)
          .json({ error: 'Your basket is empty or contains invalid products.' });
      }

      const rawForm =
        body.form && typeof body.form === 'object' && !Array.isArray(body.form)
          ? body.form
          : {};

      if (
        rawForm.deliveryZoneId !== undefined &&
        !isValidDeliveryZone(rawForm.deliveryZoneId)
      ) {
        return res.status(400).json({ error: 'Please select a valid delivery zone.' });
      }

      if (
        rawForm.paymentMethod !== undefined &&
        rawForm.paymentMethod !== 'mpesa' &&
        rawForm.paymentMethod !== 'cash'
      ) {
        return res.status(400).json({ error: 'Please select a valid payment method.' });
      }

      if (!verifyMutationOrigin(req)) {
        return res.status(403).json({ error: 'Invalid request origin.' });
      }

      const sessionUser = extractAuthenticatedUser(req);
      const verifiedEmail =
        sessionUser?.email || sanitizeAndValidateEmail(rawForm.email);

      if (!verifiedEmail) {
        return res.status(401).json({
          error: 'Please sign in via email before placing an order.',
          fieldErrors: {
            email: 'Sign in with a valid email address to place your order.',
          },
        });
      }

      const deliveryZoneId: DeliveryZoneId = rawForm.deliveryZoneId ?? 'kiambu-ruaka';
      const deliveryWindowId =
        rawForm.deliveryWindowId === 'afternoon' ||
        rawForm.deliveryWindowId === 'evening'
          ? rawForm.deliveryWindowId
          : 'morning';

      const cleanForm: CheckoutFormData = {
        fullName: sanitizeTextInput(rawForm.fullName, 120),
        email: verifiedEmail,
        phone: sanitizeTextInput(rawForm.phone, 32),
        address: sanitizeTextInput(rawForm.address, 240),
        paymentMethod: rawForm.paymentMethod === 'cash' ? 'cash' : 'mpesa',
        deliveryZoneId,
        deliveryWindowId,
      };

      const validationErrors = validateCheckoutForm(cleanForm);
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          error: 'Please check your delivery details.',
          fieldErrors: validationErrors,
        });
      }

      const { lookupToken, lookupTokenHash } = createLookupCredentials();

      const receipt = await updateStore((store) => {
        const created = createOrderReceipt(cleanCart, cleanForm, {
          persisted: true,
          orderNumber: generateSecureOrderNumber(),
        });
        store.orders.unshift({ ...created, lookupTokenHash });
        if (store.orders.length > MAX_STORED_ORDERS) {
          store.orders.length = MAX_STORED_ORDERS;
        }
        return created;
      });

      return res.status(201).json({ order: receipt, lookupToken });
    } catch {
      return res.status(500).json({ error: 'Unable to save order right now.' });
    }
  }
);

// Lookup Persisted Order Receipt (requires matching phone or lookup token)
app.get(
  '/api/orders/:orderNumber',
  enforceRateLimit(lookupLimiter),
  async (req, res) => {
    try {
      const orderNumber = String(req.params.orderNumber || '')
        .trim()
        .toUpperCase();
      if (!/^LDF-\d{4,8}$/.test(orderNumber)) {
        return res.status(400).json({ error: 'Invalid order reference format.' });
      }

      const providedToken = req.query.token ?? req.get('x-lookup-token');
      const providedPhone = req.query.phone ?? req.get('x-verify-phone');

      const store = await readStore();
      const found = store.orders.find((o) => o.orderNumber === orderNumber);
      if (
        !found ||
        !verifyRecordAccess({
          storedPhone: found.phone,
          storedTokenHash: found.lookupTokenHash,
          providedPhone,
          providedToken,
        })
      ) {
        return res.status(404).json({
          error: 'Order reference and phone verification did not match.',
        });
      }

      return res.json({ order: toPublicOrderReceipt(found) });
    } catch {
      return res.status(500).json({ error: 'Unable to retrieve order.' });
    }
  }
);

function getRequestPublicOrigin(req: Request): string | undefined {
  const rawProto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const proto = rawProto.split(',')[0].trim() === 'http' ? 'http' : 'https';
  const rawHost = req.get('x-forwarded-host') || req.get('host') || '';
  const host = rawHost.split(',')[0].trim();
  if (!host) return process.env.APP_URL?.trim() || undefined;
  return `${proto}://${host}`;
}

// Public-safe M-Pesa capability descriptor (never returns secrets)
app.get('/api/mpesa/config', (req, res) => {
  const mpesaConfig = resolveMpesaConfig(process.env, getRequestPublicOrigin(req));
  return res.json({
    configured: mpesaConfig.isConfigured,
    env: mpesaConfig.env,
    transactionType: mpesaConfig.transactionType,
    accountTypeLabel:
      mpesaConfig.transactionType === 'CustomerBuyGoodsOnline'
        ? 'M-Pesa Buy Goods Till'
        : 'M-Pesa Paybill',
    simulationAvailable: !mpesaConfig.isConfigured,
  });
});

// Initiate Safaricom Daraja Lipa na M-Pesa STK Push (or Sandbox Preview if keys unset)
app.post(
  '/api/mpesa/stkpush',
  enforceRateLimit(writeLimiter),
  requireJsonBody,
  async (req, res) => {
    try {
      if (!verifyMutationOrigin(req)) {
        return res.status(403).json({ error: 'Invalid request origin.' });
      }

      const body = req.body as {
        cart?: unknown;
        form?: Partial<CheckoutFormData>;
      };

      const cleanCart = sanitizeCartItemsClient(body.cart, ALLOWED_PRODUCT_IDS);
      if (cleanCart.length === 0) {
        return res
          .status(400)
          .json({ error: 'Your basket is empty or contains invalid products.' });
      }

      const rawForm =
        body.form && typeof body.form === 'object' && !Array.isArray(body.form)
          ? body.form
          : {};

      if (
        rawForm.deliveryZoneId !== undefined &&
        !isValidDeliveryZone(rawForm.deliveryZoneId)
      ) {
        return res.status(400).json({ error: 'Please select a valid delivery zone.' });
      }

      const sessionUser = extractAuthenticatedUser(req);
      const verifiedEmail =
        sessionUser?.email || sanitizeAndValidateEmail(rawForm.email);

      if (!verifiedEmail) {
        return res.status(401).json({
          error: 'Please sign in via email before initiating M-Pesa checkout.',
          fieldErrors: {
            email: 'Sign in with a valid email address to place your order.',
          },
        });
      }

      const deliveryZoneId: DeliveryZoneId = rawForm.deliveryZoneId ?? 'kiambu-ruaka';
      const deliveryWindowId =
        rawForm.deliveryWindowId === 'afternoon' ||
        rawForm.deliveryWindowId === 'evening'
          ? rawForm.deliveryWindowId
          : 'morning';

      const cleanForm: CheckoutFormData = {
        fullName: sanitizeTextInput(rawForm.fullName, 120),
        email: verifiedEmail,
        phone: sanitizeTextInput(rawForm.phone, 32),
        address: sanitizeTextInput(rawForm.address, 240),
        paymentMethod: 'mpesa',
        deliveryZoneId,
        deliveryWindowId,
      };

      const validationErrors = validateCheckoutForm(cleanForm);
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          error: 'Please check your M-Pesa phone and delivery details.',
          fieldErrors: validationErrors,
        });
      }

      const phone254 = normalizeKenyanPhone(cleanForm.phone);
      if (!phone254) {
        return res.status(400).json({
          error: 'Enter a valid Kenyan Safaricom/M-Pesa number (07... or +254...).',
          fieldErrors: { phone: 'Enter a valid Kenyan mobile number.' },
        });
      }

      const orderNumber = generateSecureOrderNumber();
      const baseReceipt = createOrderReceipt(cleanCart, cleanForm, {
        persisted: true,
        orderNumber,
      });

      const mpesaConfig = resolveMpesaConfig(process.env, getRequestPublicOrigin(req));
      const { lookupToken, lookupTokenHash } = createLookupCredentials();

      let checkoutRequestId = '';
      let merchantRequestId = '';
      let paymentMessage = '';
      let mode: 'daraja' | 'sandbox_preview' = 'sandbox_preview';

      if (mpesaConfig.isConfigured) {
        mode = 'daraja';
        try {
          const darajaResult = await initiateDarajaStkPush({
            config: mpesaConfig,
            phone254,
            amountKes: baseReceipt.totalKes,
            orderNumber,
          });
          checkoutRequestId = darajaResult.checkoutRequestId;
          merchantRequestId = darajaResult.merchantRequestId;
          paymentMessage = darajaResult.customerMessage;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to send M-Pesa prompt right now.';
          return res.status(502).json({ error: message });
        }
      } else {
        checkoutRequestId = `SBX_${crypto.randomBytes(6).toString('hex')}`;
        merchantRequestId = `SBX_REQ_${crypto.randomBytes(4).toString('hex')}`;
        paymentMessage =
          'Daraja credentials are not set yet—using interactive Sandbox Preview to verify STK Push.';
      }

      const pendingReceipt = await updateStore((store) => {
        const record: StoredOrderRecord = {
          ...baseReceipt,
          status: 'confirmed',
          paymentStatus: 'pending',
          mpesaCheckoutRequestId: checkoutRequestId,
          mpesaMerchantRequestId: merchantRequestId,
          paymentMessage,
          lookupTokenHash,
        };
        store.orders.unshift(record);
        if (store.orders.length > MAX_STORED_ORDERS) {
          store.orders.length = MAX_STORED_ORDERS;
        }
        return toPublicOrderReceipt(record);
      });

      return res.status(201).json({
        ok: true,
        mode,
        env: mpesaConfig.env,
        transactionType: mpesaConfig.transactionType,
        order: pendingReceipt,
        lookupToken,
      });
    } catch {
      return res.status(500).json({ error: 'Unable to start M-Pesa STK Push right now.' });
    }
  }
);

// Safaricom Daraja Webhook Callback (authenticated via order-scoped HMAC signature)
app.post('/api/mpesa/callback', requireJsonBody, async (req, res) => {
  try {
    const orderNumber = String(req.query.order || '')
      .trim()
      .toUpperCase();
    if (!/^LDF-\d{4,8}$/.test(orderNumber)) {
      return res.status(400).json({ error: 'Invalid order reference.' });
    }

    const mpesaConfig = resolveMpesaConfig(process.env, getRequestPublicOrigin(req));
    if (!verifyMpesaCallbackToken(orderNumber, req.query.sig, mpesaConfig.callbackSecret)) {
      return res.status(403).json({ error: 'Invalid callback signature.' });
    }

    const parsed = parseDarajaStkCallback(req.body);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid Daraja callback payload.' });
    }

    await updateStore((store) => {
      const target = store.orders.find((o) => o.orderNumber === orderNumber);
      if (!target) return;
      if (
        target.mpesaCheckoutRequestId &&
        target.mpesaCheckoutRequestId !== parsed.checkoutRequestId
      ) {
        return;
      }

      if (parsed.isSuccess) {
        if (
          parsed.amountKes !== undefined &&
          Math.round(parsed.amountKes) < target.totalKes
        ) {
          target.paymentStatus = 'failed';
          target.paymentMessage = 'Paid amount did not match order total.';
          return;
        }
        target.paymentStatus = 'paid';
        target.status = 'confirmed';
        if (parsed.mpesaReceiptNumber) {
          target.mpesaReceiptNumber = parsed.mpesaReceiptNumber;
        }
        target.paymentMessage = parsed.resultDesc;
      } else if (parsed.isCancelled) {
        if (target.paymentStatus !== 'paid') {
          target.paymentStatus = 'cancelled';
          target.paymentMessage = parsed.resultDesc;
        }
      } else if (target.paymentStatus !== 'paid') {
        target.paymentStatus = 'failed';
        target.paymentMessage = parsed.resultDesc;
      }
    });

    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch {
    return res.status(500).json({ error: 'Callback processing failed.' });
  }
});

// Authenticated Order M-Pesa Payment Status Poll (checks store + queries Daraja STK Query API if pending)
app.get(
  '/api/mpesa/status/:orderNumber',
  enforceRateLimit(lookupLimiter),
  async (req, res) => {
    try {
      const orderNumber = String(req.params.orderNumber || '')
        .trim()
        .toUpperCase();
      if (!/^LDF-\d{4,8}$/.test(orderNumber)) {
        return res.status(400).json({ error: 'Invalid order reference format.' });
      }

      const providedToken = req.query.token ?? req.get('x-lookup-token');
      const providedPhone = req.query.phone ?? req.get('x-verify-phone');

      const store = await readStore();
      const found = store.orders.find((o) => o.orderNumber === orderNumber);
      if (
        !found ||
        !verifyRecordAccess({
          storedPhone: found.phone,
          storedTokenHash: found.lookupTokenHash,
          providedPhone,
          providedToken,
        })
      ) {
        return res.status(404).json({ error: 'Order could not be verified.' });
      }

      const mpesaConfig = resolveMpesaConfig(process.env, getRequestPublicOrigin(req));

      if (
        found.paymentStatus === 'pending' &&
        mpesaConfig.isConfigured &&
        found.mpesaCheckoutRequestId
      ) {
        try {
          const queryResult = await queryDarajaStkStatus(
            mpesaConfig,
            found.mpesaCheckoutRequestId
          );
          if (queryResult && !queryResult.isPending) {
            const updated = await updateStore((latestStore) => {
              const record = latestStore.orders.find(
                (o) => o.orderNumber === orderNumber
              );
              if (!record) return null;
              if (queryResult.isSuccess) {
                record.paymentStatus = 'paid';
                record.status = 'confirmed';
                record.paymentMessage = queryResult.resultDesc;
              } else if (queryResult.isCancelled) {
                if (record.paymentStatus !== 'paid') {
                  record.paymentStatus = 'cancelled';
                  record.paymentMessage = queryResult.resultDesc;
                }
              } else if (record.paymentStatus !== 'paid') {
                record.paymentStatus = 'failed';
                record.paymentMessage = queryResult.resultDesc;
              }
              return toPublicOrderReceipt(record);
            });
            if (updated) {
              return res.json({ order: updated, mode: 'daraja' });
            }
          }
        } catch {
          // Return stored pending status smoothly if Daraja query is momentarily busy
        }
      }

      return res.json({
        order: toPublicOrderReceipt(found),
        mode: mpesaConfig.isConfigured ? 'daraja' : 'sandbox_preview',
      });
    } catch {
      return res.status(500).json({ error: 'Unable to check M-Pesa payment status.' });
    }
  }
);

// Sandbox Preview simulator (strictly disabled whenever real Daraja credentials are configured)
app.post(
  '/api/mpesa/demo-complete',
  enforceRateLimit(writeLimiter),
  requireJsonBody,
  async (req, res) => {
    try {
      if (!verifyMutationOrigin(req)) {
        return res.status(403).json({ error: 'Invalid request origin.' });
      }

      const mpesaConfig = resolveMpesaConfig(process.env, getRequestPublicOrigin(req));
      if (mpesaConfig.isConfigured) {
        return res.status(403).json({
          error: 'Sandbox simulator is disabled while Safaricom Daraja credentials are active.',
        });
      }

      const body = req.body as {
        orderNumber?: unknown;
        action?: unknown;
        lookupToken?: unknown;
      };
      const orderNumber = sanitizeTextInput(body.orderNumber, 24).toUpperCase();
      if (!/^LDF-\d{4,8}$/.test(orderNumber)) {
        return res.status(400).json({ error: 'Invalid order reference format.' });
      }

      const action = body.action === 'cancel' ? 'cancel' : 'confirm';
      const providedToken = body.lookupToken ?? req.get('x-lookup-token');
      const providedPhone = req.get('x-verify-phone');

      const result = await updateStore((store) => {
        const record = store.orders.find((o) => o.orderNumber === orderNumber);
        if (
          !record ||
          !verifyRecordAccess({
            storedPhone: record.phone,
            storedTokenHash: record.lookupTokenHash,
            providedPhone,
            providedToken,
          })
        ) {
          return null;
        }

        if (action === 'confirm') {
          record.paymentStatus = 'paid';
          record.status = 'confirmed';
          record.mpesaReceiptNumber = `SBX${crypto
            .randomBytes(4)
            .toString('hex')
            .toUpperCase()}`;
          record.paymentMessage = 'Simulated Sandbox M-Pesa payment confirmed.';
        } else {
          record.paymentStatus = 'cancelled';
          record.paymentMessage = 'Request cancelled by user in Sandbox Preview.';
        }

        return toPublicOrderReceipt(record);
      });

      if (!result) {
        return res.status(404).json({ error: 'Pending M-Pesa order could not be verified.' });
      }

      return res.json({ ok: true, order: result });
    } catch {
      return res.status(500).json({ error: 'Unable to update sandbox payment.' });
    }
  }
);

// Persist Wholesale Bulk Quote Request
app.post(
  '/api/quotes',
  enforceRateLimit(writeLimiter),
  requireJsonBody,
  async (req, res) => {
    try {
      const body = req.body as Partial<BulkQuoteRequest>;

      if (
        body.deliveryZoneId !== undefined &&
        !isValidDeliveryZone(body.deliveryZoneId)
      ) {
        return res.status(400).json({ error: 'Please select a valid delivery zone.' });
      }

      const { lines: cleanItems, hasInvalidPack } = sanitizeBulkQuoteLines(body.items);
      if (hasInvalidPack) {
        return res.status(400).json({
          error: 'One or more selected wholesale packs are unrecognized.',
        });
      }

      const deliveryZoneId: DeliveryZoneId = body.deliveryZoneId ?? 'limuru-tigoni';

      const cleanPayload: BulkQuoteRequest = {
        organizationName: sanitizeTextInput(body.organizationName, 140),
        contactName: sanitizeTextInput(body.contactName, 120),
        phone: sanitizeTextInput(body.phone, 32),
        deliveryZoneId,
        notes: sanitizeTextInput(body.notes, 400),
        items: cleanItems,
      };

      const validationErrors = validateBulkQuoteRequest(cleanPayload);
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          error: 'Please review the bulk quote form.',
          fieldErrors: validationErrors,
        });
      }

      const { lookupToken, lookupTokenHash } = createLookupCredentials();

      const quote = await updateStore((store) => {
        const estimate = calculateWholesaleQuoteEstimate(
          cleanPayload.items,
          cleanPayload.deliveryZoneId
        );
        const created = {
          quoteNumber: generateSecureQuoteNumber(),
          organizationName: cleanPayload.organizationName,
          contactName: cleanPayload.contactName,
          phone: cleanPayload.phone,
          deliveryZoneId: estimate.deliveryZone.id,
          deliveryZoneLabel: estimate.deliveryZone.label,
          estimatedDelivery: estimate.deliveryZone.eta,
          items: estimate.detailedLines.map((line) => ({
            packId: line.pack.id,
            packName: line.pack.name,
            packLabel: line.pack.packLabel,
            crates: line.crates,
            unitCrateKes: line.pack.wholesalePriceKes,
            lineTotalKes: line.lineTotalKes,
          })),
          retailEquivalentKes: estimate.retailEquivalentKes,
          estimatedTotalKes: estimate.estimatedTotalKes,
          totalSavingsKes: estimate.totalSavingsKes,
          notes: cleanPayload.notes ?? '',
          createdAt: new Date().toLocaleString('en-KE', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        };
        store.quotes.unshift({ ...created, lookupTokenHash });
        if (store.quotes.length > MAX_STORED_QUOTES) {
          store.quotes.length = MAX_STORED_QUOTES;
        }
        return created;
      });

      return res.status(201).json({ quote, lookupToken });
    } catch {
      return res.status(500).json({ error: 'Unable to save bulk quote right now.' });
    }
  }
);

// Lookup Persisted Wholesale Quote (requires matching phone or lookup token)
app.get(
  '/api/quotes/:quoteNumber',
  enforceRateLimit(lookupLimiter),
  async (req, res) => {
    try {
      const quoteNumber = String(req.params.quoteNumber || '')
        .trim()
        .toUpperCase();
      if (!/^LDQ-\d{4,8}$/.test(quoteNumber)) {
        return res.status(400).json({ error: 'Invalid quote reference format.' });
      }

      const providedToken = req.query.token ?? req.get('x-lookup-token');
      const providedPhone = req.query.phone ?? req.get('x-verify-phone');

      const store = await readStore();
      const found = store.quotes.find((q) => q.quoteNumber === quoteNumber);
      if (
        !found ||
        !verifyRecordAccess({
          storedPhone: found.phone,
          storedTokenHash: found.lookupTokenHash,
          providedPhone,
          providedToken,
        })
      ) {
        return res.status(404).json({
          error: 'Quote reference and phone verification did not match.',
        });
      }
      return res.json({ quote: toPublicQuoteReceipt(found) });
    } catch {
      return res.status(500).json({ error: 'Unable to retrieve quote.' });
    }
  }
);

// Persist Newsletter Subscriptions
app.post(
  '/api/newsletter',
  enforceRateLimit(writeLimiter),
  requireJsonBody,
  async (req, res) => {
    try {
      const rawEmail = sanitizeTextInput(
        (req.body as { email?: unknown })?.email,
        160
      ).toLowerCase();

      const isValidEmail =
        rawEmail.length >= 5 &&
        rawEmail.length <= 160 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail) &&
        !rawEmail.includes('..');

      if (!isValidEmail) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const result = await updateStore((store) => {
        const exists = store.newsletter.some((sub) => sub.email === rawEmail);
        if (exists) {
          return {
            status: 'already_subscribed' as const,
            message:
              'You are already subscribed to Limuru Dairy cooperative updates.',
          };
        }
        store.newsletter.unshift({
          email: rawEmail,
          subscribedAt: new Date().toISOString(),
        });
        if (store.newsletter.length > MAX_STORED_NEWSLETTER) {
          store.newsletter.length = MAX_STORED_NEWSLETTER;
        }
        return {
          status: 'subscribed' as const,
          message: 'Thank you for joining the Limuru Dairy cooperative community.',
        };
      });

      return res.status(201).json(result);
    } catch {
      return res.status(500).json({ error: 'Unable to save subscription right now.' });
    }
  }
);

// Unknown API routes return clean JSON 404
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

function registerErrorHandler(targetApp: express.Express) {
  // Malformed JSON & fallback error handler (prevents leaking stack traces)
  targetApp.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const errObj = err as { type?: string; status?: number };
    if (errObj?.type === 'entity.too.large' || errObj?.status === 413) {
      return res.status(413).json({ error: 'Request payload is too large.' });
    }
    if (err instanceof SyntaxError || errObj?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON request body.' });
    }
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  });
}

if (process.env.VERCEL) {
  registerErrorHandler(app);
} else {
  (async () => {
    if (isProd) {
      const distDir = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distDir, { dotfiles: 'deny', index: 'index.html' }));
      app.get('*', (req, res) => {
        if (isSensitiveHiddenPath(req.path)) {
          return res.status(404).end();
        }
        return res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    registerErrorHandler(app);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Limuru Dairy server listening on http://localhost:${PORT}`);
    });
  })().catch((err) => {
    console.error('Failed to start local server:', err);
    process.exit(1);
  });
}

export default app;
