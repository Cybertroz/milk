import React, { useMemo } from 'react';
import type { FlavourKey } from '../types/dairy';
import { buildCrownDroplets, getSplashPalette } from '../utils/milkSplash';

interface MilkCrownSplashProps {
  flavour: FlavourKey;
  burstKey: string;
  isPaused?: boolean;
}

/**
 * Artisanal multi-layered liquid milk crown & floor ripple behind the hero
 * showcase centerpiece. Uses separate static positioning wrappers so CSS keyframe
 * bursts never collide with Tailwind individual `translate` utilities.
 */
export function MilkCrownSplash({
  flavour,
  burstKey,
  isPaused = false,
}: MilkCrownSplashProps) {
  const palette = getSplashPalette(flavour);
  const droplets = useMemo(() => buildCrownDroplets(), []);

  return (
    <>
      {/* Rear Swirling Milk Plume Crown & Radiating Droplets */}
      <div
        data-testid="hero-milk-splash-crown"
        aria-hidden="true"
        className="pointer-events-none print-hide absolute inset-0 flex items-center justify-center z-[5] select-none overflow-visible"
      >
        <div
          key={`crown-${burstKey}`}
          className={`w-[min(80vw,360px)] sm:w-[min(74vw,470px)] lg:w-[min(42vw,540px)] aspect-[4/3] -translate-y-[4%] ${
            isPaused ? '' : 'animate-milk-splash-burst'
          }`}
        >
          <svg
            viewBox="0 0 640 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible drop-shadow-[0_18px_30px_rgba(10,116,181,0.15)]"
          >
            <defs>
              <linearGradient
                id={`milkCreamBody-${burstKey}`}
                x1="100"
                y1="95"
                x2="540"
                y2="395"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="52%" stopColor="#f5fbff" stopOpacity="0.94" />
                <stop offset="100%" stopColor={palette.shadowTint} stopOpacity="0.88" />
              </linearGradient>

              <linearGradient
                id={`milkRibbonLight-${burstKey}`}
                x1="150"
                y1="140"
                x2="490"
                y2="375"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                <stop offset="50%" stopColor={palette.innerGlow} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.96" />
              </linearGradient>

              <radialGradient id={`milkPoolGlow-${burstKey}`} cx="50%" cy="66%" r="48%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
                <stop offset="56%" stopColor={palette.innerGlow} />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>

              <linearGradient
                id={`milkRimStroke-${burstKey}`}
                x1="80"
                y1="100"
                x2="560"
                y2="380"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor={palette.rimColor} />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Soft luminous cream halo directly behind the pack */}
            <ellipse
              cx="320"
              cy="308"
              rx="208"
              ry="74"
              fill={`url(#milkPoolGlow-${burstKey})`}
            />

            {/* Asymmetrical High-Speed Milk Crown Plumes flaring around both pack flanks */}
            <path
              d="M172 346
                 C128 328, 92 292, 86 244
                 C81 206, 102 172, 122 178
                 C136 182, 124 214, 142 232
                 C158 248, 178 220, 178 182
                 C178 148, 194 118, 212 128
                 C226 136, 206 176, 224 212
                 C246 256, 286 276, 320 276
                 C354 276, 394 256, 416 212
                 C434 176, 414 136, 428 128
                 C446 118, 462 148, 462 182
                 C462 220, 482 248, 498 232
                 C516 214, 504 182, 518 178
                 C538 172, 559 206, 554 244
                 C548 292, 512 328, 468 346
                 C422 365, 372 374, 320 374
                 C268 374, 218 365, 172 346 Z"
              fill={`url(#milkCreamBody-${burstKey})`}
              stroke={`url(#milkRimStroke-${burstKey})`}
              strokeWidth="1.75"
            />

            {/* Sculpted Swirl Collar & Tapered Liquid Whip Tips */}
            <path
              d="M148 342
                 C122 320, 114 282, 134 258
                 C146 244, 160 256, 174 278
                 C196 312, 250 330, 320 330
                 C390 330, 444 312, 466 278
                 C480 256, 494 244, 506 258
                 C526 282, 518 320, 492 342
                 C446 380, 386 392, 320 392
                 C254 392, 194 380, 148 342 Z"
              fill={`url(#milkRibbonLight-${burstKey})`}
            />

            {/* Specular Liquid Catchlights */}
            <path
              d="M108 240 C102 212, 110 190, 122 186"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.92"
            />
            <path
              d="M532 240 C538 212, 530 190, 518 186"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.92"
            />
            <path
              d="M196 168 C196 148, 203 136, 211 136"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.88"
            />
            <path
              d="M444 168 C444 148, 437 136, 429 136"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.88"
            />

            {/* Radiant Orbiting Liquid Milk Droplets */}
            {droplets.map((drop) => (
              <g
                key={drop.id}
                className="animate-milk-droplet"
                style={
                  {
                    '--drop-x': `${drop.burstX}px`,
                    '--drop-y': `${drop.burstY}px`,
                    animationDelay: `${drop.delayMs}ms`,
                  } as React.CSSProperties
                }
              >
                <g transform={`translate(${drop.cx} ${drop.cy}) rotate(${drop.tiltDeg})`}>
                  <ellipse
                    cx="1"
                    cy="2"
                    rx={drop.rx}
                    ry={drop.ry}
                    fill={palette.shadowTint}
                    opacity="0.82"
                  />
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={drop.rx}
                    ry={drop.ry}
                    fill="#ffffff"
                    stroke={palette.dropletAccent}
                    strokeWidth="1"
                  />
                  <ellipse
                    cx={-drop.rx * 0.28}
                    cy={-drop.ry * 0.28}
                    rx={Math.max(1.6, drop.rx * 0.34)}
                    ry={Math.max(1.2, drop.ry * 0.28)}
                    fill="#ffffff"
                  />
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Low Grounded Creamy Splash Pool & Micro-Beads at base shadow (below 500ml text) */}
      <div
        data-testid="hero-milk-splash-lip"
        aria-hidden="true"
        className="pointer-events-none print-hide absolute left-0 right-0 top-[82%] flex justify-center z-[31] select-none overflow-visible"
      >
        <div
          key={`lip-${burstKey}`}
          className={`w-[min(68vw,320px)] sm:w-[min(56vw,350px)] h-[46px] -translate-y-1/2 ${
            isPaused ? '' : 'animate-milk-lip-rise'
          }`}
        >
          <svg
            viewBox="0 0 380 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible drop-shadow-[0_6px_14px_rgba(10,116,181,0.14)]"
          >
            <defs>
              <linearGradient
                id={`milkFloorWave-${burstKey}`}
                x1="190"
                y1="10"
                x2="190"
                y2="54"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#eaf6fe" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#dff1fb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M36 28
                 C72 44, 130 50, 190 50
                 C250 50, 308 44, 344 28
                 C356 22, 362 12, 352 9
                 C344 7, 336 20, 308 28
                 C272 38, 232 41, 190 41
                 C148 41, 108 38, 72 28
                 C44 20, 36 7, 28 9
                 C18 12, 24 22, 36 28 Z"
              fill={`url(#milkFloorWave-${burstKey})`}
            />
            <path
              d="M54 31 C100 44, 146 47, 190 47 C234 47, 280 44, 326 31"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.92"
            />
            <circle cx="40" cy="4" r="3.5" fill="#ffffff" />
            <circle cx="340" cy="4" r="3.5" fill="#ffffff" />
            <circle cx="20" cy="-2" r="2.2" fill="#ffffff" opacity="0.88" />
            <circle cx="360" cy="-2" r="2.2" fill="#ffffff" opacity="0.88" />
          </svg>
        </div>
      </div>
    </>
  );
}
