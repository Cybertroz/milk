import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCrownDroplets, getSplashPalette } from './milkSplash.ts';

test('getSplashPalette returns distinct dairy tints per flavour and falls back cleanly', () => {
  const strawberry = getSplashPalette('strawberry');
  const milk = getSplashPalette('long-life-milk');
  assert.notEqual(strawberry.rimColor, milk.rimColor);
  assert.ok(strawberry.dropletAccent.startsWith('#'));
  assert.ok(milk.shadowTint.startsWith('#'));
});

test('buildCrownDroplets produces bounded non-overlapping droplets around the splash arc', () => {
  const droplets = buildCrownDroplets();
  assert.equal(droplets.length, 10);
  const ids = new Set(droplets.map((d) => d.id));
  assert.equal(ids.size, droplets.length);
  for (const drop of droplets) {
    assert.ok(drop.cx > 0 && drop.cx < 640);
    assert.ok(drop.cy > 0 && drop.cy < 480);
    assert.ok(drop.rx > 0 && drop.ry > 0);
  }
});
