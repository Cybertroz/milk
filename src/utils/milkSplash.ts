import type { FlavourKey } from '../types/dairy';

export interface SplashPalette {
  rimColor: string;
  innerGlow: string;
  shadowTint: string;
  dropletAccent: string;
}

export interface SplashDroplet {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tiltDeg: number;
  burstX: number;
  burstY: number;
  delayMs: number;
}

const PALETTES: Record<FlavourKey, SplashPalette> = {
  strawberry: {
    rimColor: 'rgba(244, 114, 182, 0.24)',
    innerGlow: 'rgba(255, 228, 240, 0.72)',
    shadowTint: '#dbeeff',
    dropletAccent: '#fce7f3',
  },
  vanilla: {
    rimColor: 'rgba(245, 158, 11, 0.20)',
    innerGlow: 'rgba(254, 247, 224, 0.72)',
    shadowTint: '#dceefa',
    dropletAccent: '#fef9c3',
  },
  'lemon-biscuit': {
    rimColor: 'rgba(132, 204, 22, 0.22)',
    innerGlow: 'rgba(244, 252, 226, 0.72)',
    shadowTint: '#d8eefc',
    dropletAccent: '#ecfccb',
  },
  passion: {
    rimColor: 'rgba(168, 85, 247, 0.22)',
    innerGlow: 'rgba(245, 236, 255, 0.72)',
    shadowTint: '#dcecfd',
    dropletAccent: '#f3e8ff',
  },
  'long-life-milk': {
    rimColor: 'rgba(39, 168, 236, 0.28)',
    innerGlow: 'rgba(232, 247, 255, 0.78)',
    shadowTint: '#cfeafb',
    dropletAccent: '#e0f2fe',
  },
  all: {
    rimColor: 'rgba(39, 168, 236, 0.26)',
    innerGlow: 'rgba(232, 247, 255, 0.75)',
    shadowTint: '#cfeafb',
    dropletAccent: '#e0f2fe',
  },
};

export function getSplashPalette(flavour: FlavourKey): SplashPalette {
  return PALETTES[flavour] ?? PALETTES['long-life-milk'];
}

/**
 * Generates deterministic radial droplet coordinates around a sculpted 640x480
 * liquid crown splash canvas, biased outward along the upper & lateral arcs.
 */
export function buildCrownDroplets(): SplashDroplet[] {
  const specs = [
    { id: 'd-nw-1', cx: 112, cy: 118, rx: 11, ry: 7.5, tiltDeg: -36, burstX: -22, burstY: -18, delayMs: 40 },
    { id: 'd-nw-2', cx: 74, cy: 176, rx: 7.5, ry: 5.5, tiltDeg: -22, burstX: -26, burstY: -10, delayMs: 90 },
    { id: 'd-nw-3', cx: 158, cy: 76, rx: 6.5, ry: 6.5, tiltDeg: 0, burstX: -14, burstY: -22, delayMs: 120 },
    { id: 'd-ne-1', cx: 528, cy: 116, rx: 11.5, ry: 7.5, tiltDeg: 34, burstX: 22, burstY: -18, delayMs: 50 },
    { id: 'd-ne-2', cx: 568, cy: 178, rx: 8, ry: 5.5, tiltDeg: 20, burstX: 26, burstY: -10, delayMs: 100 },
    { id: 'd-ne-3', cx: 482, cy: 74, rx: 6.5, ry: 6.5, tiltDeg: 0, burstX: 14, burstY: -22, delayMs: 130 },
    { id: 'd-w-low', cx: 88, cy: 274, rx: 9.5, ry: 6, tiltDeg: -14, burstX: -24, burstY: 6, delayMs: 70 },
    { id: 'd-e-low', cx: 552, cy: 272, rx: 9.5, ry: 6, tiltDeg: 14, burstX: 24, burstY: 6, delayMs: 80 },
    { id: 'd-top-l', cx: 218, cy: 52, rx: 5.5, ry: 5.5, tiltDeg: -12, burstX: -10, burstY: -24, delayMs: 150 },
    { id: 'd-top-r', cx: 422, cy: 54, rx: 5.5, ry: 5.5, tiltDeg: 12, burstX: 10, burstY: -24, delayMs: 160 },
  ];
  return specs;
}
