import React from 'react';
import { ArrowRight, Award, FlaskConical, ShieldCheck, ThermometerSnowflake } from 'lucide-react';
import { ASSET_IMAGES } from '../content/dairyContent';
import type { PageRoute } from '../types/dairy';
import { KdbBadge, KebsBadge, ResilientImage } from './BrandMark';

interface CertificationsPageProps {
  onNavigate?: (page: PageRoute, sectionId?: string) => void;
}

const QUALITY_CHECKPOINTS = [
  {
    icon: FlaskConical,
    step: '01 · Platform Testing',
    title: 'Collection Centre Alcohol & Density Screening',
    detail:
      'Every morning delivery is weighed openly, strained through food-grade sieves, and tested for freshness, butterfat, and density before entering insulated transport.',
  },
  {
    icon: ThermometerSnowflake,
    step: '02 · Cold-Chain Hygiene',
    title: 'Clean-In-Place Pasteurization & Cooling',
    detail:
      'Automated CIP stainless-steel lines and calibrated holding temperatures safeguard live Relish yoghurt cultures and Limuru Fresh 90-day aseptic ESL/UHT cartons.',
  },
  {
    icon: ShieldCheck,
    step: '03 · Batch Traceability',
    title: 'Lot Coding & Regulatory Audit Readiness',
    detail:
      'Each cup, pouch, bottle, and wholesale carton carries a batch code and expiry date audited against Kenya Bureau of Standards and Kenya Dairy Board tolerances.',
  },
];

export function CertificationsPage({ onNavigate }: CertificationsPageProps) {
  return (
    <div data-testid="certifications-page" className="animate-page-in">
      {/* Opening Band (Pale Sky) */}
      <section className="bg-[#eef8fe] py-10 sm:py-14 lg:py-16">
        <div className="site-container">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0a74b5]">
            Food Safety &amp; Statutory Compliance
          </div>
          <h1 className="heading-underline fluid-page-h1 font-bold tracking-tight text-[#0d2433] mt-2">
            Certifications
          </h1>
          <p className="text-base sm:text-xl font-medium leading-relaxed text-[#0d2433]/90 mt-6 max-w-3xl">
            Every Limuru Fresh carton and Relish yoghurt batch complies with Kenya’s
            highest dairy quality, hygiene, and cooperative governance standards.
          </p>
        </div>
      </section>

      {/* Primary Regulatory Badges + Cold-Chain Ledger (White) */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433]">
            Statutory Marks &amp; Licensing
          </h2>
          <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
            Verified regulatory approvals underpinning every retail bottle, school
            cup, and wholesale crate dispatched from our Limuru processing plant.
          </p>

          <div className="mt-10 layout-split-2 gap-6">
            <KebsBadge />
            <KdbBadge />
          </div>

          <div className="mt-14">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-6">
              End-to-End Quality Control Checkpoints
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {QUALITY_CHECKPOINTS.map(({ icon: Icon, step, title, detail }) => (
                <article
                  key={step}
                  className="rounded-2xl bg-[#eef8fe]/60 border border-[#c3e8fb] p-5 sm:p-6 flex flex-col"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#c3e8fb] flex items-center justify-center text-[#0a74b5]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] mt-4">
                    {step}
                  </div>
                  <h4 className="text-base font-bold text-[#0d2433] mt-1">{title}</h4>
                  <p className="text-sm text-[#0d2433]/75 mt-2 leading-relaxed">
                    {detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plant Hygiene & Ushirika Cooperative Excellence Showcase (Pale Sky) */}
      <section className="bg-[#dff1fb]/65 border-y border-[#c3e8fb] py-12 sm:py-16 lg:py-20">
        <div className="site-container layout-split-6-6 gap-8 items-center">
          <div>
            <div className="bg-white rounded-2xl p-3 border border-[#c3e8fb] shadow-[0_20px_50px_-24px_rgba(13,36,51,0.16)]">
              <ResilientImage
                src={ASSET_IMAGES.plantInspection}
                alt="Quality and food-safety walkthrough inside Limuru Dairy processing facility"
                loading="lazy"
                className="w-full rounded-xl aspect-[4/3] object-cover"
              />
              <div className="pt-3 px-1 text-xs font-semibold text-[#0d2433]/70">
                Protective clean-room inspection inside our Limuru processing plant
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>102nd International Day of Cooperatives</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0d2433]">
              Recognized for Highest Percentage Rate Payment to Farmers
            </h2>
            <p className="text-sm sm:text-base text-[#0d2433]/80 leading-relaxed">
              Alongside food-safety licensing, Limuru Dairy Farmers’ Co-operative
              Society received a Certificate of Appreciation at the 102nd Ushirika
              Day celebrations—affirming that strict plant efficiency directly fuels
              stronger farmer payouts.
            </p>
            <div className="bg-white rounded-2xl border border-[#c3e8fb] p-4 flex items-center gap-4">
              <div className="w-20 h-16 rounded-xl shrink-0 overflow-hidden border border-[#c3e8fb]">
                <ResilientImage
                  src={ASSET_IMAGES.plantProductTeam}
                  alt="Limuru Dairy cooperative leaders and quality team outside the milk processing plant"
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="text-xs text-[#0d2433]/80 leading-relaxed">
                <strong className="block text-[#0d2433]">
                  Cooperative Governance &amp; Member Accountability
                </strong>
                Transparent annual audits and democratic board oversight protect both
                product quality and smallholder livelihoods.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Module Links (White for Footer contrast) */}
      {onNavigate && (
        <section className="bg-white py-14">
          <div className="site-container flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-[#0d2433]">
                Explore Related Cooperative Modules
              </h2>
              <p className="text-sm text-[#0d2433]/75 mt-1">
                See how farm-gate collection supports these standards or shop our
                certified dairy range directly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('farmer-services')}
                className="inline-flex items-center gap-2 bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#0d2433] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Farmer Services</span>
                <ArrowRight className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center gap-2 bg-[#0a74b5] hover:bg-[#0d2433] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Shop Certified Range</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
