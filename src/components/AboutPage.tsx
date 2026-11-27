import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  ASSET_IMAGES,
  CORE_VALUES,
  HISTORY_TIMELINE,
  MANAGERS_MESSAGE,
  STRATEGIC_GOALS,
} from '../content/dairyContent';
import type { PageRoute } from '../types/dairy';
import { LimuruDairyLogo, ResilientImage } from './BrandMark';
import { SectionPageBreak } from './SectionPageBreak';

interface AboutPageProps {
  onNavigate?: (page: PageRoute, sectionId?: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div data-testid="about-page" className="animate-page-in">
      {/* Opening Band (Pale Sky) */}
      <section className="bg-[#eef8fe] py-10 sm:py-14 lg:py-16">
        <div className="site-container">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
            Limuru Dairy Farmers’ Co-operative Society Ltd.
          </div>
          <h1 className="heading-underline fluid-page-h1 font-bold tracking-tight text-[#0d2433] mt-2">
            About Us
          </h1>
          <p className="text-base sm:text-xl font-medium leading-relaxed text-[#0d2433]/90 mt-6 max-w-3xl">
            Limuru Dairy Farmers’ Co-operative Society is wholly owned by
            smallholder farmer members across the lush Limuru and Kiambu
            highlands—uniting 11,850 dedicated households to deliver pure Kenyan
            dairy while maximizing returns back to the farm.
          </p>
        </div>
      </section>

      <SectionPageBreak
        variant="cream-arch"
        fromBg="#eef8fe"
        toBg="#ffffff"
        ribbonColor="rgba(143, 213, 247, 0.35)"
      />

      {/* 1. Manager's Message (White - First section in About Us) */}
      <section id="managers-message" className="scroll-mt-24 bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
            {MANAGERS_MESSAGE.eyebrow}
          </div>
          <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433] mt-1">
            {MANAGERS_MESSAGE.heading}
          </h2>

          <div className="mt-10 layout-split-5-7 gap-10 items-center">
            <div>
              <div className="bg-[#eef8fe] rounded-2xl p-3 border border-[#c3e8fb] shadow-[0_20px_50px_-24px_rgba(13,36,51,0.16)]">
                <ResilientImage
                  src={MANAGERS_MESSAGE.image}
                  alt={MANAGERS_MESSAGE.imageAlt}
                  loading="lazy"
                  className="w-full rounded-xl aspect-[4/3] object-cover object-[50%_18%]"
                />
                <div className="pt-3 px-1 text-xs font-semibold text-[#0d2433]/70">
                  {MANAGERS_MESSAGE.caption}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <blockquote className="bg-[#eef8fe]/60 border border-[#c3e8fb] p-5 text-lg sm:text-xl font-semibold text-[#0d2433] leading-relaxed">
                {MANAGERS_MESSAGE.quote}
              </blockquote>
              {MANAGERS_MESSAGE.paragraphs.map((para, idx) => (
                <p
                  key={idx}
                  className="text-sm sm:text-base leading-[1.75] text-[#0d2433]/80"
                >
                  {para}
                </p>
              ))}
              <div className="pt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                {MANAGERS_MESSAGE.role}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionPageBreak
        variant="horizon-wave"
        fromBg="#ffffff"
        toBg="#eef8fe"
        ribbonColor="rgba(143, 213, 247, 0.34)"
        printBreakBefore
      />

      {/* 2. Who We Are (Pale Sky) */}
      <section id="who-we-are" className="scroll-mt-24 bg-[#eef8fe] py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
            Who we are
          </h2>
          <div className="mt-10 layout-split-6-6 gap-10 items-center">
            <div className="space-y-4 text-sm sm:text-base leading-[1.75] text-[#0d2433]/80">
              <p>
                Registered as a farmer-owned dairy cooperative in 1962, Limuru Dairy
                serves as the vital link between Kiambu County’s smallholder dairy
                farmers and families across Kenya.
              </p>
              <p>
                With 11,850 active member farmers, our society collects, chills,
                tests, pasteurizes, and packages fresh milk and cultured Relish
                yoghurt daily—ensuring transparent farm-gate payouts, veterinary
                stewardship, and affordable quality nutrition.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-3 border border-[#c3e8fb] shadow-[0_20px_50px_-24px_rgba(13,36,51,0.16)]">
                <ResilientImage
                  src={ASSET_IMAGES.maziwaHouse}
                  alt="Maziwa House headquarters of Limuru Dairy Farmers Co-operative Society Ltd"
                  loading="lazy"
                  className="w-full rounded-xl aspect-[4/3] object-cover object-top"
                />
                <div className="pt-3 px-1 text-xs font-semibold text-[#0d2433]/70">
                  Maziwa House · Cooperative HQ, Limuru Town
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3 border border-[#c3e8fb] shadow-[0_20px_50px_-24px_rgba(13,36,51,0.16)]">
                <ResilientImage
                  src={ASSET_IMAGES.plantReception}
                  alt="Limuru Dairy processing plant Reception building and landscaped grounds"
                  loading="lazy"
                  className="w-full rounded-xl aspect-[4/3] object-cover"
                />
                <div className="pt-3 px-1 text-xs font-semibold text-[#0d2433]/70">
                  Processing Plant Reception · Limuru Dairy Farmers Coop Operations
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionPageBreak
        variant="cream-arch"
        fromBg="#eef8fe"
        toBg="#ffffff"
        ribbonColor="rgba(143, 213, 247, 0.34)"
      />

      {/* 2. Vision & Values (White) */}
      <section id="vision-values" className="scroll-mt-24 bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container space-y-8 sm:space-y-12">
          <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
            Vision &amp; values
          </h2>

          <div className="layout-split-2 gap-5 sm:gap-6">
            <div className="bg-[#eef8fe]/75 p-5 sm:p-8 border border-[#dff1fb]">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                Our Vision
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#0d2433] mt-3 leading-snug">
                “To be the home of excellence in Dairy Value Chain.”
              </p>
            </div>

            <div className="bg-[#eef8fe]/75 p-5 sm:p-8 border border-[#dff1fb]">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                Our Mission
              </div>
              <p className="text-sm sm:text-base font-medium text-[#0d2433]/85 mt-3 leading-relaxed">
                “To Maximize members’ returns through enhanced Milk Production,
                Processing, Marketing of Quality Dairy products, Animal Feeds and
                Vet Services in collaboration with all stakeholders.”
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold uppercase tracking-[0.16em] text-[#0d2433]/70 mb-5">
              Core Values
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CORE_VALUES.map((val) => (
                <div
                  key={val.name}
                  className="bg-[#eef8fe]/65 border border-[#dff1fb] p-4 sm:p-5"
                >
                  <div className="text-base font-bold text-[#0a74b5]">{val.name}</div>
                  <p className="text-xs leading-relaxed text-[#0d2433]/75 mt-2">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Strategic Plan (Pale Sky) */}
      <section id="strategic-plan" className="scroll-mt-24 bg-[#eef8fe] py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
            Strategic plan
          </h2>
          <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
            Five strategic pillars guide our cooperative investments, farmer support,
            and retail growth across Kenya.
          </p>

          <div className="mt-10 layout-split-2 gap-6">
            {STRATEGIC_GOALS.map((goal) => (
              <div
                key={goal.number}
                className="bg-white border border-[#c3e8fb] p-7 flex items-start gap-5"
              >
                <span className="text-3xl font-extrabold text-[#27a8ec] tabular-nums shrink-0 leading-none">
                  {goal.number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0d2433]">{goal.title}</h3>
                  <p className="text-xs sm:text-sm text-[#0d2433]/75 mt-1.5 leading-relaxed">
                    {goal.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. History Timeline 1962 to 1997 with Side Panel Logo (Pale Sky) */}
      <section id="history" className="scroll-mt-24 bg-[#dff1fb]/75 py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
            History
          </h2>

          <div className="mt-10 layout-split-8-4 gap-8 items-start">
            <div className="space-y-4">
              {HISTORY_TIMELINE.map((milestone) => (
                <div
                  key={milestone.year}
                  className="bg-white border border-[#c3e8fb] p-6 flex flex-col sm:flex-row gap-5 sm:items-start"
                >
                  <span className="inline-block text-2xl font-extrabold text-[#0a74b5] tabular-nums shrink-0 w-20">
                    {milestone.year}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#0d2433]">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-[#0d2433]/75 mt-1.5 leading-relaxed">
                      {milestone.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Side panel holding the logo & closing paragraph */}
            <aside className="bg-white border border-[#c3e8fb] p-7 space-y-5">
              <LimuruDairyLogo />
              <div className="border-t border-[#eef8fe] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                  Heritage Since 1962
                </h3>
                <p className="text-sm leading-relaxed text-[#0d2433]/80 mt-2">
                  From a modest collection cooperative in 1962 to our 1997 processing
                  transformation and modern Relish &amp; Limuru Fresh brands, every
                  chapter has remained anchored in member ownership and highland dairy
                  integrity.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Clean Closing CTA to Shop & Gallery (White above Pale-Sky Footer) */}
      {onNavigate && (
        <section className="bg-white py-14 border-t border-[#c3e8fb]">
          <div className="site-container flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                From Our Farms To Your Table
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0d2433] mt-1">
                Experience Limuru Fresh &amp; Relish Today
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('gallery')}
                className="inline-flex items-center gap-2 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#0d2433] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>View Photo Gallery</span>
                <ArrowRight className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center gap-2 bg-[#0a74b5] hover:bg-[#0d2433] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Shop Dairy Range</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
