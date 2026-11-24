import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ASSET_IMAGES } from '../data/content';
import type { PageRoute } from '../types/dairy';
import { resolveAssetUrl } from '../utils/wpConfig';
import { ResilientImage } from './BrandMark';

interface InsidePlantSectionProps {
  onNavigate?: (page: PageRoute) => void;
  active?: boolean;
}

const PLANT_CARDS = [
  {
    id: 'reception',
    step: '01 · Platform Intake',
    title: 'Lab Screening & Rapid Chilling',
    description:
      'Every milk tanker from village collection centres undergoes density, acidity, and butterfat laboratory verification before entering jacketed stainless silos.',
    image: ASSET_IMAGES.plantInspection,
    alt: 'Quality inspection inside Limuru Dairy milk reception and processing floor',
  },
  {
    id: 'pasteurization',
    step: '02 · Gentle Thermal Line',
    title: 'Automated ESL & Probiotic Culture',
    description:
      'Closed-loop plate pasteurizers and cultured fermentation vats preserve natural creamy nutrition for 90-day Limuru Fresh milk and live-culture Relish yoghurt.',
    image: ASSET_IMAGES.plantTanks,
    alt: 'Stainless steel fermentation and pasteurization tanks at Limuru Dairy',
  },
  {
    id: 'cip-piping',
    step: '03 · Clean-In-Place Assurance',
    title: 'Closed Sanitary Piping & Bottling',
    description:
      'Automated CIP valve manifolds sanitize stainless lines between production runs prior to aseptic ESL cartoning and chilled retail bottle sealing.',
    image: ASSET_IMAGES.plantPiping,
    alt: 'Sanitary stainless steel valve piping inside the Limuru Dairy plant',
  },
];

export function InsidePlantSection({
  onNavigate,
  active = true,
}: InsidePlantSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Staggered fade-in for the 3 plant cards when section enters viewport
  useEffect(() => {
    if (!active) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCardsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCardsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.05, rootMargin: '60px 0px' }
    );

    observer.observe(el);
    const fallbackTimer = window.setTimeout(() => {
      setCardsVisible(true);
    }, 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [active]);

  // Quietly play video while visible in viewport and pause when scrolled away or page hidden
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!active) {
      if (!videoEl.paused) {
        videoEl.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const syncPlay = () => {
      if (reducedMotion || !active) return;
      videoEl.muted = true;
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(!videoEl.paused);
      }
    };

    const syncPause = () => {
      if (!videoEl.paused) {
        videoEl.pause();
      }
      setIsPlaying(false);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          syncPlay();
        } else {
          syncPause();
        }
      },
      { threshold: [0, 0.25, 0.5] }
    );

    observer.observe(videoEl);
    return () => {
      observer.disconnect();
      syncPause();
    };
  }, [active]);

  return (
    <section
      ref={sectionRef}
      id="inside-our-plant"
      data-testid="inside-our-plant"
      className="py-12 sm:py-16 lg:py-22 bg-[#f4fafe] border-t border-[#c3e8fb]"
    >
      <div className="site-container">
        <div
          data-reveal="up"
          className="flex flex-col min-[861px]:flex-row min-[861px]:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-12"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
              Limuru Processing Facility · Maziwa House
            </div>
            <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433] mt-1">
              Inside our plant
            </h2>
            <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
              Step onto our sanitary stainless-steel processing floor—equipped with
              World Bank NARIGP-backed ESL packaging lines and automated pasteurization.
            </p>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('certifications')}
              className="btn-shine inline-flex items-center gap-2 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#0d2433] transition-colors cursor-pointer self-start min-[861px]:self-auto shrink-0"
            >
              <span>Inspect certifications</span>
              <ArrowRight className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="layout-split-6-6 gap-6 sm:gap-8 items-stretch">
          {/* Quiet Auto-Playing & Scroll-Pausing Plant Video Frame */}
          <div className="flex flex-col" data-reveal="up">
            <div className="bg-white border border-[#c3e8fb] p-2.5 sm:p-3.5 shadow-[0_22px_54px_-24px_rgba(13,36,51,0.16)] flex-1 flex flex-col justify-between">
              <div className="relative aspect-[16/10] bg-[#dff1fb] overflow-hidden border border-[#dff1fb]">
                <video
                  ref={videoRef}
                  data-testid="inside-plant-video"
                  data-playing={isPlaying ? 'true' : 'false'}
                  src={resolveAssetUrl('/assets/media/inside-our-plant.mp4')}
                  poster={resolveAssetUrl(ASSET_IMAGES.plantEquipment)}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  aria-label="Silent walkthrough inside Limuru Dairy milk pasteurization and stainless packaging plant"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pt-3 sm:pt-3.5 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0d2433]/75">
                <span className="font-semibold text-[#0d2433]">
                  Pasteurization, Fermentation &amp; ESL Cartoning Hall
                </span>
                <span className="font-bold uppercase tracking-[0.14em] text-[#0a74b5] text-[11px]">
                  KEBS · Kenya Dairy Board
                </span>
              </div>
            </div>
          </div>

          {/* Three Plant Cards Fading In Turn-by-Turn */}
          <div className="flex flex-col justify-between gap-3.5 sm:gap-4">
            {PLANT_CARDS.map((card, idx) => (
              <article
                key={card.id}
                data-testid={`inside-plant-card-${idx + 1}`}
                className={`bg-white border border-[#c3e8fb] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-[0_12px_32px_-22px_rgba(13,36,51,0.16)] transition-all duration-700 ease-out ${
                  cardsVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${idx * 170}ms` }}
              >
                <div className="w-20 h-20 sm:w-28 sm:h-24 shrink-0 overflow-hidden border border-[#c3e8fb] bg-[#eef8fe]">
                  <ResilientImage
                    src={card.image}
                    alt={card.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                    {card.step}
                  </div>
                  <h3 className="text-base font-bold text-[#0d2433] mt-0.5">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0d2433]/75 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
