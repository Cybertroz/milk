import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { GALLERY_ITEMS } from '../content/dairyContent';
import { ProductStudioVisual, ResilientImage } from './BrandMark';

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(GALLERY_ITEMS.map((item) => item.category)));
    return [
      { label: 'All', count: GALLERY_ITEMS.length },
      ...unique.map((cat) => ({
        label: cat,
        count: GALLERY_ITEMS.filter((item) => item.category === cat).length,
      })),
    ];
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((idx) =>
          idx === null || filteredItems.length === 0
            ? null
            : (idx + 1) % filteredItems.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((idx) =>
          idx === null || filteredItems.length === 0
            ? null
            : (idx - 1 + filteredItems.length) % filteredItems.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, filteredItems.length]);

  const activeItem =
    lightboxIndex !== null && filteredItems[lightboxIndex]
      ? filteredItems[lightboxIndex]
      : null;

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    setLightboxIndex(null);
  };

  return (
    <div className="animate-page-in bg-white">
      <section className="bg-[#eef8fe] py-10 sm:py-14">
        <div className="site-container">
          <h1 className="heading-underline fluid-page-h1 font-bold tracking-tight text-[#0d2433]">
            Gallery
          </h1>
          <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
            Documentary scenes from our Limuru highland farms, village farmers’
            collection centres, stainless-steel pasteurization lines, leadership
            engagements, and Ushirika community milestones.
          </p>
        </div>
      </section>

      {/* Category Filter Bar */}
      <section className="border-b border-[#0a74b5]/10 bg-white">
        <div className="site-container py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Filter gallery by category"
            className="flex flex-wrap gap-1.5"
          >
            {categories.map((cat) => {
              const active = activeCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectCategory(cat.label)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0d2433] text-white shadow-xs'
                      : 'bg-[#eef8fe]/80 text-[#0d2433]/80 hover:bg-[#dff1fb] hover:text-[#0d2433]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${
                      active
                        ? 'bg-[#27a8ec] text-[#0d2433]'
                        : 'bg-white text-[#0a74b5]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            data-testid="gallery-count"
            className="text-xs font-semibold text-[#0d2433]/65 tabular-nums shrink-0"
          >
            Showing {filteredItems.length} of {GALLERY_ITEMS.length} photos
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="site-container">
          {/* Masonry Photo Grid with smooth filter cross-fade */}
          <div
            key={activeCategory}
            data-testid="gallery-grid"
            className="animate-view-fade columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 space-y-4 sm:space-y-6"
          >
            {filteredItems.map((item, idx) => (
              <figure
                key={item.id}
                data-testid={`gallery-item-${item.id}`}
                className="break-inside-avoid relative group rounded-2xl bg-white border border-[#c3e8fb] hover:border-[#27a8ec] overflow-hidden transition-all duration-300 shadow-[0_12px_32px_-24px_rgba(13,36,51,0.16)] hover:shadow-[0_20px_44px_-22px_rgba(10,116,181,0.28)]"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`Open full screen view: ${item.title}`}
                  className="block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a74b5]"
                >
                  <div className="relative overflow-hidden bg-[#eef8fe]">
                    {item.isCutout ? (
                      <ProductStudioVisual
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        glowColor="rgba(39, 168, 236, 0.24)"
                        className={`w-full ${item.aspectClass} p-2`}
                        imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <ResilientImage
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className={`w-full ${item.aspectClass} object-cover object-[50%_20%] transition-transform duration-500 group-hover:scale-[1.03]`}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#0d2433]/75 text-white inline-flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
                    >
                      <Expand className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Clean unobstructed editorial caption footer below the photograph */}
                  <figcaption className="p-4 bg-white border-t border-[#c3e8fb] flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                        {item.category}
                      </div>
                      <div className="text-sm font-bold text-[#0d2433] mt-0.5 leading-snug">
                        {item.title}
                      </div>
                      <p className="text-xs text-[#0d2433]/70 mt-1 line-clamp-2">
                        {item.caption}
                      </p>
                    </div>
                  </figcaption>
                </button>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Full-Screen Lightbox */}
      {activeItem &&
        lightboxIndex !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-[#0d2433]/95 backdrop-blur-md flex flex-col justify-between safe-overlay-pad sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Image lightbox: ${activeItem.title}`}
          >
            <div className="flex items-center justify-between text-white">
              <div
                data-testid="lightbox-counter"
                className="text-xs font-bold uppercase tracking-widest text-[#8fd5f7] tabular-nums"
              >
                {String(lightboxIndex + 1).padStart(2, '0')} /{' '}
                {String(filteredItems.length).padStart(2, '0')} · {activeItem.category}
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close lightbox"
                className="w-10 h-10 rounded-xl inline-flex items-center justify-center bg-white text-[#0d2433] hover:bg-[#8fd5f7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center my-4 min-h-0">
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + filteredItems.length) % filteredItems.length
                  )
                }
                aria-label="Previous image"
                className="absolute left-1 sm:left-4 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-xl inline-flex items-center justify-center bg-white/95 text-[#0d2433] hover:bg-[#8fd5f7] cursor-pointer shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="max-w-4xl max-h-[60dvh] sm:max-h-[72dvh] w-full flex items-center justify-center px-10 sm:px-14">
                {activeItem.isCutout ? (
                  <ProductStudioVisual
                    src={activeItem.image}
                    alt={activeItem.title}
                    glowColor="rgba(39, 168, 236, 0.25)"
                    className="w-[min(78vw,500px)] h-[min(56dvh,500px)] rounded-2xl p-3 border border-[#8fd5f7] shadow-2xl"
                  />
                ) : (
                  <ResilientImage
                    src={activeItem.image}
                    alt={activeItem.title}
                    className="max-h-[60dvh] sm:max-h-[72dvh] w-auto max-w-full rounded-xl object-contain bg-[#eef8fe] shadow-2xl"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
                }
                aria-label="Next image"
                className="absolute right-1 sm:right-4 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-xl inline-flex items-center justify-center bg-white/95 text-[#0d2433] hover:bg-[#8fd5f7] cursor-pointer shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center text-white max-w-2xl mx-auto px-2">
              <h2 className="text-base sm:text-lg font-bold">{activeItem.title}</h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 line-clamp-2 sm:line-clamp-none">{activeItem.caption}</p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
