import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCardTilt } from './cardTilt';

test('computeCardTilt returns neutral 0-degree tilt at card center', () => {
  const res = computeCardTilt(0.5, 0.5, 5.5);
  assert.equal(res.rotateXDeg, 0);
  assert.equal(res.rotateYDeg, 0);
  assert.equal(res.shiftX, 0);
  assert.equal(res.shiftY, 0);
  assert.equal(res.glareX, 50);
  assert.equal(res.glareY, 50);
});

test('computeCardTilt tilts toward pointer quadrants within maxDeg bounds', () => {
  const topLeft = computeCardTilt(0, 0, 6);
  assert.equal(topLeft.rotateXDeg, 6);
  assert.equal(topLeft.rotateYDeg, -6);
  assert.equal(topLeft.glareX, 0);
  assert.equal(topLeft.glareY, 0);

  const bottomRight = computeCardTilt(1, 1, 6);
  assert.equal(bottomRight.rotateXDeg, -6);
  assert.equal(bottomRight.rotateYDeg, 6);
  assert.equal(bottomRight.glareX, 100);
  assert.equal(bottomRight.glareY, 100);
});

test('computeCardTilt clamps out-of-range coordinates safely', () => {
  const clamped = computeCardTilt(2.4, -1.2, 5.5);
  assert.equal(clamped.rotateXDeg, 5.5);
  assert.equal(clamped.rotateYDeg, 5.5);
  assert.equal(clamped.glareX, 100);
  assert.equal(clamped.glareY, 0);
});
