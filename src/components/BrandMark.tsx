import React, { useState } from 'react';
import { Milk } from 'lucide-react';

import { UPLOADED_ASSETS } from '../utils/catalog';
import { getImageDimensions } from '../utils/imageDimensions';
import { resolveAssetUrl } from '../utils/wpConfig';

const WHITE_BG_ASSET_FRAGMENTS = ['lemon_design_b', 'passion_design_b'];

export function isWhiteBackgroundAsset(src: string): boolean {
  return WHITE_BG_ASSET_FRAGMENTS.some((frag) => src.includes(frag));
}

export function LimuruDairyLogo({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = resolveAssetUrl(UPLOADED_ASSETS.logo);

  if (compact) {
    return (
      <div className="inline-flex items-center justify-center py-0.5 transition-transform duration-300 hover:scale-[1.03]">
        {!logoFailed ? (
          <img
            src={logoUrl}
            alt="Limuru Fresh Co-operative logo"
            width={1844}
            height={1141}
            decoding="async"
            loading="lazy"
            onError={() => setLogoFailed(true)}
            className="h-12 sm:h-14 w-auto object-contain shrink-0 drop-shadow-[0_4px_12px_rgba(13,36,51,0.18)]"
          />
        ) : (
          <svg
            width={44}
            height={44}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M24 6C24 6 12 19.5 12 28.5C12 35.1274 17.3726 40.5 24 40.5C30.6274 40.5 36 35.1274 36 28.5C36 19.5 24 6 24 6Z"
              fill="#0a74b5"
            />
            <path
              d="M15.5 30.5C18.5 27.5 21.5 27.5 24 29.5C26.5 31.5 29.5 31.5 32.5 28.5"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3.5 py-1">
      {!logoFailed ? (
        <img
          src={logoUrl}
          alt="Limuru Fresh Co-operative mark"
          width={1844}
          height={1141}
          decoding="async"
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className="h-12 sm:h-13 w-auto object-contain shrink-0 drop-shadow-[0_4px_10px_rgba(13,36,51,0.14)]"
        />
      ) : (
        <svg
          width={44}
          height={44}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M24 6C24 6 12 19.5 12 28.5C12 35.1274 17.3726 40.5 24 40.5C30.6274 40.5 36 35.1274 36 28.5C36 19.5 24 6 24 6Z"
            fill="#0a74b5"
          />
          <path
            d="M15.5 30.5C18.5 27.5 21.5 27.5 24 29.5C26.5 31.5 29.5 31.5 32.5 28.5"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div className="leading-tight text-left border-l border-[#0a74b5]/25 pl-3.5">
        <span className="block font-bold tracking-wider uppercase text-[#0d2433] whitespace-nowrap text-[13px]">
          Limuru Dairy
        </span>
        <span className="block font-semibold uppercase text-[#0a74b5] whitespace-nowrap text-[10px] tracking-[0.16em]">
          Limuru Fresh · Relish
        </span>
      </div>
    </div>
  );
}

export function KebsBadge() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-[#c3e8fb] p-5 shadow-[0_12px_30px_-22px_rgba(13,36,51,0.18)]">
      <svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 rounded-xl"
      >
        <rect x="2" y="2" width="60" height="60" rx="10" fill="#eef8fe" stroke="#0a74b5" strokeWidth="2.5" />
        <circle cx="32" cy="32" r="21" stroke="#27a8ec" strokeWidth="2.5" fill="#ffffff" />
        <path
          d="M23 32.5L29 38.5L42 25.5"
          stroke="#0a74b5"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <div className="text-xs font-semibold tracking-[0.16em] uppercase text-[#0a74b5]">
          Standardization Mark
        </div>
        <div className="text-lg font-bold text-[#0d2433]">KEBS Certified</div>
        <p className="text-xs text-[#0d2433]/75 mt-0.5">
          Kenya Bureau of Standards quality &amp; food safety compliance across every batch.
        </p>
      </div>
    </div>
  );
}

export function KdbBadge() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-[#c3e8fb] p-5 shadow-[0_12px_30px_-22px_rgba(13,36,51,0.18)]">
      <svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 rounded-xl"
      >
        <rect x="2" y="2" width="60" height="60" rx="10" fill="#dff1fb" stroke="#0a74b5" strokeWidth="2.5" />
        <path
          d="M32 12L48 20V33C48 43 41 49.5 32 53C23 49.5 16 43 16 33V20L32 12Z"
          fill="#ffffff"
          stroke="#27a8ec"
          strokeWidth="2.5"
        />
        <path
          d="M32 22C32 22 25.5 29 25.5 33.5C25.5 37.09 28.41 40 32 40C35.59 40 38.5 37.09 38.5 33.5C38.5 29 32 22 32 22Z"
          fill="#0a74b5"
        />
      </svg>
      <div>
        <div className="text-xs font-semibold tracking-[0.16em] uppercase text-[#0a74b5]">
          Regulatory Licensed
        </div>
        <div className="text-lg font-bold text-[#0d2433]">Kenya Dairy Board</div>
        <p className="text-xs text-[#0d2433]/75 mt-0.5">
          Licensed dairy processor meeting strict national cold-chain hygiene regulations.
        </p>
      </div>
    </div>
  );
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel,
  loading = 'lazy',
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  loading?: 'eager' | 'lazy';
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const intrinsic = getImageDimensions(src);
  const resolvedWidth = width ?? intrinsic.width;
  const resolvedHeight = height ?? intrinsic.height;

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#eef8fe] border border-[#c3e8fb] text-[#0a74b5] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Milk className="w-8 h-8 mb-2 stroke-[1.75]" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#0d2433]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      width={resolvedWidth}
      height={resolvedHeight}
      referrerPolicy="no-referrer"
      decoding="async"
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

const OPAQUE_PHOTO_EXT = /\.(jpe?g|webp)(\?.*)?$/i;

export function ProductStudioVisual({
  src,
  alt,
  className = '',
  imgClassName = '',
  glowColor,
  loading = 'lazy',
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  glowColor?: string;
  loading?: 'eager' | 'lazy';
}) {
  const whiteBg = isWhiteBackgroundAsset(src);
  const isPhotoAsset = OPAQUE_PHOTO_EXT.test(src);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 38%, #ffffff 0%, #eef8fe 48%, #dcf0fc 82%, #cae8fa 100%)',
      }}
    >
      {glowColor && !isPhotoAsset && (
        <div
          className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-5/6 h-5/6 rounded-full blur-2xl opacity-80"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, rgba(223,241,251,0) 70%)`,
          }}
          aria-hidden="true"
        />
      )}

      {!isPhotoAsset && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] opacity-80"
          style={{
            background:
              'linear-gradient(180deg, rgba(223,241,251,0) 0%, rgba(195,232,251,0.5) 100%)',
          }}
          aria-hidden="true"
        />
      )}

      {!isPhotoAsset && (
        <div
          className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-[64%] h-4 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(13,36,51,0.28) 0%, rgba(10,116,181,0.14) 48%, transparent 74%)',
          }}
          aria-hidden="true"
        />
      )}

      {isPhotoAsset ? (
        <div className="product-tilt-pack relative z-10 w-[86%] h-[82%] rounded-xl overflow-hidden border border-[#c3e8fb] shadow-[0_14px_30px_-14px_rgba(13,36,51,0.28)] bg-[#eef8fe] transition-transform duration-300">
          <ResilientImage
            src={src}
            alt={alt}
            loading={loading}
            className={`w-full h-full object-cover object-center ${imgClassName}`}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(238,248,254,0) 58%, rgba(10,116,181,0.18) 100%)',
            }}
            aria-hidden="true"
          />
        </div>
      ) : (
        <ResilientImage
          src={src}
          alt={alt}
          loading={loading}
          className={`product-tilt-pack relative z-10 w-full h-full object-contain p-1 sm:p-1.5 scale-[1.08] brightness-[1.02] contrast-[1.04] saturate-[1.05] transition-transform duration-300 ${
            whiteBg
              ? 'mix-blend-multiply [mask-image:radial-gradient(ellipse_68%_84%_at_50%_50%,#000_64%,transparent_92%)]'
              : 'drop-shadow-[0_18px_28px_rgba(13,36,51,0.24)]'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}

