import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApiHeaders,
  parseWpInitialPage,
  resolveApiUrl,
  resolveAssetUrl,
} from './wpConfig.ts';

test('resolveAssetUrl preserves root paths by default and prefixes WordPress plugin bases cleanly', () => {
  assert.equal(
    resolveAssetUrl('/assets/aistudio/logo.png', ''),
    '/assets/aistudio/logo.png'
  );
  assert.equal(
    resolveAssetUrl(
      '/assets/aistudio/logo.png',
      'https://example.co.ke/wp-content/plugins/limuru-dairy/dist/'
    ),
    'https://example.co.ke/wp-content/plugins/limuru-dairy/dist/assets/aistudio/logo.png'
  );
  assert.equal(
    resolveAssetUrl(
      '/src/assets/images/cows.jpg',
      '/wp-content/uploads/limuru-dairy'
    ),
    '/wp-content/uploads/limuru-dairy/src/assets/images/cows.jpg'
  );
  assert.equal(
    resolveAssetUrl('https://cdn.example.com/photo.jpg', '/wp-content/uploads'),
    'https://cdn.example.com/photo.jpg'
  );
  assert.equal(
    resolveAssetUrl('data:image/png;base64,abc', '/wp-content/uploads'),
    'data:image/png;base64,abc'
  );
});

test('resolveApiUrl routes /api/* endpoints cleanly for both Express and WordPress REST API', () => {
  assert.equal(resolveApiUrl('/api/orders', ''), '/api/orders');
  assert.equal(resolveApiUrl('/orders', ''), '/api/orders');
  assert.equal(
    resolveApiUrl('/api/orders', 'https://example.co.ke/wp-json/limuru-dairy/v1/'),
    'https://example.co.ke/wp-json/limuru-dairy/v1/orders'
  );
  assert.equal(
    resolveApiUrl('/api/quotes', '/wp-json/limuru-dairy/v1'),
    '/wp-json/limuru-dairy/v1/quotes'
  );
});

test('buildApiHeaders includes X-WP-Nonce only when configured', () => {
  assert.deepEqual(
    buildApiHeaders({ 'Content-Type': 'application/json' }, ''),
    { 'Content-Type': 'application/json' }
  );
  assert.deepEqual(
    buildApiHeaders({ 'Content-Type': 'application/json' }, 'wp_nonce_123'),
    {
      'Content-Type': 'application/json',
      'X-WP-Nonce': 'wp_nonce_123',
    }
  );
});

test('parseWpInitialPage accepts valid routes and rejects unknown strings', () => {
  assert.equal(parseWpInitialPage('shop'), 'shop');
  assert.equal(parseWpInitialPage(' Certifications '), 'certifications');
  assert.equal(parseWpInitialPage('farmer-services'), 'farmer-services');
  assert.equal(parseWpInitialPage('<script>alert(1)</script>'), null);
  assert.equal(parseWpInitialPage(''), null);
});
