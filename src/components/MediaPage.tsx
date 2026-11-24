import React from 'react';
import { Mail } from 'lucide-react';
import { MEDIA_ARTICLES } from '../data/content';
import { ResilientImage } from './BrandMark';

export function MediaPage() {
  return (
    <div className="animate-page-in bg-white">
      <section className="bg-[#eef8fe] py-10 sm:py-14">
        <div className="site-container">
          <h1 className="heading-underline fluid-page-h1 font-bold tracking-tight text-[#0d2433]">
            Media Centre
          </h1>
          <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
            Cooperative announcements, farmer payout milestones, and community
            highlights from Limuru Dairy Farmers’ Co-operative Society.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="site-container space-y-8 sm:space-y-12">
          {MEDIA_ARTICLES.map((article) => (
            <article
              key={article.id}
              className="layout-split-5-7 gap-6 sm:gap-8 bg-[#eef8fe]/45 p-4 sm:p-8 lg:p-9 shadow-[0_18px_48px_-28px_rgba(13,36,51,0.16)]"
            >
              <div>
                <div className="aspect-[4/3] bg-[#dff1fb] overflow-hidden">
                  <ResilientImage
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                    <span>{article.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.category}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0d2433] mt-2 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm font-semibold text-[#0d2433]/85 mt-3">
                    {article.summary}
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#0d2433]/75">
                    {article.body.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {/* Media Enquiries Block */}
          <div className="bg-[#dff1fb] p-5 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0d2433]">
                Media Enquiries
              </h2>
              <p className="text-sm text-[#0d2433]/80 mt-1.5 max-w-xl">
                For press releases, cooperative leadership interviews, and official
                brand assets, contact our communications desk at Maziwa House.
              </p>
            </div>
            <a
              href="mailto:info@limurudairy.co.ke?subject=Media%20Enquiry%20-%20Limuru%20Dairy"
              className="btn-shine inline-flex items-center justify-center gap-2.5 bg-[#0d2433] hover:bg-[#0a74b5] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-5 sm:px-6 py-3.5 sm:py-4 transition-colors shrink-0 break-all"
            >
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>info@limurudairy.co.ke</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
