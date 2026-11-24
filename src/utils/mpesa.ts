import crypto from 'node:crypto';
import { timingSafeEqualAscii } from './serverSecurity.ts';

export type MpesaEnvironment = 'sandbox' | 'production';
export type MpesaTransactionType =
  | 'CustomerPayBillOnline'
  | 'CustomerBuyGoodsOnline';

export interface MpesaRuntimeConfig {
  env: MpesaEnvironment;
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  partyB: string;
  passkey: string;
  transactionType: MpesaTransactionType;
  callbackBaseUrl: string;
  callbackSecret: string;
  isConfigured: boolean;
}

export interface ParsedDarajaStkCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  isSuccess: boolean;
  isCancelled: boolean;
  mpesaReceiptNumber?: string;
  amountKes?: number;
  transactionDate?: string;
  phoneNumber?: string;
}

export interface ParsedDarajaQueryResponse {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  resultCode: number | null;
  resultDesc: string;
  isPending: boolean;
  isSuccess: boolean;
  isCancelled: boolean;
}

const SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_BASE_URL = 'https://api.safaricom.co.ke';

const EPHEMERAL_CALLBACK_KEY = crypto.randomBytes(32).toString('hex');

/**
 * Formats a Date into Safaricom Daraja's required YYYYMMDDHHmmss timestamp
 * in East Africa Time (EAT / Africa/Nairobi, UTC+3).
 */
export function formatDarajaTimestamp(date = new Date()): string {
  const eatTime = new Date(date.getTime() + 3 * 60 * 60_000);
  const yyyy = eatTime.getUTCFullYear();
  const mm = String(eatTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(eatTime.getUTCDate()).padStart(2, '0');
  const hh = String(eatTime.getUTCHours()).padStart(2, '0');
  const min = String(eatTime.getUTCMinutes()).padStart(2, '0');
  const ss = String(eatTime.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

/**
 * Computes Safaricom's Base64(BusinessShortCode + Passkey + Timestamp) password.
 */
export function buildDarajaStkPassword(
  shortCode: string,
  passkey: string,
  timestamp: string
): string {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`, 'utf8').toString('base64');
}

/**
 * Resolves Daraja runtime configuration strictly from server environment variables.
 * Uses allowlisted Safaricom endpoints only.
 */
export function resolveMpesaConfig(
  env: Record<string, string | undefined> = process.env,
  requestOrigin?: string
): MpesaRuntimeConfig {
  const rawEnv = (env.MPESA_ENV ?? 'sandbox').trim().toLowerCase();
  const mpesaEnv: MpesaEnvironment = rawEnv === 'production' ? 'production' : 'sandbox';
  const baseUrl = mpesaEnv === 'production' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;

  const consumerKey = (env.MPESA_CONSUMER_KEY ?? '').trim();
  const consumerSecret = (env.MPESA_CONSUMER_SECRET ?? '').trim();
  const shortCode = (env.MPESA_SHORTCODE ?? '').trim();
  const partyB = (env.MPESA_PARTY_B ?? shortCode).trim();
  const passkey = (env.MPESA_PASSKEY ?? '').trim();

  const rawTxType = (env.MPESA_TRANSACTION_TYPE ?? 'CustomerPayBillOnline').trim();
  const transactionType: MpesaTransactionType =
    rawTxType === 'CustomerBuyGoodsOnline'
      ? 'CustomerBuyGoodsOnline'
      : 'CustomerPayBillOnline';

  const configuredCallback = (env.MPESA_CALLBACK_URL ?? '').trim();
  let callbackBaseUrl = '';
  if (configuredCallback) {
    try {
      const parsed = new URL(configuredCallback);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        callbackBaseUrl = parsed.toString().replace(/\/+$/, '');
      }
    } catch {
      callbackBaseUrl = '';
    }
  } else if (requestOrigin) {
    try {
      const parsed = new URL(requestOrigin);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        callbackBaseUrl = `${parsed.origin}/api/mpesa/callback`;
      }
    } catch {
      callbackBaseUrl = '';
    }
  }

  const callbackSecret =
    (env.MPESA_CALLBACK_SECRET ?? '').trim() ||
    (env.SESSION_SECRET ?? '').trim() ||
    EPHEMERAL_CALLBACK_KEY;

  const isConfigured = Boolean(
    consumerKey &&
      consumerSecret &&
      shortCode &&
      passkey &&
      /^\d{4,10}$/.test(shortCode)
  );

  return {
    env: mpesaEnv,
    baseUrl,
    consumerKey,
    consumerSecret,
    shortCode,
    partyB: partyB || shortCode,
    passkey,
    transactionType,
    callbackBaseUrl,
    callbackSecret,
    isConfigured,
  };
}

/**
 * Generates an HMAC token scoped to a specific orderNumber for authenticating
 * Daraja callback webhook deliveries.
 */
export function createMpesaCallbackToken(
  orderNumber: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`mpesa-cb:${orderNumber.trim().toUpperCase()}`)
    .digest('hex');
}

export function verifyMpesaCallbackToken(
  orderNumber: string,
  providedToken: unknown,
  secret: string
): boolean {
  if (typeof providedToken !== 'string') return false;
  const clean = providedToken.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(clean)) return false;
  const expected = createMpesaCallbackToken(orderNumber, secret).toLowerCase();
  return timingSafeEqualAscii(clean, expected);
}

/**
 * Builds an Order-scoped Safaricom CallbackURL with HMAC verification params.
 */
export function buildOrderCallbackUrl(
  callbackBaseUrl: string,
  orderNumber: string,
  callbackSecret: string
): string {
  const url = new URL(callbackBaseUrl);
  url.searchParams.set('order', orderNumber);
  url.searchParams.set('sig', createMpesaCallbackToken(orderNumber, callbackSecret));
  return url.toString();
}

/**
 * Parses and validates Safaricom's asynchronous STK Push callback body.
 */
export function parseDarajaStkCallback(body: unknown): ParsedDarajaStkCallback | null {
  if (!body || typeof body !== 'object') return null;
  const stk = (body as { Body?: { stkCallback?: Record<string, unknown> } }).Body
    ?.stkCallback;
  if (!stk || typeof stk !== 'object') return null;

  const merchantRequestId =
    typeof stk.MerchantRequestID === 'string' ? stk.MerchantRequestID.trim() : '';
  const checkoutRequestId =
    typeof stk.CheckoutRequestID === 'string' ? stk.CheckoutRequestID.trim() : '';
  const resultCode = Number(stk.ResultCode);
  const resultDesc =
    typeof stk.ResultDesc === 'string' ? stk.ResultDesc.trim().slice(0, 240) : '';

  if (!checkoutRequestId || !Number.isFinite(resultCode)) {
    return null;
  }

  const result: ParsedDarajaStkCallback = {
    merchantRequestId,
    checkoutRequestId,
    resultCode,
    resultDesc: resultDesc || (resultCode === 0 ? 'Payment confirmed.' : 'Payment not completed.'),
    isSuccess: resultCode === 0,
    isCancelled: resultCode === 1032,
  };

  const items = (stk.CallbackMetadata as { Item?: unknown } | undefined)?.Item;
  if (Array.isArray(items)) {
    for (const entry of items) {
      if (!entry || typeof entry !== 'object') continue;
      const name = (entry as { Name?: unknown }).Name;
      const value = (entry as { Value?: unknown }).Value;
      if (name === 'MpesaReceiptNumber' && (typeof value === 'string' || typeof value === 'number')) {
        result.mpesaReceiptNumber = String(value).trim().slice(0, 32);
      } else if (name === 'Amount' && (typeof value === 'number' || typeof value === 'string')) {
        const amt = Number(value);
        if (Number.isFinite(amt)) result.amountKes = amt;
      } else if (name === 'TransactionDate' && (typeof value === 'string' || typeof value === 'number')) {
        result.transactionDate = String(value).trim().slice(0, 24);
      } else if (name === 'PhoneNumber' && (typeof value === 'string' || typeof value === 'number')) {
        result.phoneNumber = String(value).trim().slice(0, 20);
      }
    }
  }

  return result;
}

/**
 * Parses Safaricom Daraja's synchronous STK Push Query response.
 */
export function parseDarajaQueryResponse(body: unknown): ParsedDarajaQueryResponse | null {
  if (!body || typeof body !== 'object') return null;
  const data = body as Record<string, unknown>;

  const errorCode = typeof data.errorCode === 'string' ? data.errorCode.trim() : '';
  // Safaricom returns errorCode 500.001.1001 ("The transaction is being processed") while waiting for user PIN
  if (errorCode === '500.001.1001') {
    return {
      checkoutRequestId: '',
      merchantRequestId: '',
      responseCode: errorCode,
      resultCode: null,
      resultDesc: 'Waiting for M-Pesa PIN entry on customer handset.',
      isPending: true,
      isSuccess: false,
      isCancelled: false,
    };
  }

  const checkoutRequestId =
    typeof data.CheckoutRequestID === 'string' ? data.CheckoutRequestID.trim() : '';
  const merchantRequestId =
    typeof data.MerchantRequestID === 'string' ? data.MerchantRequestID.trim() : '';
  const responseCode =
    typeof data.ResponseCode === 'string' ? data.ResponseCode.trim() : '';

  if (data.ResultCode === undefined || data.ResultCode === null || data.ResultCode === '') {
    if (responseCode === '0') {
      return {
        checkoutRequestId,
        merchantRequestId,
        responseCode,
        resultCode: null,
        resultDesc: 'M-Pesa prompt is still awaiting PIN confirmation.',
        isPending: true,
        isSuccess: false,
        isCancelled: false,
      };
    }
    return null;
  }

  const resultCode = Number(data.ResultCode);
  if (!Number.isFinite(resultCode)) return null;

  const resultDesc =
    typeof data.ResultDesc === 'string'
      ? data.ResultDesc.trim().slice(0, 240)
      : resultCode === 0
        ? 'The service request is processed successfully.'
        : 'Transaction was not completed.';

  return {
    checkoutRequestId,
    merchantRequestId,
    responseCode,
    resultCode,
    resultDesc,
    isPending: false,
    isSuccess: resultCode === 0,
    isCancelled: resultCode === 1032,
  };
}

let cachedToken: { token: string; expiresAt: number; cacheKey: string } | null = null;

/**
 * Obtains a short-lived Daraja OAuth access token from Safaricom's allowlisted host.
 */
export async function fetchDarajaAccessToken(config: MpesaRuntimeConfig): Promise<string> {
  if (!config.isConfigured) {
    throw new Error('Safaricom Daraja credentials are not configured.');
  }

  const cacheKey = `${config.baseUrl}:${config.consumerKey}`;
  if (cachedToken && cachedToken.cacheKey === cacheKey && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const basicAuth = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
    'utf8'
  ).toString('base64');

  const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Daraja OAuth request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: string;
  };
  const accessToken = typeof json.access_token === 'string' ? json.access_token.trim() : '';
  if (!accessToken) {
    throw new Error('Daraja OAuth response did not include an access token.');
  }

  const ttlSeconds = Math.max(60, Number(json.expires_in) || 3599);
  cachedToken = {
    token: accessToken,
    expiresAt: Date.now() + (ttlSeconds - 45) * 1000,
    cacheKey,
  };

  return accessToken;
}

export interface DarajaStkPushInitiateParams {
  config: MpesaRuntimeConfig;
  phone254: string;
  amountKes: number;
  orderNumber: string;
}

export interface DarajaStkPushInitiateResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
}

export async function initiateDarajaStkPush(
  params: DarajaStkPushInitiateParams
): Promise<DarajaStkPushInitiateResult> {
  const { config, phone254, amountKes, orderNumber } = params;
  if (!config.callbackBaseUrl) {
    throw new Error('M-Pesa callback URL could not be determined.');
  }

  const accessToken = await fetchDarajaAccessToken(config);
  const timestamp = formatDarajaTimestamp();
  const password = buildDarajaStkPassword(config.shortCode, config.passkey, timestamp);
  const callbackUrl = buildOrderCallbackUrl(
    config.callbackBaseUrl,
    orderNumber,
    config.callbackSecret
  );

  const safeAccountRef = orderNumber.replace(/[^A-Za-z0-9-]/g, '').slice(0, 12) || 'LimuruDairy';

  const payload = {
    BusinessShortCode: config.shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: config.transactionType,
    Amount: Math.max(1, Math.round(amountKes)),
    PartyA: phone254,
    PartyB: config.partyB,
    PhoneNumber: phone254,
    CallBackURL: callbackUrl,
    AccountReference: safeAccountRef,
    TransactionDesc: 'Limuru Dairy',
  };

  const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await response.json().catch(() => ({}))) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    CustomerMessage?: string;
    errorMessage?: string;
  };

  if (!response.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        'Safaricom Daraja declined the STK Push initiation.'
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID ?? '',
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage:
      data.CustomerMessage ||
      'Success. Request accepted for processing. Enter your M-Pesa PIN on your phone.',
  };
}

export async function queryDarajaStkStatus(
  config: MpesaRuntimeConfig,
  checkoutRequestId: string
): Promise<ParsedDarajaQueryResponse | null> {
  const accessToken = await fetchDarajaAccessToken(config);
  const timestamp = formatDarajaTimestamp();
  const password = buildDarajaStkPassword(config.shortCode, config.passkey, timestamp);

  const response = await fetch(`${config.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  const data = await response.json().catch(() => null);
  return parseDarajaQueryResponse(data);
}
