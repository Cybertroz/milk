import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  PhoneCall,
  RotateCw,
  ShoppingBag,
  Smartphone,
  Truck,
} from 'lucide-react';
import {
  FARM_TO_CUP_STEPS,
  MANAGERS_MESSAGE,
  RECIPE_CARDS,
  WHY_CHOOSE_US_ITEMS,
} from '../data/content';
import type { FlavourKey, PageRoute, Product, QuizAnswers } from '../types/dairy';
import {
  FLAVOUR_TABS,
  PRODUCTS,
  getFlavourCardGroups,
  getPricePerLitre,
  recommendProductFromQuiz,
} from '../utils/catalog';
import { ProductStudioVisual, ResilientImage } from './BrandMark';
import { HeroShowcase } from './HeroShowcase';
import { InsidePlantSection } from './InsidePlantSection';
import { buildApiHeaders, resolveApiUrl } from '../utils/wpConfig';

interface HomePageProps {
  isActivePage?: boolean;
  onNavigate?: (page: PageRoute, sectionId?: string) => void;
  onNavigateShop: (flavour?: FlavourKey) => void;
  onAddToCart: (product: Product, sourceEl?: HTMLElement | null) => void;
  onQuickView: (product: Product) => void;
  recentlyAddedIds?: Record<string, boolean>;
}

export function HomePage({
  isActivePage = true,
  onNavigate,
  onNavigateShop,
  onAddToCart,
  onQuickView,
  recentlyAddedIds = {},
}: HomePageProps) {
  const [activeFlavour, setActiveFlavour] = useState<FlavourKey>('all');
  const [selectedProductByFlavour, setSelectedProductByFlavour] = useState<
    Record<string, string>
  >({});
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    mood: 'fruity',
    quantity: 'single',
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const flavourGroups = getFlavourCardGroups(PRODUCTS, activeFlavour);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-step-index'));
            if (!Number.isNaN(idx)) {
              setActiveStepIndex(idx);
            }
          }
        });
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: 0.1 }
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const offset = direction === 'left' ? -340 : 340;
    carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const quizRecommendation = recommendProductFromQuiz(quizAnswers);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsletterError('Please enter a valid email address.');
      setNewsletterSuccess('');
      return;
    }
    setNewsletterError('');
    setNewsletterSubmitting(true);
    try {
      const res = await fetch(resolveApiUrl('/api/newsletter'), {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: trimmed }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setNewsletterSuccess(
          'Thank you for joining the Limuru Dairy cooperative community.'
        );
        setNewsletterEmail('');
        return;
      }
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setNewsletterError(data.error ?? 'Unable to subscribe right now.');
        setNewsletterSuccess('');
        return;
      }
      setNewsletterSuccess(
        data.message ?? 'Thank you for joining the Limuru Dairy cooperative community.'
      );
      setNewsletterEmail('');
    } catch {
      setNewsletterError('Network error while subscribing. Please try again.');
      setNewsletterSuccess('');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const activeStep = FARM_TO_CUP_STEPS[activeStepIndex];

  return (
    <div className="animate-page-in">
      {/* 1. HERO */}
      <HeroShowcase
        onShopNow={() => onNavigateShop()}
        onQuickView={onQuickView}
      />

      {/* 2. ARCHITECTURAL BENEFITS STRIP */}
      <section data-reveal="up" className="bg-white border-y border-[#0a74b5]/10">
        <div className="site-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:gap-px sm:bg-[#0a74b5]/10 lg:gap-0 lg:bg-transparent lg:divide-x divide-[#0a74b5]/10">
            <div className="flex items-start gap-3.5 sm:gap-4 py-5 sm:py-6 sm:px-5 lg:py-8 lg:px-6 lg:first:pl-0 bg-white">
              <div className="w-10 h-10 bg-[#eef8fe] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-[#0a74b5]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0d2433]">
                  Free delivery over KES 1,500
                </h2>
                <p className="text-xs text-[#0d2433]/65 mt-1 leading-relaxed">
                  From KES 100 by corridor across Limuru, Kiambu &amp; Nairobi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 sm:gap-4 py-5 sm:py-6 sm:px-5 lg:py-8 lg:px-6 bg-white">
              <div className="w-10 h-10 bg-[#eef8fe] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#0a74b5]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0d2433]">
                  90-day long life milk
                </h2>
                <p className="text-xs text-[#0d2433]/65 mt-1 leading-relaxed">
                  ESL &amp; UHT sealed freshness without added preservatives.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 sm:gap-4 py-5 sm:py-6 sm:px-5 lg:py-8 lg:px-6 bg-white">
              <div className="w-10 h-10 bg-[#eef8fe] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#0a74b5]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0d2433]">
                  M-Pesa or cash on delivery
                </h2>
                <p className="text-xs text-[#0d2433]/65 mt-1 leading-relaxed">
                  Fast mobile checkout or settle cleanly at your doorstep.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 sm:gap-4 py-5 sm:py-6 sm:px-5 lg:py-8 lg:px-6 lg:last:pr-0 bg-white">
              <div className="w-10 h-10 bg-[#eef8fe] flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5 text-[#0a74b5]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0d2433]">
                  Call 020-2010611
                </h2>
                <p className="text-xs text-[#0d2433]/65 mt-1 leading-relaxed">
                  Direct cooperative desk for wholesale &amp; household orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR PRODUCTS SLIDING ROW */}
      <section className="py-12 sm:py-16 lg:py-22 bg-white">
        <div className="site-container">
          <div
            data-reveal="up"
            className="flex flex-col min-[861px]:flex-row min-[861px]:items-end justify-between gap-5 sm:gap-6 mb-7 sm:mb-10"
          >
            <div>
              <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
                Our Products
              </h2>
              <p className="text-sm sm:text-base text-[#0d2433]/70 mt-4 max-w-xl">
                Explore the signature Relish cultured yoghurt range and Limuru Fresh
                Long Life Milk straight from our highland processing plant.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                aria-label="Scroll products left"
                className="w-11 h-11 inline-flex items-center justify-center bg-[#eef8fe] text-[#0d2433] hover:bg-[#8fd5f7] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                aria-label="Scroll products right"
                className="w-11 h-11 inline-flex items-center justify-center bg-[#eef8fe] text-[#0d2433] hover:bg-[#8fd5f7] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Flavour Tabs */}
          <div
            role="tablist"
            aria-label="Filter featured products by flavour"
            className="flex flex-wrap gap-1.5 mb-10 border-b border-[#0a74b5]/10 pb-4"
          >
            {FLAVOUR_TABS.map((tab) => {
              const active = activeFlavour === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveFlavour(tab.key)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all hover:-translate-y-0.5 cursor-pointer ${
                    active
                      ? 'bg-[#0d2433] text-white'
                      : 'bg-[#eef8fe]/70 text-[#0d2433]/80 hover:bg-[#dff1fb] hover:text-[#0d2433]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sliding Row Grouped by Flavour with Quick Size Swatches */}
          <div
            key={activeFlavour}
            ref={carouselRef}
            className="animate-view-fade flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
          >
            {flavourGroups.map((group, index) => {
              const selectedId = selectedProductByFlavour[group.flavour];
              const activeProduct =
                group.variants.find((v) => v.id === selectedId) ??
                group.defaultProduct;
              const isJustAdded = Boolean(recentlyAddedIds[activeProduct.id]);

              return (
                <article
                  key={group.flavour}
                  data-reveal="up"
                  data-testid={`home-flavour-card-${group.flavour}`}
                  className="animate-card-stagger w-[min(78vw,280px)] sm:w-[276px] lg:w-[292px] shrink-0 snap-start bg-[#eef8fe]/40 border border-[#c3e8fb] hover:border-[#27a8ec] overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_28px_-22px_rgba(10,116,181,0.22)] hover:shadow-[0_20px_40px_-20px_rgba(10,116,181,0.28)]"
                  style={{
                    animationDelay: `${Math.min(index, 5) * 90}ms`,
                    transitionDelay: `${Math.min(index, 5) * 90}ms`,
                  }}
                >
                  {/* 3px Flavour Accent Hairline */}
                  <div
                    className="h-[3px] w-full shrink-0"
                    style={{ backgroundColor: group.accentColor }}
                    aria-hidden="true"
                  />

                  <button
                    type="button"
                    onClick={() => onQuickView(activeProduct)}
                    className="block w-full aspect-[4/5] overflow-hidden cursor-pointer text-left"
                    aria-label={`Quick view ${activeProduct.name} ${activeProduct.size}`}
                  >
                    <ProductStudioVisual
                      src={activeProduct.image}
                      alt={`${activeProduct.name} ${activeProduct.size}`}
                      glowColor={activeProduct.glowColor}
                      className="w-full h-full"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.12]"
                    />
                  </button>

                  <div className="p-4 bg-white/95 border-t border-[#dff1fb] flex-1 flex flex-col justify-between gap-3.5">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                        <span>{activeProduct.brand}</span>
                        <span className="text-[#0d2433]/65 tabular-nums">
                          {activeProduct.size}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#0d2433] mt-1">
                        {activeProduct.name}
                      </h3>

                      {/* Quick Size Swatches (rendered on all cards to align price baselines) */}
                      <div
                        role="group"
                        aria-label={`Pack sizes for ${group.flavourLabel}`}
                        className="mt-3 flex flex-wrap gap-1 min-h-[28px]"
                      >
                        {group.variants.map((variant) => {
                          const isSelected = variant.id === activeProduct.id;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() =>
                                setSelectedProductByFlavour((prev) => ({
                                  ...prev,
                                  [group.flavour]: variant.id,
                                }))
                              }
                              className={`px-2 py-1 text-[11px] font-bold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                                isSelected
                                  ? 'bg-[#0d2433] text-white'
                                  : 'bg-[#eef8fe] text-[#0d2433]/80 hover:bg-[#dff1fb] border border-[#c3e8fb]'
                              }`}
                            >
                              {variant.size}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#eef8fe] flex items-baseline justify-between">
                        <span className="text-lg font-extrabold text-[#0d2433] tabular-nums">
                          KES {activeProduct.priceKes}
                        </span>
                        <span className="text-xs text-[#0d2433]/55 tabular-nums">
                          KES {Math.round(getPricePerLitre(activeProduct))}/L
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => onAddToCart(activeProduct, e.currentTarget)}
                      className={`btn-shine w-full inline-flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 transition-colors cursor-pointer ${
                        isJustAdded
                          ? 'bg-[#0d2433]'
                          : 'bg-[#0a74b5] hover:bg-[#0d2433]'
                      }`}
                    >
                      {isJustAdded ? (
                        <span>Added ✓</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                          <span>Add {activeProduct.size} to cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigateShop(activeFlavour)}
              className="inline-flex items-center gap-2.5 text-xs font-bold text-[#0a74b5] hover:text-[#0d2433] uppercase tracking-[0.16em] cursor-pointer transition-colors"
            >
              <span>Explore full shop catalogue</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. FROM FARM TO CUP (PINNED EDITORIAL SCROLL STORY) */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#eef8fe]">
        <div className="site-container">
          <div className="mb-8 sm:mb-12">
            <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
              From farm to cup
            </h2>
            <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
              Follow every drop of milk from Limuru’s emerald pastures through
              rigorous cold-chain stewardship to your breakfast table.
            </p>
          </div>

          <div className="layout-split-6-6 gap-7 sm:gap-10 lg:gap-12 items-start">
            {/* Pinned Sticky Visual Frame */}
            <div className="min-[861px]:sticky min-[861px]:top-24">
              <div className="bg-white border border-[#c3e8fb] p-2.5 sm:p-4 shadow-[0_24px_60px_-24px_rgba(13,36,51,0.14)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#dff1fb]">
                  <ResilientImage
                    key={activeStep.id}
                    src={activeStep.image}
                    alt={`${activeStep.title} — ${activeStep.subtitle}`}
                    className="w-full h-full object-cover object-top transition-opacity duration-300"
                  />

                  {/* Frosted Glass Graphic Step Telemetry */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 bg-white/94 backdrop-blur-md border border-[#c3e8fb] p-2.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 shadow-sm">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <span className="text-xl sm:text-3xl font-extrabold text-[#0a74b5] tabular-nums leading-none shrink-0">
                        {activeStep.stepNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#0a74b5] truncate">
                          {activeStep.subtitle}
                        </div>
                        <div className="text-xs sm:text-base font-bold text-[#0d2433] truncate">
                          {activeStep.title}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] sm:text-[10px] font-semibold text-[#0d2433]/60 uppercase tracking-wider">
                        {activeStep.metricLabel}
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-[#0a74b5] tabular-nums">
                        {activeStep.metricValue}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimal Step Selector Strip */}
                <div className="grid grid-cols-5 gap-1 sm:gap-1.5 mt-2.5 sm:mt-3">
                  {FARM_TO_CUP_STEPS.map((step, idx) => {
                    const isActive = idx === activeStepIndex;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className={`p-1.5 sm:p-2.5 text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#0d2433] text-white'
                            : 'bg-[#eef8fe] text-[#0d2433]/75 hover:bg-[#dff1fb]'
                        }`}
                      >
                        <div className="text-[10px] sm:text-[11px] font-extrabold tabular-nums opacity-85">
                          {step.stepNumber}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-semibold truncate mt-0.5">
                          {step.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scrolling 5 Steps with Vertical Sky-Blue Progress Rail */}
            <div className="relative sm:pl-9">
              {/* Vertical Progress Track */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute left-3 top-6 bottom-6 w-[3px] bg-[#c3e8fb] overflow-hidden"
              >
                <div
                  className="w-full h-full bg-[#0a74b5] transition-transform duration-500 ease-out"
                  style={{
                    transform: `scaleY(${(activeStepIndex + 1) / FARM_TO_CUP_STEPS.length})`,
                    transformOrigin: 'top',
                  }}
                />
              </div>

              <div className="space-y-4">
                {FARM_TO_CUP_STEPS.map((step, idx) => {
                  const isActive = idx === activeStepIndex;
                  const isPassed = idx <= activeStepIndex;
                  return (
                    <div
                      key={step.id}
                      ref={(el) => {
                        stepRefs.current[idx] = el;
                      }}
                      data-step-index={idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`relative p-6 sm:p-7 border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white border-[#27a8ec] shadow-[0_16px_40px_-20px_rgba(13,36,51,0.16)]'
                          : 'bg-white/65 border-[#c3e8fb] hover:bg-white'
                      }`}
                    >
                      {/* Rail Node Marker */}
                      <span
                        aria-hidden="true"
                        className={`hidden sm:block absolute -left-[29px] top-8 w-3 h-3 border-2 transition-colors duration-300 ${
                          isPassed
                            ? 'bg-[#0a74b5] border-[#0a74b5]'
                            : 'bg-white border-[#c3e8fb]'
                        }`}
                      />

                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-2.5 min-w-0">
                          <span
                            className={`text-2xl sm:text-3xl font-extrabold tabular-nums leading-none tracking-tight shrink-0 ${
                              isActive ? 'text-[#0a74b5]' : 'text-[#27a8ec]/75'
                            }`}
                          >
                            {step.stepNumber}
                          </span>
                          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-[#0a74b5]">
                            {step.subtitle}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#0d2433]/60 tabular-nums shrink-0">
                          {step.metricValue}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0d2433] mt-2">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#0d2433]/75 mt-2">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dedicated Cooperative Manager Testimonial Slot inside From Farm to Cup */}
          <div
            data-reveal="up"
            data-testid="farm-to-cup-manager-testimonial"
            className="mt-14 pt-14 border-t border-[#c3e8fb]"
          >
            <div className="bg-white border border-[#c3e8fb] p-6 sm:p-8 lg:p-10 shadow-[0_24px_60px_-24px_rgba(13,36,51,0.14)] layout-split-5-7 gap-8 lg:gap-10 items-center">
              <div>
                <div className="bg-[#eef8fe] p-2.5 border border-[#c3e8fb]">
                  <ResilientImage
                    src={MANAGERS_MESSAGE.image}
                    alt={MANAGERS_MESSAGE.imageAlt}
                    className="w-full aspect-[4/3] object-cover object-[50%_18%]"
                  />
                </div>
                <div className="pt-2.5 text-xs font-semibold text-[#0d2433]/75">
                  {MANAGERS_MESSAGE.caption}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
                  {MANAGERS_MESSAGE.eyebrow} · Leadership Commitment
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0d2433]">
                  {MANAGERS_MESSAGE.heading}
                </h3>
                <blockquote className="bg-[#eef8fe]/60 border border-[#c3e8fb] p-5 text-base sm:text-lg font-semibold text-[#0d2433] leading-relaxed">
                  {MANAGERS_MESSAGE.quote}
                </blockquote>
                <div className="space-y-2.5 text-sm leading-relaxed text-[#0d2433]/80">
                  {MANAGERS_MESSAGE.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#eef8fe] text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                  {MANAGERS_MESSAGE.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4B. INSIDE OUR PLANT (3 FADE-IN CARDS IN TURN + QUIET VIEWPORT VIDEO) */}
      <InsidePlantSection active={isActivePage} onNavigate={onNavigate} />

      {/* 5. SERVE IT YOUR WAY (THREE CLICK-TO-FLIP 3D CARDS) */}
      <section className="py-12 sm:py-16 lg:py-22 bg-white">
        <div className="site-container">
          <div data-reveal="up" className="mb-8 sm:mb-12">
            <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
              Serve it your way
            </h2>
            <p className="text-sm sm:text-base text-[#0d2433]/70 mt-4 max-w-xl">
              Click any recipe card to flip it in 3D and explore quick serving
              ideas powered by Relish yoghurts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {RECIPE_CARDS.map((recipe, idx) => {
              const isFlipped = Boolean(flippedCards[recipe.id]);
              const linkedProduct =
                PRODUCTS.find((p) => p.id === recipe.productId) ?? PRODUCTS[0];
              const isRecipeAdded = Boolean(recentlyAddedIds[linkedProduct.id]);

              return (
                <div
                  key={recipe.id}
                  data-reveal="up"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div
                    data-testid={`recipe-card-${recipe.id}`}
                    onClick={() => toggleFlip(recipe.id)}
                    className={`flip-card-scene h-[390px] sm:h-[420px] cursor-pointer ${
                      isFlipped ? 'is-flipped' : ''
                    }`}
                  >
                    <div className="flip-card-inner">
                      {/* Front Face */}
                      <div className="flip-card-face flip-card-front bg-[#eef8fe]/40 border border-[#c3e8fb] flex flex-col justify-between overflow-hidden shadow-[0_14px_38px_-18px_rgba(13,36,51,0.16)] hover:border-[#27a8ec] transition-colors">
                      <div className="h-[235px] sm:h-[268px] overflow-hidden">
                        <ProductStudioVisual
                          src={recipe.image}
                          alt={recipe.title}
                          glowColor={linkedProduct.glowColor}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-4 sm:p-5 bg-white flex-1 flex flex-col justify-between border-t border-[#dff1fb]">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                            {recipe.prepTime} · Serves {recipe.serves}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#0d2433] mt-1">
                            {recipe.title}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#eef8fe]">
                          <span className="text-xs text-[#0d2433]/65 truncate mr-2">
                            {recipe.productLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlip(recipe.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] cursor-pointer shrink-0"
                          >
                            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>View recipe</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Back Face */}
                    <div className="flip-card-face flip-card-back bg-[#eef8fe] border border-[#27a8ec]/40 p-5 sm:p-7 flex flex-col justify-between shadow-[0_18px_44px_-18px_rgba(10,116,181,0.25)]">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#c3e8fb]">
                          <h3 className="text-lg font-bold text-[#0d2433]">
                            {recipe.title}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlip(recipe.id);
                            }}
                            className="text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] cursor-pointer"
                          >
                            Back
                          </button>
                        </div>

                        <div className="mt-4">
                          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                            Ingredients
                          </div>
                          <ul className="mt-2 space-y-1.5 text-xs text-[#0d2433]/85">
                            {recipe.ingredients.map((ing) => (
                              <li key={ing}>• {ing}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4">
                          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                            Method
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-[#0d2433]/80">
                            {recipe.method}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(linkedProduct, e.currentTarget);
                        }}
                        className={`btn-shine w-full inline-flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 transition-colors cursor-pointer ${
                          isRecipeAdded
                            ? 'bg-[#0a74b5]'
                            : 'bg-[#0d2433] hover:bg-[#0a74b5]'
                        }`}
                      >
                        {isRecipeAdded ? (
                          <span>Added ✓</span>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                            <span>
                              Add {linkedProduct.flavourLabel} · KES {linkedProduct.priceKes}
                            </span>
                          </>
                        )}
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FIND YOUR FLAVOUR (2-QUESTION QUIZ) */}
      <section className="py-12 sm:py-16 lg:py-22 bg-[#dff1fb]/70">
        <div className="site-container">
          <div className="layout-split-7-5 gap-8 lg:gap-12 items-center">
            <div data-reveal="up" className="space-y-5 sm:space-y-6">
              <div>
                <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
                  Find your flavour
                </h2>
                <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4">
                  Answer two quick questions and we will pair you with your ideal
                  Limuru Fresh or Relish pack.
                </p>
              </div>

              {/* Q1 Mood */}
              <div className="bg-white border border-[#c3e8fb] p-4 sm:p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-3.5">
                  1. What is your mood today?
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'fruity', label: 'Bright & Fruity' },
                    { id: 'classic', label: 'Smooth & Classic' },
                    { id: 'indulgent', label: 'Dessert Treat' },
                    { id: 'everyday', label: 'Everyday Milk' },
                  ].map((opt) => {
                    const active = quizAnswers.mood === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            mood: opt.id as QuizAnswers['mood'],
                          }))
                        }
                        className={`px-3 py-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                          active
                            ? 'bg-[#0d2433] text-white'
                            : 'bg-[#eef8fe] text-[#0d2433] hover:bg-[#c3e8fb]/65'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q2 Quantity */}
              <div className="bg-white border border-[#c3e8fb] p-4 sm:p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-3.5">
                  2. How much are you sharing?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'single', label: 'Just for me (500ml)' },
                    { id: 'medium', label: 'Couple / Small family (1L–2L)' },
                    { id: 'family', label: 'Full household (3L+)' },
                  ].map((opt) => {
                    const active = quizAnswers.quantity === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            quantity: opt.id as QuizAnswers['quantity'],
                          }))
                        }
                        className={`px-3 py-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                          active
                            ? 'bg-[#0d2433] text-white'
                            : 'bg-[#eef8fe] text-[#0d2433] hover:bg-[#c3e8fb]/65'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recommendation Card (slides in smoothly on selection changes) */}
            <div data-reveal="up">
              <div
                key={quizRecommendation.product.id}
                data-testid="quiz-result-card"
                className="animate-quiz-slide-in bg-white border border-[#c3e8fb] p-5 sm:p-8 shadow-[0_24px_60px_-24px_rgba(10,116,181,0.20)]"
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                  Your Cooperative Match
                </div>
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                  <div className="w-full sm:w-40 h-44 shrink-0 border border-[#c3e8fb] overflow-hidden">
                    <ProductStudioVisual
                      src={quizRecommendation.product.image}
                      alt={quizRecommendation.product.name}
                      glowColor={quizRecommendation.product.glowColor}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#0a74b5]">
                      {quizRecommendation.product.brand} · {quizRecommendation.product.size}
                    </div>
                    <h3 className="text-lg font-bold text-[#0d2433] mt-0.5">
                      {quizRecommendation.product.name}
                    </h3>
                    <div className="text-2xl font-extrabold text-[#0d2433] mt-1 tabular-nums">
                      KES {quizRecommendation.product.priceKes}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#0d2433]/75 mt-5 leading-relaxed">
                  {quizRecommendation.reason}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(e) =>
                      onAddToCart(quizRecommendation.product, e.currentTarget)
                    }
                    className={`btn-shine flex-1 inline-flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 transition-colors cursor-pointer ${
                      recentlyAddedIds[quizRecommendation.product.id]
                        ? 'bg-[#0d2433]'
                        : 'bg-[#0a74b5] hover:bg-[#0d2433]'
                    }`}
                  >
                    {recentlyAddedIds[quizRecommendation.product.id] ? (
                      <span>Added ✓</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        <span>Add to cart</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickView(quizRecommendation.product)}
                    className="btn-shine inline-flex items-center justify-center bg-[#eef8fe] hover:bg-[#dff1fb] text-[#0d2433] text-xs font-bold uppercase tracking-wider py-3.5 px-5 transition-colors cursor-pointer"
                  >
                    Quick view
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. JOIN OUR JOURNEY SKY-BLUE SIGN-UP BAND + BRAND STRIP */}
      <section className="bg-[#8fd5f7] text-[#0d2433] py-12 sm:py-16">
        <div className="site-container">
          <div className="layout-split-6-6 gap-6 sm:gap-8 items-center">
            <div>
              <h2 className="fluid-h2 font-bold tracking-tight text-[#0d2433]">
                Join our journey
              </h2>
              <p className="text-sm sm:text-base text-[#0d2433]/80 mt-2">
                Receive seasonal Relish flavour launches, cooperative farmer stories,
                and Kiambu &amp; Nairobi retail stockist updates.
              </p>
            </div>

            <div>
              <form
                onSubmit={handleNewsletterSubmit}
                noValidate
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <label htmlFor="journey-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="journey-email"
                  type="email"
                  maxLength={160}
                  autoComplete="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-white px-4 py-3.5 text-sm text-[#0d2433] placeholder:text-[#0d2433]/45 focus:outline-none focus:ring-2 focus:ring-[#0a74b5]"
                />
                <button
                  type="submit"
                  disabled={newsletterSubmitting}
                  className="btn-shine bg-[#0d2433] hover:bg-[#0a74b5] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-[0.16em] px-7 py-4 transition-colors cursor-pointer shrink-0"
                >
                  {newsletterSubmitting ? 'Saving...' : 'Subscribe'}
                </button>
              </form>
              {newsletterError && (
                <p className="text-xs font-semibold text-[#991b1b] mt-2" role="alert">
                  {newsletterError}
                </p>
              )}
              {newsletterSuccess && (
                <p
                  data-testid="newsletter-success"
                  className="text-xs font-semibold text-[#0d2433] mt-2"
                  role="status"
                >
                  {newsletterSuccess}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Row of brand names */}
      <section className="bg-[#eef8fe]/70 border-b border-[#c3e8fb] py-6 sm:py-8">
        <div className="site-container">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-4 sm:gap-6 text-center">
            {[
              'Limuru Dairy Co-op',
              'Limuru Fresh',
              'Relish Yoghurt',
              'LIMDA Feeds',
              'KEBS Certified',
              'Kenya Dairy Board',
            ].map((brandName) => (
              <span
                key={brandName}
                className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#0d2433]/65"
              >
                {brandName}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 8. WHY CHOOSE US (Bottom of Homepage above Footer) */}
      <section
        id="why-choose-us"
        data-reveal="up"
        data-testid="home-why-choose-us"
        className="bg-white py-12 sm:py-16 lg:py-20"
      >
        <div className="site-container">
          <div className="flex flex-col min-[861px]:flex-row min-[861px]:items-end justify-between gap-5 sm:gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
                Cooperative Promise · Since 1962
              </div>
              <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433] mt-1">
                Why choose us
              </h2>
            </div>

            {onNavigate && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('farmer-services')}
                  className="inline-flex items-center gap-1.5 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0d2433] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Farmer Services</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0a74b5]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('certifications')}
                  className="inline-flex items-center gap-1.5 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0d2433] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Certifications</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0a74b5]" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 sm:mt-10 layout-split-2 gap-4 sm:gap-5">
            {WHY_CHOOSE_US_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3.5 sm:gap-4 bg-[#eef8fe]/65 border border-[#c3e8fb] p-4 sm:p-6"
              >
                <span className="w-6 h-6 bg-[#0a74b5] text-white inline-flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#0d2433]">{item.title}</h4>
                  <p className="text-sm text-[#0d2433]/75 leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
