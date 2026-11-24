import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, buildWhatsAppOrderUrl, createOrderReceipt } from './catalog';
import {
  MAX_CART_LINE_ITEMS,
  MAX_ITEM_QUANTITY,
  deriveDisplayNameFromEmail,
  isSensitiveHiddenPath,
  normalizeKenyanPhone,
  parseSavedOrderLookup,
  sanitizeAndValidateEmail,
  sanitizeCartItemsClient,
  sanitizeTextInput,
} from './security';
import {
  EmailOtpStore,
  SlidingWindowRateLimiter,
  buildSecurityHeaders,
  createLookupCredentials,
  createSignedEmailSessionToken,
  generateSecureOrderNumber,
  generateSecureQuoteNumber,
  toPublicOrderReceipt,
  verifyRecordAccess,
  verifySignedEmailSessionToken,
} from './serverSecurity';

test('sanitizeTextInput strips control characters and enforces max length', () => {
  const dirty = '  Wanjiku\u0000\r\nKamau\x7f\tLtd  ';
  assert.equal(sanitizeTextInput(dirty, 50), 'Wanjiku Kamau Ltd');
  assert.equal(sanitizeTextInput('abcdef', 4), 'abcd');
  assert.equal(sanitizeTextInput(12345 as unknown as string, 20), '');
});

test('normalizeKenyanPhone normalizes valid formats and rejects invalid input', () => {
  assert.equal(normalizeKenyanPhone('0713833814'), '254713833814');
  assert.equal(normalizeKenyanPhone('+254 713-833-814'), '254713833814');
  assert.equal(normalizeKenyanPhone('254110123456'), '254110123456');
  assert.equal(normalizeKenyanPhone('0110123456'), '254110123456');
  assert.equal(normalizeKenyanPhone('12345'), '');
  assert.equal(normalizeKenyanPhone('0812345678'), '');
});

test('sanitizeCartItemsClient filters unknown IDs, caps quantities, and bounds distinct lines', () => {
  const allowed = new Set(PRODUCTS.map((p) => p.id));
  const cleaned = sanitizeCartItemsClient(
    [
      { productId: 'strawberry-500ml', quantity: 2 },
      { productId: 'strawberry-500ml', quantity: 3 },
      { productId: 'unknown-sku', quantity: 10 },
      { productId: 'vanilla-500ml', quantity: 9999 },
      { productId: 'passion-500ml', quantity: -5 },
      null,
    ],
    allowed
  );
  assert.deepEqual(cleaned, [{ productId: 'strawberry-500ml', quantity: 5 }]);

  const manyAllowed = new Set(
    Array.from({ length: 40 }, (_, i) => `sku-${i}`)
  );
  const overflowing = Array.from({ length: 40 }, (_, i) => ({
    productId: `sku-${i}`,
    quantity: 1,
  }));
  const bounded = sanitizeCartItemsClient(overflowing, manyAllowed);
  assert.equal(bounded.length, MAX_CART_LINE_ITEMS);
  assert.ok(bounded.every((item) => item.quantity <= MAX_ITEM_QUANTITY));
});

test('parseSavedOrderLookup validates localStorage lookup objects and rejects malformed input', () => {
  const valid = parseSavedOrderLookup(
    JSON.stringify({
      orderNumber: 'ldf-12345678',
      lookupToken: 'a'.repeat(48),
    })
  );
  assert.deepEqual(valid, {
    orderNumber: 'LDF-12345678',
    lookupToken: 'a'.repeat(48),
  });
  assert.deepEqual(parseSavedOrderLookup('LDF-654321'), {
    orderNumber: 'LDF-654321',
  });
  assert.equal(parseSavedOrderLookup('{"orderNumber":"INVALID"}'), null);
  assert.equal(parseSavedOrderLookup('not-json'), null);
});

test('isSensitiveHiddenPath blocks dotfiles, data directory, and traversal attempts', () => {
  assert.equal(isSensitiveHiddenPath('/.env'), true);
  assert.equal(isSensitiveHiddenPath('/.git/config'), true);
  assert.equal(isSensitiveHiddenPath('/data/limuru-dairy-store.json'), true);
  assert.equal(isSensitiveHiddenPath('/%2e%2e/.env'), true);
  assert.equal(isSensitiveHiddenPath('/server.ts'), true);
  assert.equal(isSensitiveHiddenPath('/.well-known/security.txt'), false);
  assert.equal(isSensitiveHiddenPath('/assets/aistudio/logo.png'), false);
  assert.equal(isSensitiveHiddenPath('/api/health'), false);
  assert.equal(
    isSensitiveHiddenPath('/node_modules/.vite/deps/react.js', {
      allowViteDevCache: true,
    }),
    false
  );
  assert.equal(
    isSensitiveHiddenPath('/node_modules/.vite/deps/react.js', {
      allowViteDevCache: false,
    }),
    true
  );
});

test('CSPRNG order and quote numbers match strict format without collisions', () => {
  const order = generateSecureOrderNumber();
  const quote = generateSecureQuoteNumber();
  assert.match(order, /^LDF-\d{8}$/);
  assert.match(quote, /^LDQ-\d{8}$/);
});

test('verifyRecordAccess enforces cryptographic token or matching normalized phone', () => {
  const { lookupToken, lookupTokenHash } = createLookupCredentials();

  assert.equal(
    verifyRecordAccess({
      storedPhone: '0713833814',
      storedTokenHash: lookupTokenHash,
      providedToken: lookupToken,
    }),
    true
  );

  assert.equal(
    verifyRecordAccess({
      storedPhone: '0713833814',
      storedTokenHash: lookupTokenHash,
      providedPhone: '+254713833814',
    }),
    true
  );

  assert.equal(
    verifyRecordAccess({
      storedPhone: '0713833814',
      storedTokenHash: lookupTokenHash,
      providedToken: '0'.repeat(48),
    }),
    false
  );

  assert.equal(
    verifyRecordAccess({
      storedPhone: '0713833814',
      storedTokenHash: lookupTokenHash,
      providedPhone: '0700000000',
    }),
    false
  );

  assert.equal(
    verifyRecordAccess({
      storedPhone: '0713833814',
      storedTokenHash: lookupTokenHash,
    }),
    false
  );
});

test('toPublicOrderReceipt strips internal lookupTokenHash', () => {
  const receipt = createOrderReceipt(
    [{ productId: 'strawberry-500ml', quantity: 2 }],
    {
      fullName: 'Peter Nduura',
      phone: '0713833814',
      address: 'Maziwa House, Limuru',
      paymentMethod: 'mpesa',
      deliveryZoneId: 'limuru-tigoni',
    },
    { persisted: true, orderNumber: 'LDF-12345678' }
  );
  const publicView = toPublicOrderReceipt({
    ...receipt,
    lookupTokenHash: 'secret-hash',
  });
  assert.equal('lookupTokenHash' in publicView, false);
  assert.equal(publicView.orderNumber, 'LDF-12345678');
});

test('SlidingWindowRateLimiter enforces limit and recovers after window elapses', () => {
  const limiter = new SlidingWindowRateLimiter({
    windowMs: 1000,
    maxRequests: 3,
    maxTrackedKeys: 2,
  });

  assert.equal(limiter.check('10.0.0.1', 100).allowed, true);
  assert.equal(limiter.check('10.0.0.1', 200).allowed, true);
  assert.equal(limiter.check('10.0.0.1', 300).allowed, true);

  const blocked = limiter.check('10.0.0.1', 400);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);

  assert.equal(limiter.check('10.0.0.1', 1500).allowed, true);
});

test('buildSecurityHeaders preserves preview iframe while applying CSP and browser protections', () => {
  const prodHeaders = buildSecurityHeaders({ isDev: false, isHttps: true });
  assert.equal('X-Frame-Options' in prodHeaders, false);
  assert.equal(prodHeaders['X-Content-Type-Options'], 'nosniff');
  assert.equal(
    prodHeaders['Strict-Transport-Security'],
    'max-age=31536000; includeSubDomains'
  );
  assert.ok(prodHeaders['Content-Security-Policy'].includes("script-src 'self'"));
  assert.ok(!prodHeaders['Content-Security-Policy'].includes('frame-ancestors'));

  const devHeaders = buildSecurityHeaders({ isDev: true, isHttps: false });
  assert.equal('Strict-Transport-Security' in devHeaders, false);
  assert.ok(
    devHeaders['Content-Security-Policy'].includes("script-src 'self' 'unsafe-inline'")
  );
});

test('buildWhatsAppOrderUrl strips newline/control characters from customer inputs', () => {
  const url = buildWhatsAppOrderUrl(
    [{ productId: 'strawberry-500ml', quantity: 1 }],
    {
      fullName: 'Alice\nPayment: PAID',
      phone: '0713833814',
      address: 'Tigoni\r\nRoad',
    }
  );
  const decoded = decodeURIComponent(url);
  assert.ok(decoded.startsWith('https://wa.me/254713833814?text='));
  assert.ok(decoded.includes('Name: Alice Payment: PAID'));
  assert.ok(!decoded.includes('\nPayment: PAID'));
});

test('sanitizeAndValidateEmail and deriveDisplayNameFromEmail clean email inputs safely', () => {
  assert.equal(sanitizeAndValidateEmail('  Wanjiku.Kamau@Example.CO.KE '), 'wanjiku.kamau@example.co.ke');
  assert.equal(sanitizeAndValidateEmail('bad\nemail@test.com'), '');
  assert.equal(sanitizeAndValidateEmail('not-an-email'), '');
  assert.equal(deriveDisplayNameFromEmail('wanjiku.kamau@example.com'), 'Wanjiku Kamau');
});

test('EmailOtpStore issues 6-digit OTPs, enforces attempts, and verifies cleanly once', () => {
  const store = new EmailOtpStore();
  const { code } = store.issue('shopper@limurudairy.co.ke', 1000);
  assert.match(code, /^\d{6}$/);

  const wrong = store.verify('shopper@limurudairy.co.ke', '000000', 2000);
  assert.equal(wrong.ok, false);

  const ok = store.verify('shopper@limurudairy.co.ke', code, 3000);
  assert.equal(ok.ok, true);

  // Replay with the same code after consumption must fail
  const replay = store.verify('shopper@limurudairy.co.ke', code, 4000);
  assert.equal(replay.ok, false);
});

test('HMAC email session tokens verify cleanly and reject tampering', () => {
  const token = createSignedEmailSessionToken({
    email: 'member@limurudairy.co.ke',
    displayName: 'Member',
    signedInAt: '2026-11-23T00:00:00.000Z',
  });
  const verified = verifySignedEmailSessionToken(token);
  assert.equal(verified?.email, 'member@limurudairy.co.ke');
  assert.equal(verified?.displayName, 'Member');

  const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(verifySignedEmailSessionToken(tampered), null);
});

test('createOrderReceipt stores sanitized customerEmail on confirmed orders', () => {
  const receipt = createOrderReceipt(
    [{ productId: 'strawberry-500ml', quantity: 2 }],
    {
      fullName: 'Wanjiku Kamau',
      email: 'Wanjiku@Example.com',
      phone: '0713833814',
      address: 'Tigoni Road, Limuru',
      paymentMethod: 'mpesa',
      deliveryZoneId: 'limuru-tigoni',
      deliveryWindowId: 'morning',
    },
    { persisted: true, orderNumber: 'LDF-87654321' }
  );
  assert.equal(receipt.customerEmail, 'wanjiku@example.com');
});
