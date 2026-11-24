import type { PageRoute } from '../types/dairy';

export interface ParsedHashRoute {
  page?: PageRoute;
  sectionId?: string;
  scrollFooter?: boolean;
}

const ABOUT_SECTION_ALIASES: Record<string, string> = {
  'managers-message': 'managers-message',
  'manager-message': 'managers-message',
  'who-we-are': 'who-we-are',
  'vision-values': 'vision-values',
  vision: 'vision-values',
  values: 'vision-values',
  'strategic-plan': 'strategic-plan',
  objectives: 'strategic-plan',
  strategy: 'strategic-plan',
  history: 'history',
};

export function parseHashRoute(hash: string): ParsedHashRoute {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();

  if (!cleaned || cleaned === 'home') {
    return { page: 'home' };
  }

  if (cleaned === 'footer-contact' || cleaned === 'contact') {
    return { scrollFooter: true };
  }

  if (cleaned === 'about') {
    return { page: 'about' };
  }

  if (cleaned.startsWith('about/')) {
    const [, rawSection] = cleaned.split('/');
    const resolved = rawSection ? ABOUT_SECTION_ALIASES[rawSection] ?? rawSection : undefined;
    return { page: 'about', sectionId: resolved };
  }

  if (ABOUT_SECTION_ALIASES[cleaned]) {
    return { page: 'about', sectionId: ABOUT_SECTION_ALIASES[cleaned] };
  }

  if (cleaned === 'farmer-services') {
    return { page: 'farmer-services' };
  }

  if (cleaned === 'certifications') {
    return { page: 'certifications' };
  }

  if (cleaned === 'shop') {
    return { page: 'shop' };
  }

  if (cleaned === 'gallery') {
    return { page: 'gallery' };
  }

  if (cleaned === 'media') {
    return { page: 'media' };
  }

  return { page: 'home' };
}

export function buildHashUrl(page: PageRoute, sectionId?: string): string {
  if (sectionId && ABOUT_SECTION_ALIASES[sectionId]) {
    return `#${ABOUT_SECTION_ALIASES[sectionId]}`;
  }
  if (sectionId) {
    return `#${page}/${sectionId}`;
  }
  return `#${page}`;
}
