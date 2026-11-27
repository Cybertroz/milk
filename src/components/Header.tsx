import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { ABOUT_NAV_ITEMS } from '../content/dairyContent';
import type { AuthUser, FlavourKey, PageRoute, Product } from '../types/dairy';
import {
  PRODUCTS,
  getFlavourAccentColor,
  getFlavourCardGroups,
} from '../utils/catalog';
import { buildHashUrl } from '../utils/routing';
import { LimuruDairyLogo, ResilientImage } from './BrandMark';

interface HeaderProps {
  activePage: PageRoute;
  cartCount: number;
  cartSubtotalKes?: number;
  orderCount?: number;
  authUser?: AuthUser | null;
  cartBtnRef: React.RefObject<HTMLButtonElement | null>;
  onNavigate: (page: PageRoute, sectionId?: string) => void;
  onSelectFlavour?: (flavour: FlavourKey) => void;
  onQuickViewProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, sourceEl?: HTMLElement | null) => void;
  onScrollToFooter: () => void;
  onOpenCart: () => void;
  onOpenProfile?: () => void;
}

const QUICK_PAGES: Array<{ label: string; subtitle: string; page: PageRoute }> = [
  { label: 'Shop Dairy Packs', subtitle: 'Relish Yoghurts, UHT & Wholesale', page: 'shop' },
  { label: 'Farmer Services', subtitle: 'LIMDA Feeds, AI & Vet Extension', page: 'farmer-services' },
  { label: 'Certifications', subtitle: 'KEBS & Kenya Dairy Board Standards', page: 'certifications' },
  { label: 'Photo Gallery', subtitle: 'CSR, Processing Plant & Farms', page: 'gallery' },
  { label: 'Media Centre', subtitle: 'Cooperative News & Awards', page: 'media' },
];

export function Header({
  activePage,
  cartCount,
  cartSubtotalKes = 0,
  orderCount = 0,
  authUser = null,
  cartBtnRef,
  onNavigate,
  onSelectFlavour,
  onQuickViewProduct,
  onAddToCart,
  onScrollToFooter,
  onOpenCart,
  onOpenProfile,
}: HeaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hoverOpenedAtRef = useRef<number>(0);
  const shopHoverOpenedAtRef = useRef<number>(0);
  const prevCartCountRef = useRef(cartCount);

  const flavourGroups = useMemo(() => getFlavourCardGroups(PRODUCTS, 'all'), []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return PRODUCTS.filter((p) => p.size === '500ml').slice(0, 5);
    }
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.flavourLabel.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  const matchingPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return QUICK_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartPulseKey((k) => k + 1);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Global "/" or Cmd/Ctrl+K shortcut to toggle interactive header search
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAboutMenuOpen(false);
        setShopMenuOpen(false);
        setSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !inInput) {
        e.preventDefault();
        setAboutMenuOpen(false);
        setShopMenuOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!aboutMenuOpen && !shopMenuOpen && !mobileMenuOpen && !searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAboutMenuOpen(false);
        setShopMenuOpen(false);
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const onClickOutside = (e: PointerEvent | MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setAboutMenuOpen(false);
        setShopMenuOpen(false);
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onClickOutside);
    };
  }, [aboutMenuOpen, shopMenuOpen, mobileMenuOpen, searchOpen]);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 12);
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)));
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, [activePage]);

  useEffect(() => {
    setAboutMenuOpen(false);
    setShopMenuOpen(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }, [activePage]);

  const handleNavClick = (page: PageRoute, sectionId?: string) => {
    setAboutMenuOpen(false);
    setShopMenuOpen(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    onNavigate(page, sectionId);
  };

  const navPillClass = (isActive: boolean) =>
    `whitespace-nowrap shrink-0 rounded-lg px-1.5 xl:px-3 py-1.5 text-[11.5px] xl:text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${
      isActive
        ? 'bg-[#0d2433] text-white shadow-xs'
        : 'text-[#0d2433] hover:bg-white/85 hover:text-[#0a74b5]'
    }`;

  return (
    <header
      ref={headerRef}
      className={`safe-header sticky top-0 z-40 text-[#0d2433] border-b border-[#0a74b5]/18 transition-all duration-200 animate-header-in ${
        isScrolled
          ? 'bg-[#8fd5f7]/92 backdrop-blur-md shadow-[0_12px_32px_-14px_rgba(13,36,51,0.26)]'
          : 'bg-gradient-to-r from-[#8fd5f7] via-[#a3defa] to-[#8fd5f7] shadow-[0_8px_28px_-14px_rgba(13,36,51,0.16)]'
      }`}
    >
      {/* Interactive scroll progress indicator */}
      <div
        data-testid="scroll-progress-bar"
        className="h-[3px] bg-gradient-to-r from-[#27a8ec] via-[#0a74b5] to-[#0d2433] transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <div className="site-container">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-1.5 xl:gap-x-3 gap-y-1 py-2 lg:h-[78px] lg:py-0">
          {/* Left: Clean Cooperative Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
            className="order-1 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a74b5] transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
            aria-label="Limuru Dairy Home"
          >
            <LimuruDairyLogo compact />
          </a>

          {/* Center: Interactive Frosted Pill Navigation Track */}
          <nav
            id="primary-navigation-drawer"
            aria-label="Primary navigation"
            data-testid="primary-nav"
            className={`${
              mobileMenuOpen
                ? 'grid grid-cols-2 gap-1.5 w-full pt-2.5 pb-2 border-t border-[#0a74b5]/15'
                : 'hidden md:flex md:items-center md:justify-between md:w-full lg:w-auto lg:justify-center lg:gap-0.5 xl:gap-1 lg:bg-white/45 lg:backdrop-blur-sm lg:border lg:border-white/75 lg:rounded-xl lg:p-1'
            } order-3 lg:order-2 max-h-[70dvh] md:max-h-none overflow-y-auto md:overflow-visible`}
          >
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home');
              }}
              className={navPillClass(activePage === 'home')}
            >
              Home
            </a>

            {/* Interactive About us trigger + section dropdown */}
            <div
              className={`relative inline-flex items-center justify-between md:justify-start shrink-0 rounded-lg transition-all duration-200 ${
                activePage === 'about'
                  ? 'bg-[#0d2433] text-white shadow-xs'
                  : 'text-[#0d2433] hover:bg-white/85 hover:text-[#0a74b5]'
              }`}
              onMouseEnter={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  if (!aboutMenuOpen) {
                    hoverOpenedAtRef.current = Date.now();
                  }
                  setShopMenuOpen(false);
                  setSearchOpen(false);
                  setAboutMenuOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setAboutMenuOpen(false);
                }
              }}
            >
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('about');
                }}
                className="whitespace-nowrap shrink-0 pl-1.5 xl:pl-3 pr-0.5 py-1.5 text-[11.5px] xl:text-[13px] font-semibold"
              >
                About us
              </a>
              <button
                type="button"
                aria-expanded={aboutMenuOpen}
                aria-haspopup="true"
                aria-label="Toggle About us sections"
                onClick={() => {
                  setShopMenuOpen(false);
                  setSearchOpen(false);
                  setAboutMenuOpen((prev) => {
                    if (prev && Date.now() - hoverOpenedAtRef.current < 450) {
                      return true;
                    }
                    return !prev;
                  });
                }}
                className="pr-1.5 xl:pr-2 pl-0.5 py-1.5 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    aboutMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {aboutMenuOpen && (
                <div
                  className="hidden lg:block animate-dropdown-in absolute left-0 top-full pt-3 w-64 z-50"
                  role="menu"
                  aria-label="About us sections"
                >
                  <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-[0_24px_54px_-14px_rgba(13,36,51,0.24)] border border-[#c3e8fb] p-2 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                      Inside Limuru Dairy
                    </div>
                    {ABOUT_NAV_ITEMS.map((item) => (
                      <a
                        key={item.id}
                        href={buildHashUrl(item.route as PageRoute, item.sectionId)}
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(item.route as PageRoute, item.sectionId);
                        }}
                        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold text-[#0d2433] hover:bg-[#eef8fe] hover:text-[#0a74b5] transition-colors"
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-45" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href="#farmer-services"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('farmer-services');
              }}
              className={navPillClass(activePage === 'farmer-services')}
            >
              Farmer Services
            </a>

            <a
              href="#certifications"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('certifications');
              }}
              className={navPillClass(activePage === 'certifications')}
            >
              Certifications
            </a>

            {/* Interactive Shop Quick-Browse Mega-Dropdown */}
            <div
              className={`relative inline-flex items-center justify-between md:justify-start shrink-0 rounded-lg transition-all duration-200 ${
                activePage === 'shop'
                  ? 'bg-[#0d2433] text-white shadow-xs'
                  : 'text-[#0d2433] hover:bg-white/85 hover:text-[#0a74b5]'
              }`}
              onMouseEnter={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  if (!shopMenuOpen) {
                    shopHoverOpenedAtRef.current = Date.now();
                  }
                  setAboutMenuOpen(false);
                  setSearchOpen(false);
                  setShopMenuOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setShopMenuOpen(false);
                }
              }}
            >
              <a
                href="#shop"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('shop');
                }}
                className="whitespace-nowrap shrink-0 pl-1.5 xl:pl-3 pr-0.5 py-1.5 text-[11.5px] xl:text-[13px] font-semibold"
              >
                Shop
              </a>
              <button
                type="button"
                aria-expanded={shopMenuOpen}
                aria-haspopup="true"
                aria-label="Toggle Shop quick menu"
                onClick={() => {
                  setAboutMenuOpen(false);
                  setSearchOpen(false);
                  setShopMenuOpen((prev) => {
                    if (prev && Date.now() - shopHoverOpenedAtRef.current < 450) {
                      return true;
                    }
                    return !prev;
                  });
                }}
                className="pr-1.5 xl:pr-2 pl-0.5 py-1.5 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    shopMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {shopMenuOpen && (
                <div
                  data-testid="shop-mega-menu"
                  className="hidden lg:block animate-dropdown-in absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[372px] z-50"
                  role="menu"
                  aria-label="Quick shop by flavour"
                >
                  <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-[0_26px_60px_-14px_rgba(13,36,51,0.26)] border border-[#c3e8fb] p-3 overflow-hidden space-y-2">
                    <div className="flex items-center justify-between gap-2 px-2 pt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] whitespace-nowrap">
                        Signature 500ml &amp; Family Packs
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNavClick('shop')}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#0d2433] hover:text-[#0a74b5] cursor-pointer whitespace-nowrap"
                      >
                        Full Catalogue →
                      </button>
                    </div>

                    <div className="space-y-1">
                      {flavourGroups.map((group) => {
                        const prod = group.defaultProduct;
                        const accent = getFlavourAccentColor(group.flavour);
                        return (
                          <div
                            key={group.flavour}
                            className="flex items-center justify-between gap-2 rounded-xl p-2 hover:bg-[#eef8fe] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setShopMenuOpen(false);
                                if (onSelectFlavour) {
                                  onSelectFlavour(group.flavour);
                                } else {
                                  handleNavClick('shop');
                                }
                              }}
                              className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: accent }}
                                aria-hidden="true"
                              />
                              <div className="w-9 h-9 rounded-lg bg-[#eef8fe] border border-[#c3e8fb] p-0.5 shrink-0 flex items-center justify-center">
                                <ResilientImage
                                  src={prod.image}
                                  alt={prod.name}
                                  loading="lazy"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#0d2433] truncate">
                                  {prod.flavourLabel}
                                </div>
                                <div className="text-[11px] font-semibold text-[#0a74b5] tabular-nums">
                                  KES {prod.priceKes} · {group.variants.length} pack{group.variants.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            </button>

                            {onAddToCart && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  onAddToCart(prod, e.currentTarget);
                                }}
                                aria-label={`Quick add ${prod.name}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#0d2433] hover:bg-[#0a74b5] text-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                              >
                                <Plus className="w-3 h-3" aria-hidden="true" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a
              href="#gallery"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('gallery');
              }}
              className={navPillClass(activePage === 'gallery')}
            >
              Gallery
            </a>

            <a
              href="#media"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('media');
              }}
              className={navPillClass(activePage === 'media')}
            >
              Media Centre
            </a>

            <a
              href="#footer-contact"
              onClick={(e) => {
                e.preventDefault();
                setAboutMenuOpen(false);
                setShopMenuOpen(false);
                setSearchOpen(false);
                setMobileMenuOpen(false);
                onScrollToFooter();
              }}
              className={navPillClass(false)}
            >
              Contact us
            </a>
          </nav>

          {/* Right: Interactive Search Toggle, Profile, Cart & Mobile Toggle */}
          <div className="order-2 lg:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              data-testid="header-search-toggle"
              onClick={() => {
                setAboutMenuOpen(false);
                setShopMenuOpen(false);
                setMobileMenuOpen(false);
                setSearchOpen((prev) => !prev);
              }}
              aria-expanded={searchOpen}
              aria-label="Search dairy products and pages"
              title="Quick Search (Press /)"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold border transition-all cursor-pointer min-h-[40px] ${
                searchOpen
                  ? 'bg-[#0d2433] text-white border-[#0d2433]'
                  : 'bg-white/85 hover:bg-white text-[#0d2433] border-[#0a74b5]/30 hover:border-[#0a74b5]'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline text-[11px] uppercase tracking-wider">
                Search
              </span>
            </button>

            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                data-testid="header-profile-btn"
                aria-label={
                  authUser
                    ? `Signed in as ${authUser.email}. Open User Profile and My Orders`
                    : 'Sign in or view My Orders'
                }
                title={authUser ? `Signed in: ${authUser.email}` : 'Sign in via Email & My Orders'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/85 hover:bg-white text-[#0d2433] px-2.5 sm:px-3 py-2 text-xs font-bold uppercase tracking-[0.06em] border border-[#0a74b5]/30 hover:border-[#0a74b5] transition-all cursor-pointer min-h-[40px]"
              >
                <span className="relative inline-flex items-center">
                  <User className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
                  {authUser && (
                    <span
                      data-testid="header-auth-dot"
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#16a34a] border border-white"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="hidden min-[520px]:inline lg:hidden xl:inline max-w-[96px] truncate">
                  {authUser ? authUser.displayName.split(' ')[0] : 'My Orders'}
                </span>
                {orderCount > 0 && (
                  <span
                    data-testid="header-order-count"
                    className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded bg-[#0d2433] text-white text-[10px] font-black tabular-nums"
                  >
                    {orderCount}
                  </span>
                )}
              </button>
            )}

            <button
              ref={cartBtnRef}
              type="button"
              onClick={onOpenCart}
              aria-label={`Open shopping cart with ${cartCount} items`}
              className="btn-shine inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#0d2433] hover:bg-[#0a74b5] text-white px-2.5 xl:px-3.5 py-2 text-xs font-bold uppercase tracking-[0.1em] shadow-[0_8px_20px_-8px_rgba(13,36,51,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer min-h-[40px]"
            >
              <ShoppingBag className="w-4 h-4 text-[#8fd5f7]" aria-hidden="true" />
              <span className="hidden sm:inline lg:hidden xl:inline tabular-nums">
                {cartCount > 0 && cartSubtotalKes > 0
                  ? `KES ${cartSubtotalKes}`
                  : 'Cart'}
              </span>
              <span
                key={cartPulseKey}
                data-testid="cart-count"
                className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-[#27a8ec] text-[#0d2433] text-[11px] font-extrabold tabular-nums ${
                  cartPulseKey > 0 ? 'animate-cart-pop' : ''
                }`}
              >
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              data-testid="mobile-menu-toggle"
              aria-expanded={mobileMenuOpen}
              aria-controls="primary-navigation-drawer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => {
                setMobileMenuOpen((prev) => !prev);
                setAboutMenuOpen(false);
                setShopMenuOpen(false);
                setSearchOpen(false);
              }}
              className="md:hidden inline-flex items-center justify-center rounded-lg bg-white/85 hover:bg-white text-[#0d2433] border border-[#0a74b5]/30 w-10 h-10 cursor-pointer transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Interactive Header Search & Quick Jump Overlay */}
      {searchOpen && (
        <div
          data-testid="header-search-panel"
          className="animate-dropdown-in bg-white/98 backdrop-blur-xl border-t border-[#c3e8fb] shadow-[0_24px_60px_-16px_rgba(13,36,51,0.28)]"
        >
          <div className="site-container py-4 space-y-3">
            <div className="relative flex items-center">
              <Search
                className="w-4 h-4 text-[#0a74b5] absolute left-3.5 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Relish yoghurt, 500ml, Long Life Milk, Farmer Services..."
                aria-label="Search Limuru Dairy catalogue and pages"
                className="w-full rounded-xl pl-10 pr-10 py-2.5 text-sm bg-[#eef8fe]/70 border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="absolute right-2.5 p-1 rounded-lg text-[#0d2433]/60 hover:text-[#0d2433] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {matchingPages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {matchingPages.map((pg) => (
                  <button
                    key={pg.page}
                    type="button"
                    onClick={() => handleNavClick(pg.page)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#eef8fe] hover:bg-[#dff1fb] border border-[#c3e8fb] px-3 py-1.5 text-xs font-bold text-[#0d2433] cursor-pointer transition-colors"
                  >
                    <span>{pg.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0a74b5]" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {searchResults.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-[#f7fbff] hover:bg-[#eef8fe] border border-[#c3e8fb] p-2.5 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      if (onQuickViewProduct) {
                        onQuickViewProduct(prod);
                      } else {
                        handleNavClick('shop');
                      }
                    }}
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#c3e8fb] p-1 shrink-0 flex items-center justify-center">
                      <ResilientImage
                        src={prod.image}
                        alt={prod.name}
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0d2433] truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] font-semibold text-[#0a74b5] tabular-nums">
                        {prod.size} · KES {prod.priceKes}
                      </div>
                    </div>
                  </button>

                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={(e) => onAddToCart(prod, e.currentTarget)}
                      className="rounded-lg bg-[#0d2433] hover:bg-[#0a74b5] text-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                    >
                      + Cart
                    </button>
                  )}
                </div>
              ))}
              {searchResults.length === 0 && matchingPages.length === 0 && (
                <div className="col-span-full text-xs text-[#0d2433]/65 py-2">
                  No matching packs found. Try searching &ldquo;Strawberry&rdquo;, &ldquo;Vanilla&rdquo;, &ldquo;500ml&rdquo;, or &ldquo;Long Life&rdquo;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tablet/Phone About Us Section Sub-Row (<1024px) */}
      {aboutMenuOpen && (
        <div
          className="lg:hidden bg-white border-t border-[#c3e8fb] shadow-lg"
          role="menu"
          aria-label="About us sections"
        >
          <div className="site-container py-2.5 flex items-center gap-2 overflow-x-auto">
            {ABOUT_NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={buildHashUrl(item.route as PageRoute, item.sectionId)}
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.route as PageRoute, item.sectionId);
                }}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#eef8fe] text-[#0d2433] hover:text-[#0a74b5] border border-[#c3e8fb]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
