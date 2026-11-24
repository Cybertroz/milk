import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import type { Product } from '../types/dairy';
import { SHOWCASE_PRODUCTS, UPLOADED_ASSETS } from '../utils/catalog';
import { resolveAssetUrl } from '../utils/wpConfig';
import { ResilientImage, isWhiteBackgroundAsset } from './BrandMark';

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

  // Monotonically unwrapped target step for seamless orbital rotations
  const [targetStep, setTargetStep] = useState(0);
  // Continuous rendered angular phase interpolated via slow, weighted damped spring
  const [displayPhase, setDisplayPhase] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [stageWidth, setStageWidth] = useState(720);
  const [isDragging, setIsDragging] = useState(false);

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

    // Crisp 5-second showcase cycle per product
    const intervalMs = 50;
    const totalMs = 5000;
    const step = (intervalMs / totalMs) * 100;

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          setTargetStep((curr) => {
            const next = curr + 1;
            phaseStateRef.current.target = next;
            wakeSpring();
            return next;
          });
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPaused, isDragging, wakeSpring]);

  const goNext = () => {
    rotateToStep(targetStep + 1);
    setProgress(0);
  };

  const goPrev = () => {
    rotateToStep(targetStep - 1);
    setProgress(0);
  };

  const selectIndex = (index: number) => {
    const delta = wrapPhase(index - activeIndex, total);
    rotateToStep(targetStep + delta);
    setProgress(0);
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
      if (snapDelta !== 0) setProgress(0);
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

  const counterLabel = `${String(activeIndex + 1).padStart(2, '0')} / ${String(
    total
  ).padStart(2, '0')}`;

  const arcSpreadX = Math.min(285, Math.max(92, stageWidth * 0.36));

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(125deg, #eef8fe 0%, #dff1fb 48%, #c3e8fb 100%)',
      }}
    >
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
        </svg>
      </div>

      <div className="relative z-10 site-container py-4 sm:py-6 min-[861px]:py-8">
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

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
              {onOrderProduct && (
                <button
                  type="button"
                  data-testid="hero-order-now"
                  onClick={(e) => onOrderProduct(activeProduct, e.currentTarget)}
                  className="btn-shine inline-flex items-center gap-2 bg-[#0d2433] hover:bg-[#0a74b5] text-white font-semibold px-4 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-xs tracking-[0.12em] sm:tracking-[0.14em] uppercase transition-colors cursor-pointer min-h-[44px]"
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
                className={`btn-shine inline-flex items-center gap-2 sm:gap-2.5 font-semibold px-5 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-xs tracking-[0.14em] sm:tracking-[0.15em] uppercase transition-colors min-h-[44px] ${
                  onOrderProduct
                    ? 'bg-white hover:bg-[#0a74b5] text-[#0d2433] hover:text-white border border-[#0a74b5]/25'
                    : 'bg-[#0d2433] hover:bg-[#0a74b5] text-white sm:px-8'
                }`}
              >
                <span>Shop now</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => onQuickView(activeProduct)}
                className="btn-shine inline-flex items-center gap-2 bg-[#eef8fe]/90 hover:bg-[#ffffff] text-[#0d2433] border border-[#0a74b5]/25 font-semibold px-4 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs tracking-[0.12em] sm:tracking-[0.14em] uppercase transition-all cursor-pointer min-h-[44px]"
              >
                <span>Inspect {activeProduct.flavourLabel}</span>
              </button>
            </div>
          </div>

          {/* Right Open Sky-Stage 3D Cylindrical Carousel */}
          <div className="layout-hero-stage">
            <div
              ref={stageRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
              className="relative p-0.5 sm:p-2 select-none"
              data-testid="hero-showcase"
            >
              {/* Counter + Auto/Pause */}
              <div className="flex items-center justify-between gap-2 sm:gap-4 mb-1">
                <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
                  <span
                    data-testid="showcase-counter"
                    className="text-xs sm:text-sm font-extrabold text-[#0a74b5] tabular-nums tracking-wider whitespace-nowrap shrink-0"
                  >
                    {counterLabel}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#0d2433]/70 uppercase tracking-[0.08em] sm:tracking-[0.18em] whitespace-nowrap truncate">
                    500ml Signature Range
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  aria-label={isPaused ? 'Resume showcase rotation' : 'Pause showcase rotation'}
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#0d2433]/85 hover:text-[#0a74b5] px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#eef8fe]/60 border border-[#0a74b5]/20 transition-colors cursor-pointer shrink-0"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3" aria-hidden="true" />
                      <span>Paused</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3" aria-hidden="true" />
                      <span>Auto</span>
                    </>
                  )}
                </button>
              </div>

              {/* Letter-by-letter Outlined Flavour Heading */}
              <div className="text-center min-h-[34px] sm:min-h-[42px] mb-1 overflow-hidden">
                <div
                  key={`title-${activeProduct.id}`}
                  className="outlined-flavour-title text-2xl sm:text-4xl lg:text-[42px] font-extrabold uppercase tracking-widest"
                  aria-live="polite"
                >
                  {activeProduct.flavourLabel.split('').map((char, idx) => (
                    <span
                      key={`${activeProduct.id}-${idx}`}
                      className="animate-letter-build"
                      style={{ animationDelay: `${idx * 45}ms` }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Open 3D Cylindrical Carousel Pedestal */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handleStagePointerEnd}
                onPointerCancel={handleStagePointerEnd}
                className="hero-carousel-stage relative w-full h-[clamp(260px,38svh,360px)] sm:h-[clamp(330px,45svh,440px)] lg:h-[clamp(390px,54svh,520px)] flex items-center justify-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing transition-[background] duration-700"
                style={{
                  background: `radial-gradient(ellipse at 50% 47%, ${
                    activeProduct.glowColor ?? 'rgba(39,168,236,0.34)'
                  } 0%, rgba(223,241,251,0.64) 55%, rgba(195,232,251,0) 88%)`,
                }}
              >
                {/* Integrated 3D Background Depth Wordmark Layer (builds letter-by-letter behind the product) */}
                <div
                  key={`depth-bg-${activeProduct.id}`}
                  className="pointer-events-none absolute inset-x-0 top-[10%] sm:top-[8%] flex flex-wrap items-center justify-center z-[4]"
                  aria-hidden="true"
                >
                  <span className="hero-depth-wordmark text-[clamp(2.25rem,8.8vw,6.2rem)] font-black uppercase leading-none select-none whitespace-nowrap">
                    {activeProduct.flavourLabel.split('').map((char, idx) => (
                      <span
                        key={`${activeProduct.id}-bg-${idx}`}
                        className="animate-letter-build"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    ))}
                  </span>
                </div>

                {/* Integrated Transparent Cooperative Logo Overlay (Zero flat white box) */}
                <div
                  key={`crest-${activeProduct.id}`}
                  className="animate-overlay-rise pointer-events-none absolute bottom-2 left-1 sm:bottom-3 sm:left-2 z-[34] inline-flex items-center gap-2.5"
                  aria-hidden="true"
                >
                  <img
                    src={resolveAssetUrl(UPLOADED_ASSETS.logo)}
                    alt=""
                    className="animate-crest-float h-8 sm:h-10 w-auto object-contain drop-shadow-[0_4px_10px_rgba(13,36,51,0.20)]"
                  />
                  <div className="leading-tight border-l-2 border-[#0a74b5]/40 pl-2.5 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                    <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0a74b5]">
                      {activeProduct.brand}
                    </span>
                    <span className="block text-xs font-bold text-[#0d2433] tabular-nums">
                      {activeProduct.size} · Highland Craft
                    </span>
                  </div>
                </div>

                {/* Ambient per-flavour colour aura (smooth colour crossfade) */}
                <div
                  data-testid="hero-flavour-glow"
                  data-flavour={activeProduct.flavour}
                  className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[min(92vw,480px)] h-[min(92vw,480px)] rounded-full transition-all duration-700 blur-3xl z-[3]"
                  style={{
                    background: `radial-gradient(circle, ${
                      activeProduct.glowColor ?? 'rgba(39,168,236,0.42)'
                    } 0%, ${
                      activeProduct.glowColor ?? 'rgba(39,168,236,0.24)'
                    } 36%, rgba(223,241,251,0) 74%)`,
                  }}
                  aria-hidden="true"
                />

                {/* Grounded realistic floor shadow ellipse beneath active hero */}
                <div
                  className="pointer-events-none absolute left-1/2 top-[84%] -translate-x-1/2 -translate-y-1/2 w-[min(78vw,352px)] h-11 rounded-full"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(13,36,51,0.34) 0%, rgba(10,116,181,0.16) 50%, transparent 74%)',
                  }}
                  aria-hidden="true"
                />

                {/* Pulsing turntable rings */}
                <div
                  className="animate-turntable-ring pointer-events-none absolute left-1/2 top-[84%] w-[min(86vw,420px)] h-22 rounded-full border border-[#0a74b5]/35"
                  aria-hidden="true"
                />
                <div
                  className="animate-turntable-ring pointer-events-none absolute left-1/2 top-[84%] w-[min(64vw,288px)] h-13 rounded-full border border-[#27a8ec]/55"
                  style={{ animationDelay: '0.8s' }}
                  aria-hidden="true"
                />

                {/* Orbital ring with continuously orbiting glowing dot around hero product */}
                <div
                  className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 z-[26]"
                  style={{ perspective: '1000px' }}
                  aria-hidden="true"
                >
                  <div
                    className="relative w-[min(76vw,380px)] h-[min(76vw,380px)]"
                    style={{ transform: 'rotateX(70deg) rotateZ(-14deg)', transformStyle: 'preserve-3d' }}
                  >
                    <div
                      data-testid="hero-orbital-ring"
                      className={`animate-orbit-ring relative w-full h-full rounded-full border-[1.5px] border-[#0a74b5]/45 shadow-[0_0_18px_rgba(39,168,236,0.22)] ${
                        isPaused || isDragging ? 'is-paused' : ''
                      }`}
                    >
                      <span
                        data-testid="hero-orbital-dot"
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#27a8ec] border-2 border-white shadow-[0_0_16px_4px_rgba(39,168,236,0.95),0_0_28px_rgba(10,116,181,0.8)]"
                      />
                    </div>
                  </div>
                </div>

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
                      ? 1.09 - absOffset * 0.22
                      : Math.max(0.36, 0.70 - absOffset * 0.16);
                  const rotateY = -continuousOffset * 38;
                  const opacity =
                    absOffset < 0.48
                      ? 1
                      : absOffset < 1.5
                      ? Math.max(0.28, 0.88 - (absOffset - 0.5) * 0.28)
                      : 0.24;
                  const blurPx = absOffset >= 1.45 ? 1.25 : 0;
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
                          ? `Currently showing ${product.name}. Click to advance to next product.`
                          : `Rotate showcase to ${product.name} ${product.size}`
                      }
                      aria-current={isCenter ? 'true' : undefined}
                      className={`absolute left-1/2 top-[45%] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a74b5] ${
                        isCenter
                          ? 'w-[min(58vw,290px)] h-[min(58vw,290px)] sm:w-[min(64vw,380px)] sm:h-[min(64vw,380px)] lg:w-[min(36vw,440px)] lg:h-[min(36vw,440px)]'
                          : 'w-[min(42vw,200px)] h-[min(42vw,200px)] sm:w-[min(46vw,260px)] sm:h-[min(46vw,260px)] lg:w-[min(25vw,300px)] lg:h-[min(25vw,300px)]'
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
                          {whiteBg && (
                            <div
                              className="pointer-events-none absolute inset-[7%] rounded-full"
                              style={{
                                background:
                                  'radial-gradient(ellipse 68% 76% at 50% 50%, #e4f3fc 42%, rgba(223,241,251,0) 76%)',
                              }}
                              aria-hidden="true"
                            />
                          )}

                          <ResilientImage
                            src={product.image}
                            alt={`${product.name} ${product.size}`}
                            className={`relative z-10 w-full h-full object-contain brightness-[1.03] contrast-[1.06] saturate-[1.06] ${
                              isCenter ? 'scale-[1.10]' : 'scale-[1.03]'
                            } ${
                              whiteBg
                                ? 'mix-blend-multiply [mask-image:radial-gradient(ellipse_66%_84%_at_50%_50%,#000_64%,transparent_92%)]'
                                : isCenter
                                ? 'drop-shadow-[0_34px_50px_rgba(13,36,51,0.30)]'
                                : 'drop-shadow-[0_18px_28px_rgba(13,36,51,0.18)]'
                            }`}
                          />

                          {isCenter && (
                            <div
                              key={`sweep-${activeProduct.id}`}
                              className="animate-light-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/65 to-transparent"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Integrated Bottom-Right Spatial Text Overlay (Zero flat white box) */}
                <div
                  key={`callout-${activeProduct.id}`}
                  className="animate-overlay-rise pointer-events-none hidden sm:flex items-center gap-2.5 absolute bottom-2 right-1 sm:bottom-3 sm:right-2 z-[35] drop-shadow-[0_1px_2px_rgba(255,255,255,0.92)]"
                  aria-hidden="true"
                >
                  <Sparkles className="w-4 h-4 text-[#0a74b5] shrink-0" />
                  <div className="text-right leading-tight border-r-2 border-[#0a74b5]/40 pr-2.5">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0d2433]">
                      {activeProduct.flavourLabel}
                    </div>
                    <div className="text-[11px] font-bold text-[#0a74b5] tabular-nums">
                      KES {activeProduct.priceKes} · Probiotic Highland Dairy
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Product Switcher Tabs (active tab fills 5-second bar; hover lifts tabs) */}
              <div
                className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1 mb-2"
                role="tablist"
                aria-label="Select featured 500ml flavour"
              >
                {SHOWCASE_PRODUCTS.map((item, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-testid={`showcase-tab-${item.flavour}`}
                      onClick={() => selectIndex(idx)}
                      className={`relative overflow-hidden px-2.5 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.11em] sm:tracking-[0.14em] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                        active
                          ? 'bg-[#0d2433] text-white shadow-xs'
                          : 'bg-[#eef8fe]/75 text-[#0d2433]/85 border border-[#c3e8fb] hover:bg-white hover:text-[#0a74b5]'
                      }`}
                    >
                      <span className="relative z-10">{item.flavourLabel}</span>
                      {active && (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 bg-[#27a8ec]/25 transition-[width] duration-75 linear pointer-events-none"
                            style={{ width: `${progress}%` }}
                          />
                          <span
                            aria-hidden="true"
                            data-testid="active-tab-progress"
                            className="absolute bottom-0 left-0 h-[3px] bg-[#27a8ec] transition-[width] duration-75 linear pointer-events-none"
                            style={{ width: `${progress}%` }}
                          />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Minimal Bottom Bar */}
              <div className="mt-2 pt-3 border-t border-[#0a74b5]/15 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-[#0d2433] truncate">
                    {activeProduct.name} · {activeProduct.size}
                  </div>
                  <div className="text-xs font-semibold text-[#0a74b5] tabular-nums mt-0.5">
                    KES {activeProduct.priceKes} · Drag, click side pack or advance
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous showcase product"
                    className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider bg-[#eef8fe]/90 text-[#0d2433] border border-[#0a74b5]/15 hover:bg-[#8fd5f7] transition-colors cursor-pointer min-h-[38px]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>PREV</span>
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next showcase product"
                    className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider bg-[#0d2433] text-white hover:bg-[#0a74b5] transition-colors cursor-pointer min-h-[38px]"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Ultra-slim Progress Bar */}
              <div className="mt-3 h-[2px] w-full bg-[#eef8fe]/80 overflow-hidden" aria-hidden="true">
                <div
                  className="h-full bg-[#0a74b5] transition-[width] duration-75 linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
