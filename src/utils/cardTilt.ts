export interface CardTiltValues {
  rotateXDeg: number;
  rotateYDeg: number;
  shiftX: number;
  shiftY: number;
  glareX: number;
  glareY: number;
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

/**
 * Computes subtle 3D CSS transform angles, inner media parallax offsets,
 * and specular highlight coordinates from a normalized pointer position
 * within a product card bounding box.
 */
export function computeCardTilt(
  relX: number,
  relY: number,
  maxDeg = 5.5
): CardTiltValues {
  const x = clampUnit(relX);
  const y = clampUnit(relY);

  const nx = x * 2 - 1; // [-1, 1] left -> right
  const ny = y * 2 - 1; // [-1, 1] top -> bottom

  const rotateXDeg = Number((-ny * maxDeg).toFixed(2)) || 0;
  const rotateYDeg = Number((nx * maxDeg).toFixed(2)) || 0;

  // Inner pack shifts subtly opposite to rotation for dimensional depth
  const shiftX = Number((-nx * 4.5).toFixed(2)) || 0;
  const shiftY = Number((-ny * 4.5).toFixed(2)) || 0;

  const glareX = Number((x * 100).toFixed(1));
  const glareY = Number((y * 100).toFixed(1));

  return {
    rotateXDeg,
    rotateYDeg,
    shiftX,
    shiftY,
    glareX,
    glareY,
  };
}
