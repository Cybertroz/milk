import React from 'react';
import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { ASSET_IMAGES } from '../data/content';
import type { PageRoute } from '../types/dairy';
import { ProductStudioVisual, ResilientImage } from './BrandMark';

interface FarmerServicesPageProps {
  onNavigate?: (page: PageRoute, sectionId?: string) => void;
}

export function FarmerServicesPage({ onNavigate }: FarmerServicesPageProps) {
  return (
    <div data-testid="farmer-services-page" className="animate-page-in">
      {/* Opening Band (Pale Sky) */}
      <section className="bg-[#eef8fe] py-10 sm:py-14 lg:py-16">
        <div className="site-container">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
            Limuru Dairy Cooperative · Beyond Milk
          </div>
          <h1 className="heading-underline fluid-page-h1 font-bold tracking-tight text-[#0d2433] mt-2">
            Farmer Services
          </h1>
          <p className="text-base sm:text-xl font-medium leading-relaxed text-[#0d2433]/90 mt-6 max-w-3xl">
            Every morning harvest is backed by village milk collection centres,
            cooperative-milled LIMDA dairy rations, field veterinary care, and modern
            pasteurization—built to uplift returns across 11,850 member households.
          </p>
        </div>
      </section>

      {/* Core Farmer Services 2x2 Architectural Grid (White) */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
                Four Pillars of Member Support
              </h2>
              <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
                Integrated farm-to-plant services delivered through transparent
                cooperative check-off accounts and trained field personnel.
              </p>
            </div>
          </div>

          <div className="mt-10 layout-split-2 gap-6">
            <article className="bg-white border border-[#c3e8fb] overflow-hidden shadow-[0_12px_36px_-24px_rgba(13,36,51,0.14)] flex flex-col">
              <div className="h-60 overflow-hidden border-b border-[#c3e8fb]">
                <ResilientImage
                  src={ASSET_IMAGES.coolingCentre}
                  alt="Attendant weighing morning milk beside the Faspol stainless cooling tank at a Limuru Dairy Milk Collection and Cooling Centre"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-7 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                  Collection Centre Level
                </div>
                <h3 className="text-lg font-bold text-[#0d2433] mt-1">
                  Farmers’ Collection Centres
                </h3>
                <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                  Community collection centres across Limuru and Kiambu where trained
                  clerks weigh, strain, and grade every farmer’s morning milk cleanly
                  and transparently.
                </p>
              </div>
            </article>

            <article className="bg-white border border-[#c3e8fb] overflow-hidden shadow-[0_12px_36px_-24px_rgba(13,36,51,0.14)] flex flex-col">
              <ProductStudioVisual
                src={ASSET_IMAGES.limdaFeeds}
                alt="LIMDA Feeds 70kg High Yield Dairy Meal bag"
                glowColor="rgba(39, 168, 236, 0.22)"
                className="h-60 p-1.5 border-b border-[#c3e8fb]"
              />
              <div className="p-7 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                  Nutrition
                </div>
                <h3 className="text-lg font-bold text-[#0d2433] mt-1">LIMDA Feeds</h3>
                <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                  High-yield dairy meal, calf pellets, and mineral supplements
                  formulated in-house and supplied on affordable check-off terms to
                  members.
                </p>
              </div>
            </article>

            <article className="bg-white border border-[#c3e8fb] overflow-hidden shadow-[0_12px_36px_-24px_rgba(13,36,51,0.14)] flex flex-col">
              <div className="h-60 overflow-hidden border-b border-[#c3e8fb]">
                <ResilientImage
                  src={ASSET_IMAGES.scrollingVet}
                  alt="LIMDA Feeds veterinary field team examining a dairy cow on a member farm"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-7 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                  Field Advisory &amp; Herd Health
                </div>
                <h3 className="text-lg font-bold text-[#0d2433] mt-1">
                  Extension &amp; Veterinary Services
                </h3>
                <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                  On-farm training in clean milking hygiene and fodder conservation,
                  paired with cooperative veterinary care, AI breeding, vaccinations,
                  and mastitis control.
                </p>
              </div>
            </article>

            <article className="bg-white border border-[#c3e8fb] overflow-hidden shadow-[0_12px_36px_-24px_rgba(13,36,51,0.14)] flex flex-col">
              <div className="h-60 overflow-hidden border-b border-[#c3e8fb]">
                <ResilientImage
                  src={ASSET_IMAGES.plantEquipment}
                  alt="Stainless steel milk processing and pasteurization equipment at Limuru Dairy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-7 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                  Milk Processing
                </div>
                <h3 className="text-lg font-bold text-[#0d2433] mt-1">
                  Milk Processing &amp; Pasteurization
                </h3>
                <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                  Inside our hygienic stainless-steel processing plant in Limuru,
                  raw milk is clarified, homogenized, and gently pasteurized under
                  strict KEBS and Kenya Dairy Board quality controls.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Member Value & Check-off Highlight Strip (Pale Sky) */}
      <section className="bg-[#dff1fb]/65 border-y border-[#c3e8fb] py-12 sm:py-16">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white border border-[#c3e8fb] p-6">
              <div className="text-2xl font-extrabold text-[#0a74b5] tabular-nums">
                11,850
              </div>
              <div className="text-sm font-bold text-[#0d2433] mt-1">
                Active Smallholder Members
              </div>
              <p className="text-xs text-[#0d2433]/75 mt-1.5 leading-relaxed">
                Serving farmers across Limuru, Tigoni, Lari, and neighbouring Kiambu
                highland routes daily.
              </p>
            </div>
            <div className="bg-white border border-[#c3e8fb] p-6">
              <div className="text-2xl font-extrabold text-[#0a74b5]">
                Credit Check-Off
              </div>
              <div className="text-sm font-bold text-[#0d2433] mt-1">
                LIMDA Feeds &amp; Vet Access
              </div>
              <p className="text-xs text-[#0d2433]/75 mt-1.5 leading-relaxed">
                Registered members draw dairy rations, mineral licks, and AI services
                against monthly milk deliveries.
              </p>
            </div>
            <div className="bg-white border border-[#c3e8fb] p-6">
              <div className="text-2xl font-extrabold text-[#0a74b5]">
                Rate Leader
              </div>
              <div className="text-sm font-bold text-[#0d2433] mt-1">
                102nd Ushirika Award
              </div>
              <p className="text-xs text-[#0d2433]/75 mt-1.5 leading-relaxed">
                Honoured for Highest in Percentage Rate Payment returned directly back
                to cooperative members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Member Helpdesk & Related Modules (White for clean contrast with Footer) */}
      <section className="bg-white py-16">
        <div className="site-container flex flex-col min-[861px]:flex-row min-[861px]:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-full sm:w-44 aspect-[4/3] shrink-0 overflow-hidden border border-[#c3e8fb] bg-[#eef8fe]">
              <ResilientImage
                src={ASSET_IMAGES.vetExtension}
                alt="Limuru Fresh veterinary extension officer consulting with dairy farmers"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                Member Desk · Maziwa House, 4th Floor
              </div>
              <h2 className="text-2xl font-bold text-[#0d2433] mt-1">
                Need Field Veterinary Dispatch or LIMDA Feeds Orders?
              </h2>
              <p className="text-sm text-[#0d2433]/75 mt-2 max-w-2xl">
                Reach our Limuru cooperative extension desk directly during daily milk
                intake hours for herd health support or member registration.
              </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="tel:0202010611"
                className="inline-flex items-center gap-2 bg-[#0d2433] hover:bg-[#0a74b5] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span>Call 020-2010611</span>
              </a>
              <a
                href="https://wa.me/254713833814"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] text-[#0d2433] text-xs font-bold uppercase tracking-wider px-5 py-3 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
                <span>WhatsApp 0713-833814</span>
              </a>
            </div>
          </div>
          </div>

          {onNavigate && (
            <div className="flex flex-wrap lg:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('certifications')}
                className="inline-flex items-center justify-between gap-3 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#0d2433] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>View Certifications</span>
                <ArrowRight className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center justify-between gap-3 bg-[#0a74b5] hover:bg-[#0d2433] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Shop Dairy Products</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
