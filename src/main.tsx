import { createRoot, type Root } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { getMountElement, type LimuruDairyRuntimeConfig } from './utils/wpConfig.ts';

const mountedRoots = new WeakMap<Element, Root>();

export function mountLimuruDairy(
  target?: Element | string | null,
  config?: LimuruDairyRuntimeConfig
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (config) {
    window.LIMURU_DAIRY_CONFIG = {
      ...(window.LIMURU_DAIRY_CONFIG ?? {}),
      ...config,
    };
  }

  const resolvedEl =
    typeof target === 'string'
      ? document.querySelector(target)
      : target ?? getMountElement(document);

  if (!resolvedEl) return;

  let root = mountedRoots.get(resolvedEl);
  if (!root) {
    root = createRoot(resolvedEl);
    mountedRoots.set(resolvedEl, root);
  }
  root.render(<App />);
}

if (typeof window !== 'undefined') {
  window.mountLimuruDairy = mountLimuruDairy;
  mountLimuruDairy();
}
