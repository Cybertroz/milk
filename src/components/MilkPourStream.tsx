import React from 'react';

/**
 * Creative CSS-based milk pour stream component that activates on page load,
 * flowing a stylized stream of rich cream down in the background space
 * between the editorial copy and product stage.
 */
export function MilkPourStream() {
  return (
    <div
      data-testid="milk-pour-stream"
      aria-hidden="true"
      className="pointer-events-none print-hide absolute -top-16 left-[35%] -translate-x-1/2 w-full max-w-3xl h-[560px] z-[2] overflow-visible select-none opacity-75"
    >
      <svg
        viewBox="0 0 800 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-milk-pour overflow-visible"
      >
        <defs>
          <linearGradient id="milkStreamGrad" x1="400" y1="0" x2="400" y2="530" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#f4fbff" stopOpacity="0.88" />
            <stop offset="70%" stopColor="#e1f2fd" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#c3e8fb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="milkStreamSheen" x1="392" y1="0" x2="408" y2="530" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
          <filter id="milkGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer glowing background milk stream aura */}
        <path
          d="M375 0 C365 150, 435 300, 415 410 C408 458, 376 496, 400 530 C424 496, 392 458, 428 410 C444 300, 374 150, 424 0 Z"
          fill="rgba(143, 213, 247, 0.38)"
          filter="url(#milkGlow)"
        />

        {/* Primary flowing milk stream column in background space */}
        <path
          d="M382 0 C378 140, 426 285, 410 400 C404 445, 384 485, 400 530 C416 485, 396 445, 416 400 C400 285, 448 140, 420 0 Z"
          fill="url(#milkStreamGrad)"
        />

        {/* Central glossy light reflection streak */}
        <path
          d="M394 0 C392 130, 408 270, 402 390 C398 435, 392 475, 400 530 C408 475, 402 435, 408 390 C402 270, 418 130, 408 0 Z"
          fill="url(#milkStreamSheen)"
          opacity="0.9"
        />

        {/* Base splash ripple ring */}
        <ellipse
          cx="400"
          cy="532"
          rx="48"
          ry="14"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          className="animate-milk-ripple"
        />

        {/* Cascading falling droplets */}
        <circle cx="400" cy="50" r="5.5" fill="#ffffff" opacity="0.92" />
        <circle cx="405" cy="145" r="4.5" fill="#ffffff" opacity="0.88" />
        <circle cx="392" cy="235" r="5" fill="#ffffff" opacity="0.85" />
        <circle cx="410" cy="325" r="4" fill="#ffffff" opacity="0.8" />
      </svg>
    </div>
  );
}
