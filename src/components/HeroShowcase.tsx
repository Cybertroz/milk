import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ShoppingBag,
} from 'lucide-react';
import type { Product } from '../types/dairy';
import { SHOWCASE_PRODUCTS } from '../utils/catalog';
import { ResilientImage, isWhiteBackgroundAsset } from './BrandMark';
import { MilkCrownSplash } from './MilkCrownSplash';
import { MilkPourStream } from './MilkPourStream';
import { MilkClickRipple } from './MilkClickRipple';

interface HeroShowcaseProps {
  onShopNow: () => void;
  onQuickView: (product: Product) => void;
  onOrderProduct?: (product: Product, sourceEl?: HTMLElement | null) => void;
}

const BUBBLES = [
  { left: '7%', size: 12, duration: '11s', delay: '0s' },
  { left: '21%', size: 18, duration: '14s', delay: '1.4s' },
  { left: '36%', size: 10, duration: '12s', delay: '3.2s' },
  { left: '54%', size: 16, duration: '15s', delay: '0.6s' },
  { left: '71%', size: 14, duration: '12.5s', delay: '2.1s' },
  { left: '87%', size: 22, duration: '16s', delay: '1.2s' },
];

function wrapPhase(delta: number, total: number): number {
  let d = ((delta % total) + total) % total;
  if (d > total / 2) d -= total;
  return d;
}

export function HeroShowcase({
  onShopNow,
  onQuickView,
  onOrderProduct,
}: HeroShowcaseProps) {
  const total = SHOWCASE_PRODUCTS.length;

  const [targetStep, setTargetStep] = useState(0);
  // Continuous rendered angular phase interpolated via slow, weighted damped spring
  const [displayPhase, setDisplayPhase] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [stageWidth, setStageWidth] = useState(720);
  const [isDragging, setIsDragging] = useState(false);
  const [splashPulse, setSplashPulse] = useState(0);
  const [pourKey, setPourKey] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const phaseStateRef = useRef({
    current: 0,
    target: 0,
    velocity: 0,
    rafId: 0 as number,
  });
  const dragStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    baseTarget: number;
    moved: boolean;
  }>({ pointerId: null, startX: 0, baseTarget: 0, moved: false });

  const activeIndex = ((targetStep % total) + total) % total;
  const activeProduct = SHOWCASE_PRODUCTS[activeIndex];

  // Slow, weighted damped spring physics for luxurious turntable inertia (~1.4s settle)
  const wakeSpring = useCallback(() => {
    const state = phaseStateRef.current;
    if (state.rafId) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      state.current = state.target;
      state.velocity = 0;
      setDisplayPhase(state.target);
      return;
    }

    const tick = () => {
      const diff = state.target - state.current;
      // Reduced spring stiffness & higher viscous damping for heavier, unhurried glide
      state.velocity = state.velocity * 0.87 + diff * 0.038;
      state.current += state.velocity;

      if (Math.abs(diff) < 0.0005 && Math.abs(state.velocity) < 0.0005) {
        state.current = state.target;
        state.velocity = 0;
        state.rafId = 0;
        setDisplayPhase(state.target);
        return;
      }

      setDisplayPhase(state.current);
      state.rafId = window.requestAnimationFrame(tick);
    };

    state.rafId = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      if (phaseStateRef.current.rafId) {
        window.cancelAnimationFrame(phaseStateRef.current.rafId);
      }
    };
  }, []);

  const rotateToStep = useCallback(
    (nextStep: number) => {
      setTargetStep(nextStep);
      phaseStateRef.current.target = nextStep;
      wakeSpring();
    },
    [wakeSpring]
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateWidth = () => {
      const next = el.clientWidth;
      if (next > 0) setStageWidth(next);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || isPaused || isDragging) return;
    }

    const timer = window.setInterval(() => {
      setTargetStep((curr) => {
        const next = curr + 1;
        phaseStateRef.current.target = next;
        wakeSpring();
        return next;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused, isDragging, wakeSpring]);

  const goNext = () => {
    rotateToStep(targetStep + 1);
  };

  const goPrev = () => {
    rotateToStep(targetStep - 1);
  };

  const selectIndex = (index: number) => {
    const delta = wrapPhase(index - activeIndex, total);
    rotateToStep(targetStep + delta);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || isDragging) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: Number((-y * 8).toFixed(2)),
      rotateY: Number((x * 13).toFixed(2)),
    });
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const finishPointerDrag = useCallback(
    (clientX?: number) => {
      if (!isDragging) return;
      const startX = dragStateRef.current.startX;
      const baseTarget = dragStateRef.current.baseTarget;
      const deltaX = typeof clientX === 'number' ? clientX - startX : 0;
      let snapDelta = 0;
      if (Math.abs(deltaX) > 42) {
        snapDelta = deltaX < 0 ? 1 : -1;
      }
      rotateToStep(baseTarget + snapDelta);
      setIsDragging(false);
      dragStateRef.current.pointerId = null;
    },
    [isDragging, rotateToStep]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onGlobalPointerEnd = (ev: PointerEvent) => {
      if (dragStateRef.current.pointerId === null || dragStateRef.current.pointerId === ev.pointerId) {
        finishPointerDrag(ev.clientX);
      }
    };
    const onWindowBlur = () => {
      finishPointerDrag();
    };
    window.addEventListener('pointerup', onGlobalPointerEnd);
    window.addEventListener('pointercancel', onGlobalPointerEnd);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('pointerup', onGlobalPointerEnd);
      window.removeEventListener('pointercancel', onGlobalPointerEnd);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [isDragging, finishPointerDrag]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      baseTarget: targetStep,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStateRef.current.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 7) {
      dragStateRef.current.moved = true;
    }
    const dragStepDelta = -deltaX / 240;
    phaseStateRef.current.target = dragStateRef.current.baseTarget + dragStepDelta;
    wakeSpring();
  };

  const handleStagePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStateRef.current.pointerId !== e.pointerId) return;
    finishPointerDrag(e.clientX);
  };

  const headlineWords = [
    { text: 'Pure', accent: false },
    { text: 'Freshness.', accent: true },
    { text: 'Smooth', accent: false },
    { text: 'Taste.', accent: false },
  ];

  const arcSpreadX = Math.min(350, Math.max(118, stageWidth * 0.39));

  return (
    <section
      className="relative overflow-visible"
      style={{
        background:
          'linear-gradient(132deg, #f3faff 0%, #e1f2fd 48%, #c9e9fb 100%)',
      }}
    >
      {/* CSS-based milk pour stream flowing down on page load */}
      <MilkPourStream />

      {/* Dynamic interactive click milk ripples */}
      <MilkClickRipple />

      {/* Rising bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, idx) => (
          <span
            key={idx}
            className="animate-bubble absolute -bottom-8 rounded-full border border-[#27a8ec]/35 bg-white/45"
            style={
              {
                left: b.left,
                width: `${b.size}px`,
                height: `${b.size}px`,
                '--bubble-duration': b.duration,
                '--bubble-delay': b.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Animated SVG waves at bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="animate-wave-1 absolute bottom-0 left-[-5%] w-[110%] h-20 text-[#8fd5f7]/35"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,56 C240,104 480,8 720,56 C960,104 1200,16 1440,56 L1440,120 L0,120 Z" />
        </svg>
        <svg
          className="animate-wave-2 absolute bottom-0 left-[-5%] w-[110%] h-12 text-white"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,68 C320,14 640,108 960,52 C1180,14 1320,44 1440,68 L1440,120 L0,120 Z" />
          <circle cx="965" cy="24" r="5" fill="#ffffff" opacity="0.9" />
          <circle cx="998" cy="14" r="3.5" fill="#ffffff" opacity="0.82" />
          <circle cx="932" cy="30" r="3" fill="#ffffff" opacity="0.85" />
        </svg>
      </div>

      <div className="relative z-10 site-container pt-5 pb-16 sm:pt-7 sm:pb-20 min-[861px]:pt-8 min-[861px]:pb-22">
        <div className="layout-hero-split gap-5 sm:gap-7 min-[861px]:gap-8">
          {/* Left Editorial Copy (stacks above showcase below 860px) */}
          <div className="layout-hero-copy space-y-3.5 sm:space-y-5 lg:space-y-6">
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.16em] sm:tracking-[0.2em] uppercase text-[#0a74b5]">
              Together for quality, growth &amp; sustainability
            </p>

            <h1 className="fluid-hero-h1 font-extrabold tracking-[-0.035em] text-[#0d2433] [text-wrap:balance]">
              {headlineWords.map((word, index) => (
                <span
                  key={word.text}
                  className={`animate-word-reveal mr-2.5 sm:mr-3.5 ${
                    word.accent ? 'text-[#0a74b5]' : ''
                  }`}
                  style={{ animationDelay: `${index * 95}ms` }}
                >
                  {word.text}
                </span>
              ))}
            </h1>

            <p className="text-sm sm:text-base lg:text-[17px] leading-[1.6] sm:leading-[1.7] text-[#0d2433]/80 max-w-lg">
              Crafted daily by{' '}
              <strong className="font-semibold text-[#0d2433]">
                11,850 dedicated members
              </strong>{' '}
              across the cool Limuru highlands. From velvety Relish cultured yoghurts
              to 90-day Limuru Fresh Long Life Milk, every cup uplifts Kenyan
              smallholder farmers and nourishes your table.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              {onOrderProduct && (
                <button
                  type="button"
                  data-testid="hero-order-now"
                  onClick={(e) => {
                    setSplashPulse((n) => n + 1);
                    onOrderProduct(activeProduct, e.currentTarget);
                  }}
                  className="btn-shine inline-flex items-center gap-2 rounded-xl bg-[#0d2433] hover:bg-[#0a74b5] text-white font-semibold px-5 sm:px-6 py-3.5 sm:py-4 text-[11px] sm:text-xs tracking-[0.12em] sm:tracking-[0.14em] uppercase shadow-[0_14px_28px_-12px_rgba(13,36,51,0.45)] hover:-translate-y-0.5 transition-all cursor-pointer min-h-[44px]"
                >
                  <ShoppingBag className="w-4 h-4 text-[#8fd5f7] shrink-0" aria-hidden="true" />
                  <span>
                    Order {activeProduct.flavourLabel} · KES {activeProduct.priceKes}
                  </span>
                </button>
              )}

              <a
                href="#shop"
                onClick={(e) => {
                  e.preventDefault();
                  onShopNow();
                }}
                className={`btn-shine inline-flex items-center gap-2 sm:gap-2.5 rounded-xl font-semibold px-5 sm:px-6 py-3.5 sm:py-4 text-[11px] sm:text-xs tracking-[0.14em] sm:tracking-[0.15em] uppercase transition-all min-h-[44px] ${
                  onOrderProduct
                    ? 'bg-white/95 hover:bg-[#0a74b5] text-[#0d2433] hover:text-white border border-[#0a74b5]/25 shadow-xs'
                    : 'bg-[#0d2433] hover:bg-[#0a74b5] text-white sm:px-8'
                }`}
              >
                <span>Shop now</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => onQuickView(activeProduct)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-transparent hover:bg-white/75 text-[#0a74b5] hover:text-[#0d2433] font-bold px-3.5 sm:px-4 py-3 text-[11px] sm:text-xs tracking-[0.12em] uppercase transition-colors cursor-pointer min-h-[44px]"
              >
                <span>Inspect {activeProduct.flavourLabel}</span>
              </button>

              <button
                type="button"
                data-testid="hero-pour-milk-btn"
                onClick={() => {
                  setPourKey((n) => n + 1);
                  setSplashPulse((n) => n + 1);
                }}
                className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-[#eef8fe] hover:bg-[#27a8ec] text-[#0a74b5] hover:text-white border border-[#27a8ec]/40 font-bold px-4 py-3.5 text-[11px] sm:text-xs tracking-[0.12em] uppercase transition-colors cursor-pointer min-h-[44px]"
              >
                <span>🥛 Pour Milk</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#0d2433]/65">
              <span>Established 1962</span>
              <span aria-hidden="true">·</span>
              <span>KEBS &amp; Kenya Dairy Board Certified</span>
              <span aria-hidden="true">·</span>
              <span>Free delivery ≥ KES 1,500</span>
            </div>

            {/* Clean Typographic Cooperative Proof Ledger */}
            <dl className="pt-3 border-t border-[#0a74b5]/15 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <dt className="text-[11px] font-semibold text-[#0d2433]/65">
                  Farmer Owners
                </dt>
                <dd className="text-lg sm:text-2xl font-extrabold text-[#0d2433] tabular-nums tracking-tight mt-0.5">
                  11,850
                </dd>
              </div>
              <div className="pl-4 border-l border-[#0a74b5]/15">
                <dt className="text-[11px] font-semibold text-[#0d2433]/65">
                  Chilled Shelf Life
                </dt>
                <dd className="text-lg sm:text-2xl font-extrabold text-[#0a74b5] tabular-nums tracking-tight mt-0.5">
                  90 Days
                </dd>
              </div>
              <div className="pl-4 border-l border-[#0a74b5]/15">
                <dt className="text-[11px] font-semibold text-[#0d2433]/65">
                  Dispatch Temp
                </dt>
                <dd className="text-lg sm:text-2xl font-extrabold text-[#0d2433] tabular-nums tracking-tight mt-0.5">
                  &lt; 4°C
                </dd>
              </div>
            </dl>
          </div>

          {/* Right Open Sky-Stage: Standalone 3D Floating Products (no white template box or chrome) */}
          <div className="layout-hero-stage">
            <div
              ref={stageRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  goNext();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  goPrev();
                }
              }}
              className="relative select-none"
              data-testid="hero-showcase"
            >
              {/* Open 3D Cylindrical Carousel Pedestal */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handleStagePointerEnd}
                onPointerCancel={handleStagePointerEnd}
                className="hero-carousel-stage relative w-full h-[clamp(330px,46svh,440px)] sm:h-[clamp(410px,54svh,520px)] lg:h-[clamp(470px,62svh,590px)] flex items-center justify-center overflow-visible touch-pan-y cursor-grab active:cursor-grabbing"
              >
                {/* Ambient soft per-flavour radial aura directly behind floating products */}
                <div
                  data-testid="hero-flavour-glow"
                  data-flavour={activeProduct.flavour}
                  className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[min(92vw,520px)] h-[min(92vw,520px)] rounded-full transition-all duration-700 blur-3xl z-[3]"
                  style={{
                    background: `radial-gradient(circle, ${
                      activeProduct.glowColor ?? 'rgba(39,168,236,0.36)'
                    } 0%, rgba(223,241,251,0) 70%)`,
                  }}
                  aria-hidden="true"
                />

                {/* Grounded subtle floor shadow beneath centerpiece pack */}
                <div
                  className="pointer-events-none absolute left-1/2 top-[84%] -translate-x-1/2 -translate-y-1/2 w-[min(68vw,330px)] h-10 rounded-full z-[4]"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(13,36,51,0.30) 0%, rgba(10,116,181,0.14) 48%, transparent 74%)',
                  }}
                  aria-hidden="true"
                />

                {/* Sculpted Liquid Milk Crown Splash flaring behind & cradling the active pack */}
                <MilkCrownSplash
                  flavour={activeProduct.flavour}
                  burstKey={`${activeProduct.id}-${splashPulse}`}
                  isPaused={isPaused || isDragging}
                />

                {/* 5-Product Slow, Weighted Continuous 3D Orbital Ring */}
                {SHOWCASE_PRODUCTS.map((product, index) => {
                  const continuousOffset = wrapPhase(index - displayPhase, total);
                  const absOffset = Math.abs(continuousOffset);
                  const theta = (continuousOffset * (2 * Math.PI)) / total;

                  const x = Math.sin(theta) * arcSpreadX;
                  const cosTheta = Math.cos(theta);
                  const z = cosTheta * 245 - 95;
                  const y = (1 - cosTheta) * 16;
                  const scale =
                    absOffset < 0.45
                      ? 1 - absOffset * 0.16
                      : Math.max(0.56, 0.80 - absOffset * 0.12);
                  const rotateY = -continuousOffset * 38;
                  const opacity =
                    absOffset < 0.48
                      ? 1
                      : absOffset < 1.5
                      ? Math.max(0.45, 0.94 - (absOffset - 0.5) * 0.24)
                      : 0.38;
                  const blurPx = absOffset >= 1.45 ? 0.9 : 0;
                  const zIndex = Math.round(30 - absOffset * 10);
                  const isCenter = index === activeIndex;
                  const whiteBg = isWhiteBackgroundAsset(product.image);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        if (dragStateRef.current.moved) return;
                        if (isCenter) {
                          goNext();
                        } else {
                          selectIndex(index);
                        }
                      }}
                      aria-label={
                        isCenter
                          ? `Currently showing ${product.name} ${product.size}. Click to view next product.`
                          : `Rotate showcase to ${product.name} ${product.size}`
                      }
                      aria-current={isCenter ? 'true' : undefined}
                      className={`absolute left-1/2 top-[45%] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a74b5] rounded-2xl ${
                        isCenter
                          ? 'w-[min(68vw,310px)] h-[min(68vw,310px)] sm:w-[min(56vw,395px)] sm:h-[min(56vw,395px)] lg:w-[min(36vw,465px)] lg:h-[min(36vw,465px)]'
                          : 'w-[min(42vw,200px)] h-[min(42vw,200px)] sm:w-[min(36vw,255px)] sm:h-[min(36vw,255px)] lg:w-[min(23vw,300px)] lg:h-[min(23vw,300px)]'
                      }`}
                      style={{
                        zIndex,
                        opacity,
                        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
                        transform: `translate3d(calc(-50% + ${x.toFixed(
                          1
                        )}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(
                          1
                        )}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(
                          3
                        )})`,
                      }}
                    >
                      {/* Interactive cursor tilt wrapper for centerpiece */}
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                        style={
                          isCenter
                            ? {
                                transform: `perspective(1450px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                              }
                            : undefined
                        }
                      >
                        <div
                          className={`relative w-full h-full flex items-center justify-center ${
                            isCenter ? 'animate-product-revolve' : ''
                          } ${isCenter && (isPaused || isDragging) ? 'is-paused' : ''}`}
                        >
                          <ResilientImage
                            src={product.image}
                            alt={`${product.name} ${product.size}`}
                            loading="eager"
                            className={`relative z-10 w-full h-full object-contain brightness-[1.02] contrast-[1.04] saturate-[1.05] ${
                              whiteBg
                                ? 'mix-blend-multiply [mask-image:radial-gradient(ellipse_62%_78%_at_50%_50%,#000_58%,transparent_90%)]'
                                : isCenter
                                ? 'drop-shadow-[0_28px_42px_rgba(13,36,51,0.28)]'
                                : 'drop-shadow-[0_16px_24px_rgba(13,36,51,0.18)]'
                            }`}
                          />
                        </div>

                        {/* Interactive hover overlay revealing View Details button and floating product name */}
                        <div className="product-card-hover-overlay absolute inset-0 rounded-2xl bg-[#0d2433]/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20 text-white">
                          <div className="animate-product-float text-xs font-bold uppercase tracking-wider text-[#8fd5f7]">
                            {product.brand} · {product.size}
                          </div>
                          <div className="animate-product-float text-base sm:text-lg font-bold tracking-tight text-white mt-1 [text-wrap:balance]" style={{ animationDelay: '150ms' }}>
                            {product.name}
                          </div>
                          <div className="mt-4">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickView(product);
                              }}
                              className="btn-shine inline-flex items-center gap-1.5 bg-[#27a8ec] hover:bg-white text-[#0d2433] text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
                            >
                              View Details
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Quiet Floating Left / Right Stage Controls + Unboxed Pack Dots */}
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous showcase product"
                  className="hidden sm:inline-flex items-center justify-center absolute left-1 lg:left-2 top-[45%] -translate-y-1/2 z-[35] w-10 h-10 rounded-full bg-white/65 hover:bg-white text-[#0d2433] border border-[#0a74b5]/20 shadow-sm backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next showcase product"
                  className="hidden sm:inline-flex items-center justify-center absolute right-1 lg:right-2 top-[45%] -translate-y-1/2 z-[35] w-10 h-10 rounded-full bg-white/65 hover:bg-white text-[#0d2433] border border-[#0a74b5]/20 shadow-sm backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  data-testid="milk-pour-replay-btn"
                  onClick={() => setPourKey((n) => n + 1)}
                  title="Replay milk pour animation"
                  className="absolute top-2 right-2 z-[35] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 hover:bg-white text-[#0a74b5] border border-[#0a74b5]/30 text-[11px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pour Again</span>
                </button>

                {/* Minimal Unboxed Active Product Caption & Selector Dots */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-[35] flex flex-col items-center gap-2 text-center">
                  <div className="text-xs font-bold text-[#0d2433] whitespace-nowrap">
                    {activeProduct.name} · {activeProduct.size} ·{' '}
                    <span className="text-[#0a74b5] tabular-nums">
                      KES {activeProduct.priceKes}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    role="tablist"
                    aria-label="Choose featured product"
                  >
                    {SHOWCASE_PRODUCTS.map((item, idx) => {
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          aria-label={`Show ${item.name}`}
                          onClick={() => selectIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            active
                              ? 'w-7 bg-[#0d2433]'
                              : 'w-2 bg-[#0a74b5]/35 hover:bg-[#0a74b5]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
