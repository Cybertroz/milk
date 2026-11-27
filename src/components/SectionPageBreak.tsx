import React from 'react';

type BreakVariant = 'horizon-wave' | 'cream-arch' | 'editorial-rule';

interface SectionPageBreakProps {
  variant?: BreakVariant;
  fromBg?: string;
  toBg?: string;
  ribbonColor?: string;
  label?: string;
  printBreakBefore?: boolean;
}

/**
 * Architectural section transition & print-safe page break divider.
 * Bridges contiguous sections cleanly on screen while preserving crisp
 * print/PDF pagination boundaries.
 */
export function SectionPageBreak({
  variant = 'horizon-wave',
  fromBg = '#ffffff',
  toBg = '#eef8fe',
  ribbonColor = 'rgba(143, 213, 247, 0.34)',
  label,
  printBreakBefore = false,
}: SectionPageBreakProps) {
  const breakClass = printBreakBefore ? 'print-page-break' : '';

  if (variant === 'editorial-rule') {
    return (
      <div
        aria-hidden={!label}
        className={`relative py-4 sm:py-5 ${breakClass}`}
        style={{ backgroundColor: fromBg }}
      >
        <div className="site-container flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#0a74b5]/22 to-[#0a74b5]/30" />
          <div className="flex items-center gap-2 shrink-0 text-[#0a74b5]">
            <span
              className="w-2 h-2 rotate-45 border border-[#0a74b5]/45 bg-[#eef8fe] inline-block"
              aria-hidden="true"
            />
            {label && (
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0a74b5]/80">
                {label}
              </span>
            )}
            <span
              className="w-2 h-2 rotate-45 border border-[#0a74b5]/45 bg-[#eef8fe] inline-block"
              aria-hidden="true"
            />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#0a74b5]/22 to-[#0a74b5]/30" />
        </div>
      </div>
    );
  }

  if (variant === 'cream-arch') {
    return (
      <div
        aria-hidden="true"
        className={`relative overflow-hidden leading-none select-none print-hide ${breakClass}`}
        style={{ backgroundColor: fromBg }}
      >
        <svg
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          className="block w-full h-9 sm:h-14"
        >
          <path
            d="M0,18 C360,64 1080,64 1440,18 L1440,72 L0,72 Z"
            fill={ribbonColor}
          />
          <path
            d="M0,30 C380,68 1060,68 1440,30 L1440,72 L0,72 Z"
            fill={toBg}
          />
          <path
            d="M0,30 C380,68 1060,68 1440,30"
            fill="none"
            stroke="rgba(39, 168, 236, 0.22)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden leading-none select-none print-hide ${breakClass}`}
      style={{ backgroundColor: fromBg }}
    >
      <svg
        viewBox="0 0 1440 84"
        preserveAspectRatio="none"
        className="block w-full h-10 sm:h-16"
      >
        <path
          d="M0,48 C260,6 560,72 900,32 C1140,4 1320,24 1440,44 L1440,84 L0,84 Z"
          fill={ribbonColor}
        />
        <path
          d="M0,58 C290,22 610,78 960,40 C1180,16 1330,34 1440,54 L1440,84 L0,84 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
