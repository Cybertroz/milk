import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { AboutPage } from './components/AboutPage';
import { CartDrawer } from './components/CartDrawer';
import { CertificationsPage } from './components/CertificationsPage';
import { FarmerServicesPage } from './components/FarmerServicesPage';
import { Footer } from './components/Footer';
import { GalleryPage } from './components/GalleryPage';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MediaPage } from './components/MediaPage';
import { QuickViewModal, ShopPage } from './components/ShopPage';
import { UserProfileModal } from './components/UserProfileModal';
import type { AuthUser, CartItem, FlavourKey, PageRoute, Product } from './types/dairy';
import {
  FREE_DELIVERY_THRESHOLD_KES,
  PRODUCTS,
  buildWhatsAppOrderUrl,
  calculateCartSummary,
  getCartQuantityMap,
} from './utils/catalog';
import { getStoredOrderHistory } from './utils/orderStorage';
import { MAX_ITEM_QUANTITY, sanitizeCartItemsClient } from './utils/security';
import { buildHashUrl, parseHashRoute } from './utils/routing';
import { buildApiHeaders, getRuntimeConfig, resolveApiUrl, resolveAssetUrl } from './utils/wpConfig';

const ALLOWED_PRODUCT_IDS = new Set(PRODUCTS.map((p) => p.id));

const CART_STORAGE_KEY = 'limuru_dairy_cart_v1';

interface FlyingToken {
  id: number;
  image: string;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
}

export default function App() {
  const initialRoute = (() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const parsed = parseHashRoute(window.location.hash);
      if (parsed.page) return { page: parsed.page, sectionId: parsed.sectionId, scrollFooter: false };
      if (parsed.scrollFooter) return { page: 'home' as PageRoute, scrollFooter: true };
    }
    const wpPage = getRuntimeConfig().initialPage;
    return wpPage
      ? { page: wpPage, scrollFooter: false }
      : { page: 'home' as PageRoute, scrollFooter: false };
  })();
  const [activePage, setActivePage] = useState<PageRoute>(initialRoute.page);
  const [pendingSection, setPendingSection] = useState<string | undefined>(
    initialRoute.sectionId
  );
  const [shopFlavour, setShopFlavour] = useState<FlavourKey>('all');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return sanitizeCartItemsClient(parsed, ALLOWED_PRODUCT_IDS);
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orderHistoryCount, setOrderHistoryCount] = useState<number>(() => {
    try {
      return getStoredOrderHistory().length;
    } catch {
      return 0;
    }
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [flyingTokens, setFlyingTokens] = useState<FlyingToken[]>([]);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});
  const [revealReady, setRevealReady] = useState(false);
  const [cartToast, setCartToast] = useState<{
    id: number;
    name: string;
    size: string;
    priceKes: number;
    quantity: number;
  } | null>(null);

  const appRootRef = useRef<HTMLDivElement | null>(null);
  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const flySeqRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);
  const addedTimersRef = useRef<Record<string, number>>({});

  // Hydrate server-verified HttpOnly email session cleanly on mount (tokens never touch localStorage)
  useEffect(() => {
    let cancelled = false;
    fetch(resolveApiUrl('/api/auth/me'), {
      credentials: 'same-origin',
      headers: buildApiHeaders({}),
    })
      .then(async (res) => {
        const contentType = res.headers.get('content-type') ?? '';
        if (!res.ok || !contentType.includes('application/json')) return;
        const data = (await res.json()) as {
          authenticated?: boolean;
          user?: AuthUser | null;
        };
        if (!cancelled && data.authenticated && data.user) {
          setAuthUser(data.user);
        }
      })
      .catch(() => {
        // Static preview without backend route: fail open smoothly
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignedIn = useCallback((user: AuthUser, token?: string) => {
    setAuthUser(user);
    setSessionToken(token ?? null);
  }, []);

  const handleSignOut = useCallback(() => {
    setAuthUser(null);
    setSessionToken(null);
    fetch(resolveApiUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
    }).catch(() => {
      // Ignore network/static preview errors
    });
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  // Listen to browser hash/history changes so Back/Forward and direct hashes switch blocks smoothly
  useEffect(() => {
    const applyHashRoute = () => {
      const next = parseHashRoute(window.location.hash);
      setCartOpen(false);
      setProfileOpen(false);
      setQuickViewProduct(null);

      if (next.scrollFooter) {
        const footer = document.getElementById('footer-contact');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      if (next.page) {
        setActivePage(next.page);
        setPendingSection(next.sectionId);
        if (!next.sectionId) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', applyHashRoute);
    window.addEventListener('popstate', applyHashRoute);
    return () => {
      window.removeEventListener('hashchange', applyHashRoute);
      window.removeEventListener('popstate', applyHashRoute);
    };
  }, []);

  // Scroll to footer if initial URL targeted #footer-contact
  useEffect(() => {
    if (!initialRoute.scrollFooter) return;
    const timer = window.setTimeout(() => {
      document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up Added feedback timers on unmount
  useEffect(() => {
    return () => {
      Object.values(addedTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  // Scroll-triggered heading underline draw & block fade-up reveals scoped to the active block
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setRevealReady(true);

    const activeBlock =
      document.getElementById(`page-${activePage}`) ?? appRootRef.current ?? document;
    const getTargets = () =>
      Array.from(
        activeBlock.querySelectorAll<HTMLElement>('.heading-underline, [data-reveal="up"]')
      );

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      getTargets().forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const revealIfInOrAboveViewport = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 80) {
        el.classList.add('is-visible');
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '80px 0px 40px 0px' }
    );

    const observeTargets = () => {
      getTargets().forEach((el) => {
        if (!el.classList.contains('is-visible') && !revealIfInOrAboveViewport(el)) {
          observer.observe(el);
        }
      });
    };

    getTargets().forEach((el) => el.classList.remove('is-visible'));
    observeTargets();

    const mutationObserver =
      typeof MutationObserver !== 'undefined' && activeBlock instanceof HTMLElement
        ? new MutationObserver(() => observeTargets())
        : null;
    mutationObserver?.observe(activeBlock, { childList: true, subtree: true });

    // Safety fallback so elements on short mobile screens never remain hidden at opacity: 0
    const fallbackTimer = window.setTimeout(() => {
      getTargets().forEach((el) => el.classList.add('is-visible'));
    }, 450);

    return () => {
      observer.disconnect();
      mutationObserver?.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [activePage]);

  // Scroll to target section once the matching block is shown
  useEffect(() => {
    if (activePage === 'about' && pendingSection) {
      const timer = window.setTimeout(() => {
        const target = document.getElementById(pendingSection);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setPendingSection(undefined);
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [activePage, pendingSection]);

  const navigateTo = useCallback((page: PageRoute, sectionId?: string) => {
    setCartOpen(false);
    setQuickViewProduct(null);
    const targetHash = buildHashUrl(page, sectionId);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setActivePage(page);
      setPendingSection(sectionId);
      if (!sectionId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  const handleNavigateShop = useCallback(
    (flavour: FlavourKey = 'all') => {
      setShopFlavour(flavour);
      navigateTo('shop');
    },
    [navigateTo]
  );

  const handleScrollToFooter = useCallback(() => {
    if (window.location.hash !== '#footer-contact') {
      window.location.hash = '#footer-contact';
    }
    const footer = document.getElementById('footer-contact');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const triggerFlyToCart = useCallback(
    (image: string, sourceEl?: HTMLElement | null) => {
      if (typeof window === 'undefined') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!sourceEl || !cartBtnRef.current) return;

      // Prefer launching directly from the product photo inside the clicked card when available
      const cardPhoto = sourceEl
        .closest('article')
        ?.querySelector<HTMLElement>('img');
      const originEl = cardPhoto ?? sourceEl;

      const srcRect = originEl.getBoundingClientRect();
      const destRect = cartBtnRef.current.getBoundingClientRect();
      const startX = srcRect.left + srcRect.width / 2 - 24;
      const startY = srcRect.top + srcRect.height / 2 - 24;
      const deltaX = destRect.left + destRect.width / 2 - (startX + 24);
      const deltaY = destRect.top + destRect.height / 2 - (startY + 24);

      const id = ++flySeqRef.current;
      setFlyingTokens((prev) => [
        ...prev,
        { id, image: resolveAssetUrl(image), startX, startY, deltaX, deltaY },
      ]);

      window.setTimeout(() => {
        setFlyingTokens((prev) => prev.filter((item) => item.id !== id));
      }, 680);
    },
    []
  );

  const handleAddToCart = useCallback(
    (product: Product, sourceEl?: HTMLElement | null, quantity = 1) => {
      const safeQty = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(quantity)));
      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id);
        if (existing) {
          return prev.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + safeQty),
                }
              : item
          );
        }
        return [...prev, { productId: product.id, quantity: safeQty }];
      });
      triggerFlyToCart(product.image, sourceEl);

      // Briefly flip clicked Add-to-cart buttons for this product to "Added ✓"
      if (addedTimersRef.current[product.id]) {
        window.clearTimeout(addedTimersRef.current[product.id]);
      }
      setRecentlyAddedIds((prev) => ({ ...prev, [product.id]: true }));
      addedTimersRef.current[product.id] = window.setTimeout(() => {
        setRecentlyAddedIds((prev) => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      }, 1600);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setCartToast({
        id: Date.now(),
        name: product.name,
        size: product.size,
        priceKes: product.priceKes * safeQty,
        quantity: safeQty,
      });
      toastTimerRef.current = window.setTimeout(() => {
        setCartToast(null);
      }, 3200);
    },
    [triggerFlyToCart]
  );

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + delta),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const handleSetQty = useCallback((productId: string, quantity: number) => {
    const cleanQty = Math.min(MAX_ITEM_QUANTITY, Math.max(0, Math.floor(quantity || 0)));
    setCart((prev) => {
      const exists = prev.some((item) => item.productId === productId);
      if (cleanQty <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      if (!exists) {
        return [...prev, { productId, quantity: cleanQty }];
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity: cleanQty } : item
      );
    });
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartQuantities = getCartQuantityMap(cart);

  const handleOrderNow = useCallback(
    (product: Product, sourceEl?: HTMLElement | null, quantity = 1) => {
      if (!cartQuantities[product.id]) {
        handleAddToCart(product, sourceEl, quantity);
      }
      setCartToast(null);
      setCartOpen(true);
    },
    [cartQuantities, handleAddToCart]
  );

  const cartSummary = calculateCartSummary(cart);
  const { itemCount } = cartSummary;

  return (
    <div
      ref={appRootRef}
      className={`limuru-dairy-app min-h-screen flex flex-col bg-white text-[#0d2433] ${
        revealReady ? 'reveal-ready' : ''
      }`}
    >
      <Header
        activePage={activePage}
        cartCount={itemCount}
        orderCount={orderHistoryCount}
        authUser={authUser}
        cartBtnRef={cartBtnRef}
        onNavigate={navigateTo}
        onScrollToFooter={handleScrollToFooter}
        onOpenCart={() => setCartOpen(true)}
        onOpenProfile={() => {
          setOrderHistoryCount(getStoredOrderHistory().length);
          setProfileOpen(true);
        }}
      />

      <main className="flex-1">
        <div
          id="page-home"
          data-page-block="home"
          hidden={activePage !== 'home'}
          className={activePage === 'home' ? 'page-block animate-page-in' : 'page-block'}
        >
          <HomePage
            isActivePage={activePage === 'home'}
            onNavigate={navigateTo}
            onNavigateShop={handleNavigateShop}
            onAddToCart={handleAddToCart}
            onQuickView={(product) => setQuickViewProduct(product)}
            recentlyAddedIds={recentlyAddedIds}
          />
        </div>

        <div
          id="page-about"
          data-page-block="about"
          hidden={activePage !== 'about'}
          className={activePage === 'about' ? 'page-block animate-page-in' : 'page-block'}
        >
          <AboutPage onNavigate={navigateTo} />
        </div>

        <div
          id="page-farmer-services"
          data-page-block="farmer-services"
          hidden={activePage !== 'farmer-services'}
          className={
            activePage === 'farmer-services' ? 'page-block animate-page-in' : 'page-block'
          }
        >
          <FarmerServicesPage onNavigate={navigateTo} />
        </div>

        <div
          id="page-certifications"
          data-page-block="certifications"
          hidden={activePage !== 'certifications'}
          className={
            activePage === 'certifications' ? 'page-block animate-page-in' : 'page-block'
          }
        >
          <CertificationsPage onNavigate={navigateTo} />
        </div>

        <div
          id="page-shop"
          data-page-block="shop"
          hidden={activePage !== 'shop'}
          className={activePage === 'shop' ? 'page-block animate-page-in' : 'page-block'}
        >
          <ShopPage
            initialFlavour={shopFlavour}
            cartQuantities={cartQuantities}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            onSetQty={handleSetQty}
            onOpenCart={() => setCartOpen(true)}
            recentlyAddedIds={recentlyAddedIds}
            quickViewProduct={activePage === 'shop' ? quickViewProduct : null}
            onOpenQuickView={(product) => setQuickViewProduct(product)}
            onCloseQuickView={() => setQuickViewProduct(null)}
          />
        </div>

        <div
          id="page-gallery"
          data-page-block="gallery"
          hidden={activePage !== 'gallery'}
          className={activePage === 'gallery' ? 'page-block animate-page-in' : 'page-block'}
        >
          <GalleryPage />
        </div>

        <div
          id="page-media"
          data-page-block="media"
          hidden={activePage !== 'media'}
          className={activePage === 'media' ? 'page-block animate-page-in' : 'page-block'}
        >
          <MediaPage />
        </div>
      </main>

      <div className={itemCount > 0 && !cartOpen ? 'pb-20 sm:pb-16' : ''}>
        <Footer onNavigate={(page) => navigateTo(page)} />
      </div>

      {/* Global Quick View Modal when opened from Home Page */}
      {activePage !== 'shop' && quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onSelectProduct={(product) => setQuickViewProduct(product)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        cart={cart}
        authUser={authUser}
        sessionToken={sessionToken}
        onSignedIn={handleSignedIn}
        onSignOut={handleSignOut}
        onClose={() => {
          setCartOpen(false);
          setOrderHistoryCount(getStoredOrderHistory().length);
        }}
        onUpdateQty={handleUpdateQty}
        onSetQty={handleSetQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => {
          handleClearCart();
          setOrderHistoryCount(getStoredOrderHistory().length);
        }}
        onGoShop={() => handleNavigateShop('all')}
        onOpenProfile={() => {
          setCartOpen(false);
          setOrderHistoryCount(getStoredOrderHistory().length);
          setProfileOpen(true);
        }}
      />

      {/* User Profile & Cached My Orders Modal */}
      <UserProfileModal
        isOpen={profileOpen}
        authUser={authUser}
        onSignedIn={handleSignedIn}
        onSignOut={handleSignOut}
        onClose={() => {
          setProfileOpen(false);
          setOrderHistoryCount(getStoredOrderHistory().length);
        }}
        onOrdersCleared={() => setOrderHistoryCount(0)}
        onReorder={(items) => {
          for (const item of items) {
            const product = PRODUCTS.find((p) => p.id === item.productId);
            if (product) {
              handleAddToCart(product, null, item.quantity);
            }
          }
        }}
        onGoShop={() => handleNavigateShop('all')}
      />

      {/* Persistent Bottom Checkout Bar whenever basket has items */}
      {itemCount > 0 && !cartOpen && (
        <div
          data-testid="floating-checkout-bar"
          className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[55] w-[calc(100vw-1.5rem)] max-w-lg bg-[#0d2433] text-white border border-[#27a8ec]/50 shadow-[0_18px_48px_-12px_rgba(13,36,51,0.55)] px-4 py-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#27a8ec] text-[#0d2433] inline-flex items-center justify-center shrink-0 font-extrabold text-sm tabular-nums">
              {itemCount}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white tabular-nums truncate">
                Basket: KES {cartSummary.subtotalKes}
              </div>
              <div className="text-[11px] text-[#8fd5f7] truncate">
                {cartSummary.qualifiesFreeDelivery
                  ? `Free delivery unlocked (≥ KES ${FREE_DELIVERY_THRESHOLD_KES})`
                  : `Add KES ${cartSummary.remainingForFreeDeliveryKes} for free delivery`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={buildWhatsAppOrderUrl(cart)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Send basket directly on WhatsApp"
              className="w-9 h-9 inline-flex items-center justify-center bg-[#16a34a] hover:bg-[#15803d] text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              data-testid="floating-checkout-btn"
              className="btn-shine inline-flex items-center gap-1.5 bg-[#27a8ec] hover:bg-white text-[#0d2433] text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 cursor-pointer transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      )}

      {/* Top-right Add-to-Cart confirmation toast */}
      {cartToast && !cartOpen && (
        <div
          key={cartToast.id}
          role="status"
          aria-live="polite"
          data-testid="cart-toast"
          className="animate-toast-in fixed top-24 right-[max(1rem,env(safe-area-inset-right))] sm:right-[max(2rem,env(safe-area-inset-right))] z-[65] max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-white border border-[#27a8ec] shadow-[0_18px_44px_-16px_rgba(13,36,51,0.28)] p-3.5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-[#0a74b5] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0d2433] truncate">
                Added {cartToast.quantity > 1 ? `${cartToast.quantity}× ` : ''}
                {cartToast.name}
              </div>
              <div className="text-[11px] font-semibold text-[#0a74b5] tabular-nums mt-0.5">
                {cartToast.size} · KES {cartToast.priceKes}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCartToast(null);
                setCartOpen(true);
              }}
              className="px-2.5 py-1.5 bg-[#0d2433] hover:bg-[#0a74b5] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              View cart
            </button>
            <button
              type="button"
              onClick={() => setCartToast(null)}
              aria-label="Dismiss notification"
              className="p-1 text-[#0d2433]/55 hover:text-[#0d2433] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Fly-to-cart visual particles */}
      {flyingTokens.map((token) => (
        <img
          key={token.id}
          src={token.image}
          alt=""
          aria-hidden="true"
          className="animate-fly-cart pointer-events-none fixed z-[70] w-12 h-12 object-contain p-1 border border-[#27a8ec] bg-[#eef8fe] shadow-md"
          style={
            {
              left: `${token.startX}px`,
              top: `${token.startY}px`,
              '--fly-x': `${token.deltaX}px`,
              '--fly-y': `${token.deltaY}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
