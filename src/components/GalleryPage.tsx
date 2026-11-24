import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/content';
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0d2433] text-white'
                      : 'bg-[#eef8fe]/80 text-[#0d2433]/80 hover:bg-[#dff1fb] hover:text-[#0d2433]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] tabular-nums ${
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
                className="break-inside-avoid relative group bg-[#eef8fe] border border-[#c3e8fb] hover:border-[#27a8ec] overflow-hidden transition-colors duration-200 shadow-[0_12px_32px_-24px_rgba(13,36,51,0.16)]"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`Open full screen view: ${item.title}`}
                  className="block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a74b5]"
                >
                  {item.isCutout ? (
                    <ProductStudioVisual
                      src={item.image}
                      alt={item.title}
                      glowColor="rgba(39, 168, 236, 0.24)"
                      className={`w-full ${item.aspectClass} p-2`}
                      imgClassName="transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ResilientImage
                      src={item.image}
                      alt={item.title}
                      className={`w-full ${item.aspectClass} object-cover object-[50%_20%] transition-transform duration-500 group-hover:scale-105`}
                    />
                  )}

                  {/* Measured gradient scrim with subtle resting title & full caption on hover */}
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 pt-14 bg-gradient-to-t from-[#0d2433]/92 via-[#0d2433]/52 to-transparent text-white opacity-95 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8fd5f7]">
                        {item.category}
                      </div>
                      <div className="text-sm font-bold mt-0.5">{item.title}</div>
                      <p className="text-xs text-white/85 mt-1 hidden sm:block">
                        {item.caption}
                      </p>
                    </div>
                    <Expand className="w-4 h-4 shrink-0 text-[#8fd5f7]" aria-hidden="true" />
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
                className="w-10 h-10 inline-flex items-center justify-center bg-white text-[#0d2433] hover:bg-[#8fd5f7] cursor-pointer"
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
                className="absolute left-1 sm:left-4 z-10 w-9 h-9 sm:w-11 sm:h-11 inline-flex items-center justify-center bg-white/95 text-[#0d2433] hover:bg-[#8fd5f7] cursor-pointer shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="max-w-4xl max-h-[60dvh] sm:max-h-[72dvh] w-full flex items-center justify-center px-10 sm:px-14">
                {activeItem.isCutout ? (
                  <ProductStudioVisual
                    src={activeItem.image}
                    alt={activeItem.title}
                    glowColor="rgba(39, 168, 236, 0.25)"
                    className="w-[min(78vw,500px)] h-[min(56dvh,500px)] p-3 border border-[#8fd5f7] shadow-2xl"
                  />
                ) : (
                  <ResilientImage
                    src={activeItem.image}
                    alt={activeItem.title}
                    className="max-h-[60dvh] sm:max-h-[72dvh] w-auto max-w-full object-contain bg-[#eef8fe] shadow-2xl"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
                }
                aria-label="Next image"
                className="absolute right-1 sm:right-4 z-10 w-9 h-9 sm:w-11 sm:h-11 inline-flex items-center justify-center bg-white/95 text-[#0d2433] hover:bg-[#8fd5f7] cursor-pointer shadow-md"
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
