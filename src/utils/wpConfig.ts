import type { PageRoute } from '../types/dairy.ts';

export interface LimuruDairyRuntimeConfig {
  assetBaseUrl?: string;
  apiBaseUrl?: string;
  initialPage?: PageRoute;
  wpNonce?: string;
}

declare global {
  interface Window {
    LIMURU_DAIRY_CONFIG?: LimuruDairyRuntimeConfig;
    mountLimuruDairy?: (
      target?: Element | string | null,
      config?: LimuruDairyRuntimeConfig
    ) => void;
  }
}

const VALID_PAGES = new Set<PageRoute>([
  'home',
  'about',
  'farmer-services',
  'certifications',
  'shop',
  'gallery',
  'media',
]);

export function parseWpInitialPage(raw: unknown): PageRoute | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase() as PageRoute;
  return VALID_PAGES.has(cleaned) ? cleaned : null;
}

export function getMountElement(doc?: Document): HTMLElement | null {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined);
  if (!targetDoc) return null;
  return (
    targetDoc.getElementById('limuru-dairy-root') ??
    targetDoc.getElementById('root')
  );
}

export function getRuntimeConfig(
  doc?: Document,
  win?: Partial<Window>
): LimuruDairyRuntimeConfig {
  const globalWin =
    win ?? (typeof window !== 'undefined' ? window : undefined);
  const globalConfig = globalWin?.LIMURU_DAIRY_CONFIG ?? {};
  const mountEl = getMountElement(doc);

  const attrAssetBase = mountEl?.getAttribute('data-asset-base')?.trim() || undefined;
  const attrApiBase = mountEl?.getAttribute('data-api-base')?.trim() || undefined;
  const attrInitialPage =
    parseWpInitialPage(mountEl?.getAttribute('data-initial-page')) ?? undefined;
  const attrNonce = mountEl?.getAttribute('data-wp-nonce')?.trim() || undefined;

  return {
    assetBaseUrl: globalConfig.assetBaseUrl ?? attrAssetBase,
    apiBaseUrl: globalConfig.apiBaseUrl ?? attrApiBase,
    initialPage: parseWpInitialPage(globalConfig.initialPage) ?? attrInitialPage,
    wpNonce: globalConfig.wpNonce ?? attrNonce,
  };
}

function getBuildBaseUrl(): string {
  try {
    const meta = import.meta as unknown as { env?: { BASE_URL?: string } };
    return meta?.env?.BASE_URL ?? '/';
  } catch {
    return '/';
  }
}

export function resolveAssetUrl(
  assetPath: string,
  explicitBaseUrl?: string
): string {
  if (!assetPath) return assetPath;
  if (/^(https?:|data:|blob:)/i.test(assetPath)) {
    return assetPath;
  }

  const normalized = assetPath.replace(/^(\.\/|\/)+/, '');
  const runtimeBase =
    explicitBaseUrl !== undefined
      ? explicitBaseUrl
      : getRuntimeConfig().assetBaseUrl;

  if (runtimeBase) {
    const cleanBase = runtimeBase.replace(/\/+$/, '');
    return `${cleanBase}/${normalized}`;
  }

  const viteBase = getBuildBaseUrl();
  if (viteBase === './' || viteBase === '.') {
    return `./${normalized}`;
  }
  if (viteBase && viteBase !== '/') {
    return `${viteBase.replace(/\/+$/, '')}/${normalized}`;
  }
  return `/${normalized}`;
}

export function resolveApiUrl(
  endpoint: string,
  explicitApiBaseUrl?: string
): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const runtimeApiBase =
    explicitApiBaseUrl !== undefined
      ? explicitApiBaseUrl
      : getRuntimeConfig().apiBaseUrl;

  if (runtimeApiBase) {
    const strippedApiPrefix = cleanEndpoint.replace(/^\/api(?=\/|$)/, '');
    const suffix = strippedApiPrefix.startsWith('/')
      ? strippedApiPrefix
      : `/${strippedApiPrefix}`;
    return `${runtimeApiBase.replace(/\/+$/, '')}${suffix}`;
  }

  return cleanEndpoint.startsWith('/api/')
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;
}

export function buildApiHeaders(
  extraHeaders: Record<string, string> = {},
  explicitNonce?: string
): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const nonce =
    explicitNonce !== undefined ? explicitNonce : getRuntimeConfig().wpNonce;
  if (nonce) {
    headers['X-WP-Nonce'] = nonce;
  }
  return headers;
}
