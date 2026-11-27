import React from 'react';
import { Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { PageRoute } from '../types/dairy';
import { LimuruDairyLogo } from './BrandMark';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer
      id="footer-contact"
      className="bg-[#eef8fe] text-[#0d2433] border-t border-[#c3e8fb]"
    >
      <div className="site-container py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Follow Us */}
          <div className="space-y-5">
            <LimuruDairyLogo />
            <p className="text-xs sm:text-sm text-[#0d2433]/80 leading-relaxed">
              Limuru Dairy Farmers’ Co-operative Society Ltd. Wholly owned by
              11,850 smallholder dairy farmers in Kiambu County since 1962.
            </p>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-3">
                Follow us
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-white border border-[#c3e8fb] hover:bg-[#8fd5f7] transition-colors"
                >
                  Facebook
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-white border border-[#c3e8fb] hover:bg-[#8fd5f7] transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="https://wa.me/254713833814"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#c3e8fb] hover:bg-[#8fd5f7] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#0a74b5]" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://maps.google.com/?q=Maziwa+House+Limuru+Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-[#c3e8fb] hover:bg-[#8fd5f7] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#0a74b5]" aria-hidden="true" />
                  <span>Map</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-4">
              Explore
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('home');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('about');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  About us
                </a>
              </li>
              <li>
                <a
                  href="#farmer-services"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('farmer-services');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  Farmer Services
                </a>
              </li>
              <li>
                <a
                  href="#certifications"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('certifications');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  Certifications
                </a>
              </li>
              <li>
                <a
                  href="#shop"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('shop');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  Shop Limuru Fresh &amp; Relish
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('gallery');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="#media"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('media');
                  }}
                  className="hover:text-[#0a74b5] transition-colors"
                >
                  Media Centre
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Head Office Location */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-4">
              Location
            </h2>
            <address className="not-italic text-sm space-y-2 text-[#0d2433]/85">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0a74b5] shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <strong className="block text-[#0d2433]">Maziwa House, 4th Floor</strong>
                  <span>P.O. Box 8-00217, Limuru</span>
                  <span className="block">Kiambu County, Kenya</span>
                </div>
              </div>
            </address>
          </div>

          {/* Column 4: Direct Contact */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-4">
              Contact Us
            </h2>
            <ul className="space-y-2.5 text-sm text-[#0d2433]/85">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0a74b5] shrink-0" aria-hidden="true" />
                <a href="tel:0202010611" className="hover:text-[#0a74b5] tabular-nums">
                  Tel: 020-2010611
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0a74b5] shrink-0" aria-hidden="true" />
                <a href="tel:+254713833814" className="hover:text-[#0a74b5] tabular-nums">
                  Cell: 0713-833814
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0a74b5] shrink-0" aria-hidden="true" />
                <a
                  href="mailto:limurudairy@gmail.com"
                  className="hover:text-[#0a74b5] break-all"
                >
                  limurudairy@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0a74b5] shrink-0" aria-hidden="true" />
                <a
                  href="mailto:info@limurudairy.co.ke"
                  className="hover:text-[#0a74b5] break-all"
                >
                  info@limurudairy.co.ke
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#0a74b5] shrink-0" aria-hidden="true" />
                <a
                  href="https://www.limurudairy.co.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0a74b5]"
                >
                  www.limurudairy.co.ke
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#8fd5f7] border-t border-[#27a8ec]/30 pt-4 safe-footer-bottom">
        <div className="site-container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium text-[#0d2433]">
          <span>
            © {new Date().getFullYear()} Limuru Dairy Farmers’ Co-operative Society
            Ltd. All rights reserved.
          </span>
          <span>Together for quality, growth &amp; sustainability</span>
        </div>
      </div>
    </footer>
  );
}
