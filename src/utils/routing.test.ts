import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHashUrl, parseHashRoute } from './routing';

test('parseHashRoute maps top-level menu hashes cleanly', () => {
  assert.deepEqual(parseHashRoute(''), { page: 'home' });
  assert.deepEqual(parseHashRoute('#home'), { page: 'home' });
  assert.deepEqual(parseHashRoute('#about'), { page: 'about' });
  assert.deepEqual(parseHashRoute('#shop'), { page: 'shop' });
  assert.deepEqual(parseHashRoute('#gallery'), { page: 'gallery' });
  assert.deepEqual(parseHashRoute('#media'), { page: 'media' });
  assert.deepEqual(parseHashRoute('#farmer-services'), { page: 'farmer-services' });
  assert.deepEqual(parseHashRoute('#certifications'), { page: 'certifications' });
});

test('parseHashRoute resolves short and prefixed About Us section links', () => {
  assert.deepEqual(parseHashRoute('#history'), {
    page: 'about',
    sectionId: 'history',
  });
  assert.deepEqual(parseHashRoute('#about/history'), {
    page: 'about',
    sectionId: 'history',
  });
  assert.deepEqual(parseHashRoute('#managers-message'), {
    page: 'about',
    sectionId: 'managers-message',
  });
  assert.deepEqual(parseHashRoute('#who-we-are'), {
    page: 'about',
    sectionId: 'who-we-are',
  });
  assert.deepEqual(parseHashRoute('#vision'), {
    page: 'about',
    sectionId: 'vision-values',
  });
  assert.deepEqual(parseHashRoute('#objectives'), {
    page: 'about',
    sectionId: 'strategic-plan',
  });
});

test('parseHashRoute keeps active page when footer contact anchor is requested', () => {
  assert.deepEqual(parseHashRoute('#footer-contact'), { scrollFooter: true });
  assert.deepEqual(parseHashRoute('#contact'), { scrollFooter: true });
});

test('buildHashUrl creates clean short hashes for pages and About sections', () => {
  assert.equal(buildHashUrl('shop'), '#shop');
  assert.equal(buildHashUrl('about'), '#about');
  assert.equal(buildHashUrl('about', 'history'), '#history');
  assert.equal(buildHashUrl('about', 'vision-values'), '#vision-values');
});
