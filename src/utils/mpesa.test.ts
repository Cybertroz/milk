import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDarajaStkPassword,
  buildOrderCallbackUrl,
  createMpesaCallbackToken,
  formatDarajaTimestamp,
  parseDarajaQueryResponse,
  parseDarajaStkCallback,
  resolveMpesaConfig,
  verifyMpesaCallbackToken,
} from './mpesa.ts';

test('formatDarajaTimestamp formats UTC instants in EAT (UTC+3) YYYYMMDDHHmmss', () => {
  const utcDate = new Date('2026-11-24T10:05:09Z');
  assert.equal(formatDarajaTimestamp(utcDate), '20261124130509');
});

test('buildDarajaStkPassword matches Safaricom base64(ShortCode + Passkey + Timestamp)', () => {
  const pwd = buildDarajaStkPassword('174379', 'testpasskey', '20261124130509');
  const decoded = Buffer.from(pwd, 'base64').toString('utf8');
  assert.equal(decoded, '174379testpasskey20261124130509');
});

test('resolveMpesaConfig distinguishes sandbox vs production and Paybill vs Buy Goods Till', () => {
  const unconfigured = resolveMpesaConfig({}, 'https://limuru-dairy.vercel.app');
  assert.equal(unconfigured.isConfigured, false);
  assert.equal(unconfigured.env, 'sandbox');
  assert.equal(unconfigured.baseUrl, 'https://sandbox.safaricom.co.ke');
  assert.equal(unconfigured.transactionType, 'CustomerPayBillOnline');
  assert.equal(
    unconfigured.callbackBaseUrl,
    'https://limuru-dairy.vercel.app/api/mpesa/callback'
  );

  const tillProd = resolveMpesaConfig({
    MPESA_ENV: 'production',
    MPESA_CONSUMER_KEY: 'key123',
    MPESA_CONSUMER_SECRET: 'sec123',
    MPESA_SHORTCODE: '123456',
    MPESA_PARTY_B: '654321',
    MPESA_PASSKEY: 'pass123',
    MPESA_TRANSACTION_TYPE: 'CustomerBuyGoodsOnline',
    MPESA_CALLBACK_URL: 'https://limuru.co.ke/api/mpesa/callback',
  });
  assert.equal(tillProd.isConfigured, true);
  assert.equal(tillProd.baseUrl, 'https://api.safaricom.co.ke');
  assert.equal(tillProd.transactionType, 'CustomerBuyGoodsOnline');
  assert.equal(tillProd.shortCode, '123456');
  assert.equal(tillProd.partyB, '654321');
});

test('callback HMAC token signs per order and rejects tampering', () => {
  const secret = 'test-webhook-secret-value';
  const token = createMpesaCallbackToken('LDF-12345678', secret);
  assert.equal(verifyMpesaCallbackToken('LDF-12345678', token, secret), true);
  assert.equal(verifyMpesaCallbackToken('LDF-99999999', token, secret), false);
  assert.equal(verifyMpesaCallbackToken('LDF-12345678', 'bad-token', secret), false);

  const url = buildOrderCallbackUrl('https://example.com/api/mpesa/callback', 'LDF-12345678', secret);
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('order'), 'LDF-12345678');
  assert.equal(parsed.searchParams.get('sig'), token);
});

test('parseDarajaStkCallback extracts receipt metadata on success and handles cancellation', () => {
  const successBody = {
    Body: {
      stkCallback: {
        MerchantRequestID: '29115-34620561-1',
        CheckoutRequestID: 'ws_CO_191220191020363925',
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount', Value: 450 },
            { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
            { Name: 'TransactionDate', Value: 20261124130545 },
            { Name: 'PhoneNumber', Value: 254713833814 },
          ],
        },
      },
    },
  };

  const parsedSuccess = parseDarajaStkCallback(successBody);
  assert.ok(parsedSuccess);
  assert.equal(parsedSuccess.isSuccess, true);
  assert.equal(parsedSuccess.isCancelled, false);
  assert.equal(parsedSuccess.mpesaReceiptNumber, 'NLJ7RT61SV');
  assert.equal(parsedSuccess.amountKes, 450);
  assert.equal(parsedSuccess.phoneNumber, '254713833814');

  const cancelled = parseDarajaStkCallback({
    Body: {
      stkCallback: {
        MerchantRequestID: 'req-1',
        CheckoutRequestID: 'ws_CO_cancel',
        ResultCode: 1032,
        ResultDesc: 'Request cancelled by user',
      },
    },
  });
  assert.ok(cancelled);
  assert.equal(cancelled.isSuccess, false);
  assert.equal(cancelled.isCancelled, true);
});

test('parseDarajaQueryResponse handles pending, cancelled, and completed states cleanly', () => {
  const pending = parseDarajaQueryResponse({
    errorCode: '500.001.1001',
    errorMessage: 'The transaction is being processed',
  });
  assert.ok(pending);
  assert.equal(pending.isPending, true);
  assert.equal(pending.isSuccess, false);

  const completed = parseDarajaQueryResponse({
    ResponseCode: '0',
    CheckoutRequestID: 'ws_CO_done',
    MerchantRequestID: 'm-1',
    ResultCode: '0',
    ResultDesc: 'The service request is processed successfully.',
  });
  assert.ok(completed);
  assert.equal(completed.isPending, false);
  assert.equal(completed.isSuccess, true);
});
