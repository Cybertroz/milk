import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ThermometerSnowflake,
  X,
} from 'lucide-react';
import type {
  BulkQuoteReceipt,
  DeliveryZoneId,
  FlavourKey,
  Product,
  SizeLabel,
  SortOption,
} from '../types/dairy';
import {
  DELIVERY_ZONES,
  FLAVOUR_TABS,
  PRODUCTS,
  SIZE_FILTERS,
  WHOLESALE_PACKS,
  calculateWholesaleQuoteEstimate,
  filterAndSortProducts,
  getCheapestPerLitreIds,
  getFlavourAccentColor,
  getPricePerLitre,
  getProductNutritionStorage,
  getSiblingSizesForProduct,
  getTrayPieceCount,
  getTrayProgressHint,
  validateBulkQuoteRequest,
} from '../utils/catalog';
import { ASSET_IMAGES } from '../data/content';
import { buildApiHeaders, resolveApiUrl } from '../utils/wpConfig';
import { ProductStudioVisual, ResilientImage } from './BrandMark';

interface ShopPageProps {
  initialFlavour?: FlavourKey;
  cartQuantities?: Record<string, number>;
  onAddToCart: (
    product: Product,
    sourceEl?: HTMLElement | null,
    quantity?: number
  ) => void;
  onUpdateQty?: (productId: string, delta: number) => void;
  onSetQty?: (productId: string, quantity: number) => void;
  onOpenCart?: () => void;
  recentlyAddedIds?: Record<string, boolean>;
  quickViewProduct: Product | null;
  onOpenQuickView: (product: Product) => void;
  onCloseQuickView: () => void;
}

export function ShopPage({
  initialFlavour = 'all',
  cartQuantities = {},
  onAddToCart,
  onUpdateQty,
  onSetQty,
  onOpenCart,
  recentlyAddedIds = {},
  quickViewProduct,
  onOpenQuickView,
  onCloseQuickView,
}: ShopPageProps) {
  const [shopMode, setShopMode] = useState<'retail' | 'quick-order' | 'wholesale'>('retail');
  const [flavour, setFlavour] = useState<FlavourKey>(initialFlavour);
  const [size, setSize] = useState<'all' | SizeLabel>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('featured');

  useEffect(() => {
    setFlavour(initialFlavour);
  }, [initialFlavour]);

  const filteredProducts = filterAndSortProducts(PRODUCTS, {
    flavour,
    size,
    search,
    sort,
  });

  const bestValueIds = getCheapestPerLitreIds(filteredProducts);

  return (
    <div className="animate-page-in bg-white">
      {/* Page Header Band */}
      <section className="bg-[#eef8fe] py-10 sm:py-14">
        <div className="site-container flex flex-col min-[861px]:flex-row min-[861px]:items-end justify-between gap-5 sm:gap-6">
          <div>
            <h1 className="heading-underline fluid-page-h1 font-bold tracking-tight text-[#0d2433]">
              Shop Dairy Products
            </h1>
            <p className="text-sm sm:text-base text-[#0d2433]/75 mt-4 max-w-2xl">
              Order directly from Limuru Dairy Farmers’ Co-operative Society. Free
              delivery on orders over KES 1,500 across Limuru, Kiambu &amp; Nairobi.
            </p>
          </div>

          {/* Retail vs Quick Order vs Wholesale Switcher */}
          <div
            role="tablist"
            aria-label="Shop ordering mode"
            className="flex flex-wrap sm:inline-flex w-full sm:w-auto gap-1 border border-[#0a74b5]/25 bg-white p-1 shrink-0 self-start lg:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={shopMode === 'retail'}
              onClick={() => setShopMode('retail')}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px] ${
                shopMode === 'retail'
                  ? 'bg-[#0d2433] text-white'
                  : 'text-[#0d2433] hover:bg-[#eef8fe]'
              }`}
            >
              Retail Packs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={shopMode === 'quick-order'}
              data-testid="tab-quick-order"
              onClick={() => setShopMode('quick-order')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px] ${
                shopMode === 'quick-order'
                  ? 'bg-[#0a74b5] text-white'
                  : 'text-[#0d2433] hover:bg-[#eef8fe]'
              }`}
            >
              <span>⚡ Quick Order Grid</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={shopMode === 'wholesale'}
              data-testid="tab-wholesale"
              onClick={() => setShopMode('wholesale')}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px] ${
                shopMode === 'wholesale'
                  ? 'bg-[#0a74b5] text-white'
                  : 'text-[#0d2433] hover:bg-[#eef8fe]'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Wholesale &amp; Bulk Quote</span>
            </button>
          </div>
        </div>
      </section>

      <div key={shopMode} className="animate-view-fade">
        {shopMode === 'wholesale' ? (
          <WholesaleBulkEstimator
            onAddToCart={onAddToCart}
            recentlyAddedIds={recentlyAddedIds}
            onBackToRetail={() => setShopMode('retail')}
          />
        ) : shopMode === 'quick-order' ? (
          <QuickOrderGrid
            cartQuantities={cartQuantities}
            onAddToCart={onAddToCart}
            onUpdateQty={onUpdateQty}
            onSetQty={onSetQty}
            onOpenCart={onOpenCart}
            onBackToRetail={() => setShopMode('retail')}
          />
        ) : (
          <>
          {/* Filters & Controls */}
          <section className="py-7 border-b border-[#0a74b5]/10 bg-white">
            <div className="site-container space-y-5">
              {/* Flavour Tabs */}
              <div
                role="tablist"
                aria-label="Filter shop by flavour"
                className="flex flex-wrap gap-1.5"
              >
                {FLAVOUR_TABS.map((tab) => {
                  const active = flavour === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFlavour(tab.key)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#0d2433] text-white'
                          : 'bg-[#eef8fe]/70 text-[#0d2433]/80 hover:bg-[#dff1fb] hover:text-[#0d2433]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Size Filters + Search + Sort */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="group"
                  aria-label="Filter by pack size"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0d2433]/55 mr-2">
                    Size
                  </span>
                  {SIZE_FILTERS.map((sz) => {
                    const active = size === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSize(sz)}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                          active
                            ? 'bg-[#27a8ec] text-white'
                            : 'bg-[#eef8fe] text-[#0d2433]/80 hover:bg-[#dff1fb]'
                        }`}
                      >
                        {sz === 'all' ? 'All sizes' : sz}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <Search
                      className="w-4 h-4 text-[#0a74b5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <label htmlFor="shop-search" className="sr-only">
                      Search products
                    </label>
                    <input
                      id="shop-search"
                      type="search"
                      maxLength={80}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search yoghurt or milk..."
                      className="w-full sm:w-64 pl-10 pr-3 py-2.5 text-sm bg-[#eef8fe]/60 border border-[#c3e8fb] text-[#0d2433] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                    />
                  </div>

                  <div>
                    <label htmlFor="shop-sort" className="sr-only">
                      Sort products
                    </label>
                    <select
                      id="shop-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="w-full sm:w-auto px-3.5 py-2.5 text-sm bg-[#eef8fe]/60 border border-[#c3e8fb] text-[#0d2433] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27a8ec] cursor-pointer"
                    >
                      <option value="featured">Sort: Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A to Z</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Grid */}
          <section className="py-10 sm:py-14 lg:py-16">
            <div className="site-container">
              {filteredProducts.length === 0 ? (
                <div className="bg-[#eef8fe] p-8 sm:p-14 text-center">
                  <h2 className="text-lg font-bold text-[#0d2433]">
                    No matching dairy products found
                  </h2>
                  <p className="text-sm text-[#0d2433]/75 mt-2">
                    Try clearing your search or selecting a different flavour or size.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFlavour('all');
                      setSize('all');
                      setSearch('');
                    }}
                    className="mt-6 inline-flex items-center px-6 py-3 bg-[#0d2433] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div
                  key={`${flavour}-${size}-${sort}`}
                  className="animate-view-fade grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 gap-y-6 sm:gap-y-10"
                >
                  {filteredProducts.map((product, idx) => {
                    const isBestValue = bestValueIds.has(product.id);
                    const pricePerLitre = Math.round(getPricePerLitre(product));
                    const isJustAdded = Boolean(recentlyAddedIds[product.id]);
                    return (
                      <article
                        key={product.id}
                        data-testid={`product-card-${product.id}`}
                        className="animate-card-stagger group bg-white border border-[#c3e8fb] hover:border-[#27a8ec] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_28px_-22px_rgba(10,116,181,0.20)] hover:shadow-[0_22px_44px_-22px_rgba(10,116,181,0.28)]"
                        style={{ animationDelay: `${Math.min(idx, 7) * 55}ms` }}
                      >
                        <div
                          className="h-[3px] w-full shrink-0"
                          style={{ backgroundColor: getFlavourAccentColor(product.flavour) }}
                          aria-hidden="true"
                        />
                        {/* Studio pedestal with slide-up Add to cart */}
                        <div className="relative aspect-[4/5] overflow-hidden">
                          {isBestValue && (
                            <span className="absolute top-3 left-3 z-20 bg-[#0d2433] text-white text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 shadow-xs">
                              Best value
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenQuickView(product)}
                            aria-label={`Quick view ${product.name} ${product.size}`}
                            className="w-full h-full block cursor-pointer"
                          >
                            <ProductStudioVisual
                              src={product.image}
                              alt={`${product.name} ${product.size}`}
                              glowColor={product.glowColor}
                              className="w-full h-full"
                              imgClassName="transition-transform duration-500 group-hover:scale-[1.15]"
                            />
                          </button>

                          {/* Slide-up Add to Cart button on desktop hover / focus-within */}
                          <div className="hidden lg:block absolute inset-x-0 bottom-0 z-20 p-3 translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-200 bg-white/95 backdrop-blur-md border-t border-[#c3e8fb]">
                            <button
                              type="button"
                              onClick={(e) => onAddToCart(product, e.currentTarget)}
                              className={`btn-shine w-full inline-flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-3 transition-colors cursor-pointer ${
                                isJustAdded
                                  ? 'bg-[#0d2433]'
                                  : 'bg-[#0a74b5] hover:bg-[#0d2433]'
                              }`}
                            >
                              {isJustAdded ? (
                                <span>Added ✓</span>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Add to cart</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between border-t border-[#dff1fb]">
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                              {product.brand} · {product.size}
                            </div>
                            <h2 className="text-base font-bold text-[#0d2433] mt-1">
                              <button
                                type="button"
                                onClick={() => onOpenQuickView(product)}
                                className="text-left hover:text-[#0a74b5] transition-colors cursor-pointer"
                              >
                                {product.name}
                              </button>
                            </h2>
                          </div>

                          <div className="mt-3 pt-3 border-t border-[#0a74b5]/10 flex items-baseline justify-between gap-2">
                            <span className="text-lg font-extrabold text-[#0d2433] tabular-nums">
                              KES {product.priceKes}
                            </span>
                            <span className="text-xs font-medium text-[#0d2433]/55 tabular-nums">
                              KES {pricePerLitre}/L
                            </span>
                          </div>

                          {(() => {
                            const trayCount = getTrayPieceCount(product.size);
                            if (trayCount === null) return null;
                            return (
                              <div className="mt-2.5 pt-2 border-t border-[#f0f7fc] flex items-center justify-between gap-1 text-[11px]">
                                <span className="text-[#0a74b5] font-semibold text-[10.5px]">
                                  Tray: {trayCount} pcs (KES {trayCount * product.priceKes})
                                </span>
                                <button
                                  type="button"
                                  data-testid={`retail-add-tray-${product.id}`}
                                  onClick={(e) => onAddToCart(product, e.currentTarget, trayCount)}
                                  title={`Add 1 tray of ${trayCount} pieces to cart`}
                                  className="inline-flex items-center gap-1 bg-[#eef8fe] hover:bg-[#0a74b5] hover:text-white text-[#0a74b5] font-extrabold uppercase tracking-wider text-[10px] px-2 py-1 border border-[#c3e8fb] cursor-pointer transition-colors"
                                >
                                  <Boxes className="w-3 h-3" />
                                  <span>+1 Tray</span>
                                </button>
                              </div>
                            );
                          })()}

                          {/* Visible touch/mobile/tablet Add button */}
                          <button
                            type="button"
                            onClick={(e) => onAddToCart(product, e.currentTarget)}
                            className={`btn-shine mt-3 lg:hidden w-full inline-flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-wider py-3 px-3 min-h-[44px] cursor-pointer ${
                              isJustAdded ? 'bg-[#0d2433]' : 'bg-[#0a74b5]'
                            }`}
                          >
                            {isJustAdded ? (
                              <span>Added ✓</span>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Add to cart</span>
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Our Dairy Products Range Overview (Moved into Shop Module) */}
          <section
            id="our-dairy-products"
            data-testid="shop-our-dairy-products"
            className="bg-white border-t border-[#c3e8fb] py-16"
          >
            <div className="site-container">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                    Cooperative Production Lines
                  </div>
                  <h2 className="heading-underline fluid-h2 font-bold tracking-tight text-[#0d2433] mt-1">
                    Our dairy products
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#0d2433]/75 max-w-md">
                  Processed daily in Limuru from highland milk—available in retail
                  chilled tubs, aseptic 90-day cartons, and bulk institutional crates.
                </p>
              </div>

              <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <article className="bg-[#eef8fe]/55 border border-[#c3e8fb] flex flex-col overflow-hidden">
                  <ProductStudioVisual
                    src={ASSET_IMAGES.lalaPlain1L}
                    alt="Limuru Fresh Lala Plain 1L bottle"
                    glowColor="rgba(39, 168, 236, 0.24)"
                    className="h-60 p-1.5 border-b border-[#c3e8fb]"
                  />
                  <div className="p-7 flex-1 bg-white flex flex-col justify-between gap-5">
                    <div>
                      <h3 className="text-lg font-bold text-[#0d2433]">
                        Bulk Pasteurized Milk
                      </h3>
                      <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                        Freshly pasteurized whole milk supplied in bulk hygienic
                        dispensers and cans for schools, hotels, bakeries, and
                        institutional kitchens.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShopMode('wholesale');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] transition-colors cursor-pointer self-start"
                    >
                      <span>Open Bulk Quote Estimator</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </article>

                <article className="bg-[#eef8fe]/55 border border-[#c3e8fb] flex flex-col overflow-hidden">
                  <div className="relative h-60 bg-[#dff1fb] overflow-hidden border-b border-[#c3e8fb]">
                    <ResilientImage
                      src={ASSET_IMAGES.eslArt}
                      alt="Limuru Fresh 90-Day Long Life ESL Milk cartons and 500ml pouch"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2.5 right-2.5 w-22 h-26 border border-[#8fd5f7] shadow-[0_10px_24px_rgba(13,36,51,0.22)]">
                      <ProductStudioVisual
                        src={ASSET_IMAGES.longLifeMilk}
                        alt="Limuru Fresh Long Life Milk 500ml pouch"
                        className="w-full h-full p-1"
                      />
                    </div>
                  </div>
                  <div className="p-7 flex-1 bg-white flex flex-col justify-between gap-5">
                    <div>
                      <h3 className="text-lg font-bold text-[#0d2433]">
                        ESL / UHT Packaged Milk
                      </h3>
                      <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                        Limuru Fresh 90-day Long Life Milk packaged under aseptic
                        conditions to lock in creamy farm nutrition without
                        refrigeration prior to opening.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFlavour('long-life-milk');
                        setSize('all');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] transition-colors cursor-pointer self-start"
                    >
                      <span>Shop Long Life Milk</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </article>

                <article className="bg-[#eef8fe]/55 border border-[#c3e8fb] flex flex-col overflow-hidden">
                  <ProductStudioVisual
                    src={ASSET_IMAGES.strawberry1L}
                    alt="Relish Yoghurt range including 1L Strawberry bottle"
                    glowColor="rgba(236, 72, 153, 0.22)"
                    className="h-60 p-1.5 border-b border-[#c3e8fb]"
                  />
                  <div className="p-7 flex-1 bg-white flex flex-col justify-between gap-5">
                    <div>
                      <h3 className="text-lg font-bold text-[#0d2433]">
                        Relish Yoghurt Range
                      </h3>
                      <p className="text-sm text-[#0d2433]/75 mt-2.5 leading-relaxed">
                        Cultured probiotic yoghurt in Strawberry, Vanilla, Lemon
                        Biscuit, and Passion—available in 100ml cups up to 5-litre
                        family packs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFlavour('strawberry');
                        setSize('all');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] transition-colors cursor-pointer self-start"
                    >
                      <span>Explore Relish Flavours</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </section>
          </>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={onCloseQuickView}
          onSelectProduct={onOpenQuickView}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}

function WholesaleBulkEstimator({
  onAddToCart,
  recentlyAddedIds = {},
  onBackToRetail,
}: {
  onAddToCart: (
    product: Product,
    sourceEl?: HTMLElement | null,
    quantity?: number
  ) => void;
  recentlyAddedIds?: Record<string, boolean>;
  onBackToRetail: () => void;
}) {
  const [cratesByPack, setCratesByPack] = useState<Record<string, number>>({
    'crate-longlife-500x12': 2,
    'crate-strawberry-500x12': 1,
  });
  const [deliveryZoneId, setDeliveryZoneId] =
    useState<DeliveryZoneId>('limuru-tigoni');
  const [organizationName, setOrganizationName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<
    Partial<Record<'organizationName' | 'contactName' | 'phone' | 'items', string>>
  >({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quoteReceipt, setQuoteReceipt] = useState<BulkQuoteReceipt | null>(null);

  const lineInputs = Object.entries(cratesByPack).map(([packId, crates]) => ({
    packId,
    crates,
  }));

  const estimate = calculateWholesaleQuoteEstimate(lineInputs, deliveryZoneId);

  const adjustCrate = (packId: string, delta: number) => {
    setCratesByPack((prev) => ({
      ...prev,
      [packId]: Math.max(0, Math.min(200, (prev[packId] ?? 0) + delta)),
    }));
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      organizationName,
      contactName,
      phone,
      deliveryZoneId,
      notes,
      items: lineInputs.filter((l) => l.crates > 0),
    };
    const errors = validateBulkQuoteRequest(payload);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError('');
      return;
    }

    setFormErrors({});
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch(resolveApiUrl('/api/quotes'), {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setSubmitError(
          'Bulk quote endpoint unavailable on static host. Call 020-2010611 or WhatsApp 0713-833814 with your crate count.'
        );
        return;
      }
      const data = (await res.json()) as {
        quote?: BulkQuoteReceipt;
        error?: string;
        fieldErrors?: typeof formErrors;
      };
      if (!res.ok || !data.quote) {
        if (data.fieldErrors) setFormErrors(data.fieldErrors);
        setSubmitError(data.error ?? 'Unable to save quote right now.');
        return;
      }
      setQuoteReceipt(data.quote);
    } catch {
      setSubmitError('Network error while saving quote request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      data-testid="wholesale-estimator"
      className="py-14 lg:py-16 bg-white"
    >
      <div className="site-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#0a74b5]/15 mb-10">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
              Trade, Schools &amp; Hospitality
            </div>
            <h2 className="fluid-h2 font-bold text-[#0d2433] mt-1">
              Wholesale Crate &amp; Bulk Quote Estimator
            </h2>
            <p className="text-sm text-[#0d2433]/75 mt-1.5 max-w-2xl">
              Save 11%–14% on full cartons, school trays, and 5L catering cases
              straight from our Limuru processing plant.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToRetail}
            className="text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] cursor-pointer self-start md:self-auto"
          >
            ← Back to Retail Packs
          </button>
        </div>

        <div className="layout-split-7-5 gap-10 items-start">
          {/* Left 7 cols: Crate/Carton Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHOLESALE_PACKS.map((pack) => {
              const crates = cratesByPack[pack.id] ?? 0;
              const linkedRetail = PRODUCTS.find((p) => p.id === pack.productId);
              return (
                <article
                  key={pack.id}
                  data-testid={`wholesale-pack-${pack.id}`}
                  className={`border transition-all flex flex-col justify-between ${
                    crates > 0
                      ? 'border-[#0a74b5] bg-[#eef8fe]/45 shadow-[0_14px_34px_-22px_rgba(10,116,181,0.3)]'
                      : 'border-[#c3e8fb] bg-white'
                  }`}
                >
                  <div className="p-4 flex items-center gap-4 border-b border-[#dff1fb]">
                    <div className="w-20 h-24 shrink-0 border border-[#c3e8fb] overflow-hidden">
                      <ProductStudioVisual
                        src={pack.image}
                        alt={pack.name}
                        className="w-full h-full p-1"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                          {pack.brand}
                        </span>
                        <span className="bg-[#0d2433] text-white text-[10px] font-bold uppercase px-2 py-0.5 tabular-nums">
                          Save {pack.savingsPct}%
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0d2433] mt-1">
                        {pack.name}
                      </h3>
                      <div className="text-xs font-medium text-[#0d2433]/70 mt-0.5">
                        {pack.packLabel}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-[#0d2433] tabular-nums">
                          KES {pack.wholesalePriceKes}
                        </span>
                        <span className="text-xs line-through text-[#0d2433]/45 tabular-nums">
                          KES {pack.retailTotalKes}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white flex items-center justify-between gap-3">
                    <div className="inline-flex items-center bg-[#eef8fe]">
                      <button
                        type="button"
                        onClick={() => adjustCrate(pack.id, -1)}
                        aria-label={`Remove crate of ${pack.name}`}
                        className="w-9 h-9 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span
                        data-testid={`crate-qty-${pack.id}`}
                        className="w-16 px-1 text-center text-xs font-extrabold tabular-nums text-[#0d2433] whitespace-nowrap"
                      >
                        {crates} {crates === 1 ? 'crate' : 'crates'}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustCrate(pack.id, 1)}
                        aria-label={`Add crate of ${pack.name}`}
                        className="w-9 h-9 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {linkedRetail && (
                      <button
                        type="button"
                        onClick={(e) =>
                          onAddToCart(
                            linkedRetail,
                            e.currentTarget,
                            pack.unitsPerCrate
                          )
                        }
                        className="text-[11px] font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] cursor-pointer"
                      >
                        {recentlyAddedIds[linkedRetail.id]
                          ? 'Added ✓'
                          : `+ Cart (${pack.unitsPerCrate})`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right 5 cols: Live Wholesale Quote Summary & Submission */}
          <div className="bg-[#eef8fe] border border-[#c3e8fb] p-6 sm:p-7 space-y-5">
            {quoteReceipt ? (
              <div
                data-testid="quote-confirmation"
                className="bg-white border border-[#c3e8fb] p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className="w-7 h-7 text-[#0a74b5] shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                      Wholesale Quote Saved
                    </div>
                    <h3 className="text-lg font-bold text-[#0d2433] tabular-nums">
                      Ref #{quoteReceipt.quoteNumber}
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-[#0d2433]/80 space-y-1 border-t border-[#eef8fe] pt-3">
                  <div>
                    <strong>Business:</strong> {quoteReceipt.organizationName}
                  </div>
                  <div>
                    <strong>Contact:</strong> {quoteReceipt.contactName} ({quoteReceipt.phone})
                  </div>
                  <div>
                    <strong>Zone:</strong> {quoteReceipt.deliveryZoneLabel}
                  </div>
                </div>

                <div className="border-t border-[#eef8fe] pt-3 space-y-1.5 text-xs">
                  {quoteReceipt.items.map((item) => (
                    <div key={item.packId} className="flex justify-between">
                      <span>
                        {item.packName} ({item.crates} crate{item.crates > 1 ? 's' : ''})
                      </span>
                      <span className="font-bold tabular-nums">
                        KES {item.lineTotalKes}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#0a74b5] font-bold pt-2 border-t border-[#eef8fe]">
                    <span>Cooperative Wholesale Savings</span>
                    <span className="tabular-nums">
                      -KES {quoteReceipt.totalSavingsKes}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-[#0d2433] pt-1">
                    <span>Estimated Wholesale Total</span>
                    <span className="tabular-nums">
                      KES {quoteReceipt.estimatedTotalKes}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuoteReceipt(null)}
                  className="w-full bg-[#0d2433] hover:bg-[#0a74b5] text-white text-xs font-bold uppercase tracking-wider py-3 px-4 cursor-pointer"
                >
                  Prepare another quote
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#0d2433]">
                    Live Quote Estimate
                  </h3>
                  <span className="text-xs font-bold text-[#0a74b5] tabular-nums">
                    {estimate.totalCrates} crates · {estimate.totalUnits} units
                  </span>
                </div>

                <div className="bg-white border border-[#c3e8fb] p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[#0d2433]/65">
                    <span>Retail Equivalent Value</span>
                    <span className="line-through tabular-nums">
                      KES {estimate.retailEquivalentKes}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0a74b5] font-bold">
                    <span>
                      Volume Savings ({estimate.averageDiscountPct}% avg)
                    </span>
                    <span className="tabular-nums">
                      -KES {estimate.totalSavingsKes}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#0d2433] pt-2 border-t border-[#eef8fe]">
                    <span>Estimated Wholesale Total</span>
                    <span
                      data-testid="wholesale-estimate-total"
                      className="tabular-nums"
                    >
                      KES {estimate.estimatedTotalKes}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmitQuote} noValidate className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="quote-org"
                      className="block text-xs font-semibold text-[#0d2433] mb-1"
                    >
                      School / Supermarket / Hotel Name
                    </label>
                    <input
                      id="quote-org"
                      type="text"
                      maxLength={140}
                      autoComplete="organization"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Tigoni Academy / Highland Grocers"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                    />
                    {formErrors.organizationName && (
                      <p className="text-xs text-[#991b1b] mt-1" role="alert">
                        {formErrors.organizationName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="quote-contact"
                        className="block text-xs font-semibold text-[#0d2433] mb-1"
                      >
                        Contact Person
                      </label>
                      <input
                        id="quote-contact"
                        type="text"
                        maxLength={120}
                        autoComplete="name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Peter Nduura"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                      />
                      {formErrors.contactName && (
                        <p className="text-xs text-[#991b1b] mt-1" role="alert">
                          {formErrors.contactName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="quote-phone"
                        className="block text-xs font-semibold text-[#0d2433] mb-1"
                      >
                        Phone / WhatsApp
                      </label>
                      <input
                        id="quote-phone"
                        type="tel"
                        maxLength={32}
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0713833814"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-[#991b1b] mt-1" role="alert">
                          {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="quote-zone"
                      className="block text-xs font-semibold text-[#0d2433] mb-1"
                    >
                      Delivery Corridor
                    </label>
                    <select
                      id="quote-zone"
                      value={deliveryZoneId}
                      onChange={(e) =>
                        setDeliveryZoneId(e.target.value as DeliveryZoneId)
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec] cursor-pointer"
                    >
                      {DELIVERY_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label} ({zone.eta})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="quote-notes"
                      className="block text-xs font-semibold text-[#0d2433] mb-1"
                    >
                      Schedule / Frequency Notes (optional)
                    </label>
                    <input
                      id="quote-notes"
                      type="text"
                      maxLength={400}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Every Monday & Thursday morning"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                    />
                  </div>

                  {formErrors.items && (
                    <p className="text-xs text-[#991b1b]" role="alert">
                      {formErrors.items}
                    </p>
                  )}
                  {submitError && (
                    <p className="text-xs text-[#991b1b]" role="alert">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-shine w-full inline-flex items-center justify-center gap-2 bg-[#0d2433] hover:bg-[#0a74b5] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider py-4 px-4 transition-colors cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {submitting
                        ? 'Saving Proforma Quote...'
                        : 'Save Official Bulk Quote'}
                    </span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function QuickViewModal({
  product,
  onClose,
  onSelectProduct,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (
    product: Product,
    sourceEl?: HTMLElement | null,
    quantity?: number
  ) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'storage'>(
    'overview'
  );
  const siblings = getSiblingSizesForProduct(product);
  const specs = getProductNutritionStorage(product);

  useEffect(() => {
    setQuantity(1);
    setActiveTab('overview');
  }, [product.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 bg-[#0d2433]/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:safe-overlay-pad overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-2xl w-full max-h-[94dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain layout-quickview-split shadow-[0_32px_80px_-20px_rgba(13,36,51,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-52 sm:h-64 md:h-auto md:min-h-[400px] border-b md:border-b-0 md:border-r border-[#c3e8fb]">
          <ProductStudioVisual
            src={product.image}
            alt={`${product.name} ${product.size}`}
            glowColor={product.glowColor}
            className="w-full h-full"
          />
        </div>

        <div className="p-5 sm:p-7 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                  {product.brand} · {product.flavourLabel}
                </div>
                <h2
                  id="quick-view-title"
                  className="text-2xl font-bold text-[#0d2433] mt-1"
                >
                  {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quick view"
                className="w-9 h-9 inline-flex items-center justify-center bg-[#eef8fe] text-[#0d2433] hover:bg-[#dff1fb] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-[#0d2433] tabular-nums">
                KES {product.priceKes}
              </span>
              <span className="text-xs font-semibold text-[#0d2433]/55 tabular-nums">
                (KES {Math.round(getPricePerLitre(product))}/L)
              </span>
            </div>

            {/* Overview / Nutrition / Storage Tabs */}
            <div
              role="tablist"
              aria-label="Product details tabs"
              className="mt-4 grid grid-cols-3 border border-[#c3e8fb] bg-[#eef8fe]/60 p-0.5"
            >
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'nutrition', label: 'Nutrition' },
                  { id: 'storage', label: 'Storage' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0d2433] text-white'
                        : 'text-[#0d2433]/80 hover:text-[#0a74b5]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Panel Content */}
            <div className="mt-4 min-h-[168px]">
              {activeTab === 'overview' && (
                <div>
                  <p className="text-sm text-[#0d2433]/75 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Size Switcher */}
                  <div className="mt-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0d2433]/60 mb-2">
                      Select Pack Size
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {siblings.map((sib) => {
                        const active = sib.id === product.id;
                        return (
                          <button
                            key={sib.id}
                            type="button"
                            onClick={() => onSelectProduct(sib)}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                              active
                                ? 'bg-[#0d2433] text-white'
                                : 'bg-[#eef8fe] text-[#0d2433] hover:bg-[#dff1fb]'
                            }`}
                          >
                            {sib.size} · KES {sib.priceKes}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'nutrition' && (
                <div data-testid="quickview-nutrition" className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a74b5]">
                    Nutrition Facts ({specs.servingBasis})
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-[#eef8fe]/70 border border-[#c3e8fb] p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#0d2433]/70">Energy</span>
                      <strong className="tabular-nums text-[#0d2433]">
                        {specs.energyKcal} kcal
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0d2433]/70">Protein</span>
                      <strong className="tabular-nums text-[#0d2433]">
                        {specs.proteinG}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0d2433]/70">Carbs</span>
                      <strong className="tabular-nums text-[#0d2433]">
                        {specs.carbsG}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0d2433]/70">Milk Fat</span>
                      <strong className="tabular-nums text-[#0d2433]">
                        {specs.fatG}
                      </strong>
                    </div>
                    <div className="col-span-2 flex justify-between border-t border-[#c3e8fb] pt-1.5 mt-0.5">
                      <span className="text-[#0d2433]/70">Calcium</span>
                      <strong className="tabular-nums text-[#0a74b5]">
                        {specs.calciumMg} mg
                      </strong>
                    </div>
                  </div>
                  <p className="text-xs text-[#0d2433]/75 leading-relaxed">
                    <strong>Ingredients:</strong> {specs.ingredients}
                  </p>
                </div>
              )}

              {activeTab === 'storage' && (
                <div data-testid="quickview-storage" className="space-y-3">
                  <div className="bg-[#eef8fe]/80 border border-[#c3e8fb] p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#0d2433]">
                      <ThermometerSnowflake
                        className="w-4 h-4 text-[#0a74b5]"
                        aria-hidden="true"
                      />
                      <span>{specs.storageTemp}</span>
                    </div>
                    <div className="text-[#0a74b5] font-semibold">
                      Shelf Life: {specs.shelfLife}
                    </div>
                    <p className="text-[#0d2433]/75 leading-relaxed">
                      {specs.storageCare}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {specs.certifications.map((cert) => (
                      <div
                        key={cert}
                        className="flex items-center gap-1.5 text-xs text-[#0d2433]/85 font-medium"
                      >
                        <ShieldCheck
                          className="w-3.5 h-3.5 text-[#0a74b5] shrink-0"
                          aria-hidden="true"
                        />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Stepper & Tray Selector */}
            <div className="mt-4 pt-3 border-t border-[#eef8fe] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0d2433]/60">
                  Quantity
                </div>
                <div className="inline-flex items-center bg-[#eef8fe]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span
                    data-testid="quickview-qty"
                    className="w-10 text-center text-sm font-bold tabular-nums"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="w-9 h-9 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {(() => {
                const trayCount = getTrayPieceCount(product.size);
                const trayHint = getTrayProgressHint(product.size, quantity);
                if (trayCount === null) return null;
                const isTraySelected = quantity === trayCount;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-[#eef8fe]/70 p-2.5 border border-[#c3e8fb]">
                      <div className="text-xs text-[#0d2433]">
                        <span className="font-bold">Standard Tray:</span>{' '}
                        <span className="text-[#0a74b5] font-semibold">{trayCount} pieces</span>
                        <span className="text-[11px] text-[#0d2433]/65 ml-1">
                          (KES {trayCount * product.priceKes})
                        </span>
                      </div>
                      <button
                        type="button"
                        data-testid="quickview-select-tray"
                        onClick={() => setQuantity(trayCount)}
                        className={`px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                          isTraySelected
                            ? 'bg-[#0d2433] text-white border-[#0d2433]'
                            : 'bg-white text-[#0a74b5] border-[#c3e8fb] hover:bg-[#dff1fb]'
                        }`}
                      >
                        <Boxes className="w-3 h-3" />
                        <span>{isTraySelected ? '1 Tray Selected' : `Select 1 Tray (${trayCount})`}</span>
                      </button>
                    </div>
                    {trayHint && !trayHint.isExactFullTray && (
                      <div className="flex items-center justify-between gap-2 bg-[#eef8fe] border border-[#8fd5f7] px-2.5 py-1.5 text-[11px] text-[#0d2433]">
                        <span className="font-semibold">{trayHint.hintText}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(trayHint.nextTrayTarget)}
                          className="shrink-0 bg-[#0a74b5] hover:bg-[#0d2433] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 cursor-pointer"
                        >
                          +{trayHint.itemsToCompleteTray} Finish Tray
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#eef8fe]">
            <button
              type="button"
              onClick={(e) => {
                onAddToCart(product, e.currentTarget, quantity);
                onClose();
              }}
              className="btn-shine w-full inline-flex items-center justify-center gap-2 bg-[#0a74b5] hover:bg-[#0d2433] text-white text-xs font-bold uppercase tracking-wider py-4 px-4 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>
                Add {quantity} to cart · KES {product.priceKes * quantity}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}

function QuickOrderGrid({
  cartQuantities = {},
  onAddToCart,
  onUpdateQty,
  onSetQty,
  onOpenCart,
  onBackToRetail,
}: {
  cartQuantities: Record<string, number>;
  onAddToCart: (
    product: Product,
    sourceEl?: HTMLElement | null,
    quantity?: number
  ) => void;
  onUpdateQty?: (productId: string, delta: number) => void;
  onSetQty?: (productId: string, quantity: number) => void;
  onOpenCart?: () => void;
  onBackToRetail: () => void;
}) {
  const [search, setSearch] = useState('');
  const [flavourFilter, setFlavourFilter] = useState<FlavourKey>('all');
  const [manualAdjusted, setManualAdjusted] = useState<Record<string, boolean>>({});

  const filtered = PRODUCTS.filter((p) => {
    if (flavourFilter !== 'all' && p.flavour !== flavourFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const text = `${p.name} ${p.flavourLabel} ${p.size}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const totalItemsInCart = Object.values(cartQuantities).reduce((a, b) => a + b, 0);
  const subtotalKes = PRODUCTS.reduce(
    (sum, p) => sum + p.priceKes * (cartQuantities[p.id] ?? 0),
    0
  );

  return (
    <section data-testid="quick-order-grid" className="py-14 lg:py-16 bg-white">
      <div className="site-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#0a74b5]/15 mb-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
              Express Multi-Product Ordering
            </div>
            <h2 className="fluid-h2 font-bold text-[#0d2433] mt-1">
              Quick Order Grid
            </h2>
            <p className="text-sm text-[#0d2433]/75 mt-1.5 max-w-2xl">
              Adjust quantities across multiple yoghurts and milks from a single screen and add them instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToRetail}
            className="text-xs font-bold uppercase tracking-wider text-[#0a74b5] hover:text-[#0d2433] cursor-pointer self-start md:self-auto"
          >
            ← Standard Retail Catalogue
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-[#eef8fe]/65 p-4 border border-[#c3e8fb]">
          <div className="flex flex-wrap gap-1.5">
            {FLAVOUR_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFlavourFilter(tab.key)}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  flavourFilter === tab.key
                    ? 'bg-[#0d2433] text-white'
                    : 'bg-white text-[#0d2433] hover:bg-[#dff1fb] border border-[#c3e8fb]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#0a74b5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full sm:w-60 pl-10 pr-3 py-2 text-xs bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
            />
          </div>
        </div>

        {/* Product Fast-Entry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((product) => {
            const qty = cartQuantities[product.id] ?? 0;
            const trayCount = getTrayPieceCount(product.size);
            const trayHint = getTrayProgressHint(product.size, qty);
            const fullTrays = trayCount !== null ? Math.floor(qty / trayCount) : 0;
            const remainder = trayCount !== null ? qty % trayCount : 0;
            const showHint = Boolean(trayHint && (manualAdjusted[product.id] || !trayHint.isExactFullTray));

            return (
              <div
                key={product.id}
                data-testid={`quick-order-row-${product.id}`}
                className={`border p-4 bg-white flex items-start gap-4 transition-all ${
                  qty > 0
                    ? 'border-[#0a74b5] bg-[#eef8fe]/30 shadow-[0_10px_28px_-16px_rgba(10,116,181,0.25)]'
                    : 'border-[#c3e8fb]'
                }`}
              >
                <div className="w-16 h-20 shrink-0 border border-[#c3e8fb] overflow-hidden bg-[#eef8fe]/50">
                  <ProductStudioVisual
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full p-1"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a74b5]">
                    {product.brand} · {product.size}
                  </div>
                  <h3 className="text-sm font-bold text-[#0d2433] truncate mt-0.5">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-extrabold text-[#0d2433] tabular-nums">
                      KES {product.priceKes} each
                    </span>
                    {trayCount !== null && (
                      <span className="text-[10px] font-semibold text-[#0a74b5] bg-[#eef8fe] px-1.5 py-0.5 border border-[#c3e8fb]">
                        Tray: {trayCount} pcs (KES {trayCount * product.priceKes})
                      </span>
                    )}
                  </div>

                  {fullTrays > 0 && (
                    <div className="mt-1 text-[10px] font-bold text-[#0a74b5]">
                      {fullTrays} Tray{fullTrays > 1 ? 's' : ''} in basket
                      {remainder > 0 ? ` + ${remainder} single pcs` : ''}
                    </div>
                  )}

                  {showHint && trayHint && (
                    <div
                      data-testid={`quick-tray-hint-${product.id}`}
                      className={`mt-1.5 px-2 py-1 text-[10.5px] font-semibold flex items-center justify-between gap-2 border ${
                        trayHint.isExactFullTray
                          ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                          : 'bg-[#eef8fe] border-[#8fd5f7] text-[#0d2433]'
                      }`}
                    >
                      <span>{trayHint.hintText}</span>
                      {!trayHint.isExactFullTray && (
                        <button
                          type="button"
                          onClick={(e) => {
                            setManualAdjusted((prev) => ({ ...prev, [product.id]: true }));
                            onAddToCart(product, e.currentTarget, trayHint.itemsToCompleteTray);
                          }}
                          className="shrink-0 bg-[#0a74b5] hover:bg-[#0d2433] text-white text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 cursor-pointer"
                        >
                          +{trayHint.itemsToCompleteTray} Tray
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center bg-[#eef8fe] border border-[#c3e8fb]">
                      <button
                        type="button"
                        onClick={() => {
                          setManualAdjusted((prev) => ({ ...prev, [product.id]: true }));
                          if (qty > 0 && onUpdateQty) {
                            onUpdateQty(product.id, -1);
                          }
                        }}
                        aria-label={`Decrease ${product.name}`}
                        className="w-7 h-7 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        inputMode="numeric"
                        aria-label={`Quantity for ${product.name}`}
                        data-testid={`quick-qty-input-${product.id}`}
                        value={qty}
                        onChange={(e) => {
                          setManualAdjusted((prev) => ({ ...prev, [product.id]: true }));
                          const parsed = parseInt(e.target.value, 10);
                          const clean = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
                          if (onSetQty) {
                            onSetQty(product.id, clean);
                          } else if (clean > qty) {
                            onAddToCart(product, e.currentTarget, clean - qty);
                          }
                        }}
                        className="w-11 h-7 text-center text-xs font-bold tabular-nums bg-white border-x border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-1 focus:ring-[#27a8ec]"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          setManualAdjusted((prev) => ({ ...prev, [product.id]: true }));
                          onAddToCart(product, e.currentTarget, 1);
                        }}
                        aria-label={`Increase ${product.name}`}
                        className="w-7 h-7 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {trayCount !== null && (
                        <button
                          type="button"
                          data-testid={`add-tray-${product.id}`}
                          onClick={(e) => {
                            setManualAdjusted((prev) => ({ ...prev, [product.id]: true }));
                            onAddToCart(product, e.currentTarget, trayCount);
                          }}
                          title={`Add 1 full tray (${trayCount} pcs) of ${product.name}`}
                          className="px-2 py-1 text-[10.5px] font-extrabold uppercase tracking-wider bg-[#eef8fe] hover:bg-[#0a74b5] hover:text-white text-[#0a74b5] border border-[#0a74b5]/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Boxes className="w-3 h-3" />
                          <span>+ 1 Tray ({trayCount})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          if (qty === 0) {
                            onAddToCart(product, e.currentTarget, 1);
                          } else if (onOpenCart) {
                            onOpenCart();
                          }
                        }}
                        className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          qty > 0
                            ? 'bg-[#0a74b5] text-white hover:bg-[#0d2433]'
                            : 'bg-[#0d2433] text-white hover:bg-[#0a74b5]'
                        }`}
                      >
                        {qty > 0 ? `${qty} in basket ✓` : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating / Bottom Summary Bar */}
        {totalItemsInCart > 0 && onOpenCart && (
          <div className="mt-12 bg-[#0d2433] text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#27a8ec] text-[#0d2433] font-black text-base inline-flex items-center justify-center tabular-nums">
                {totalItemsInCart}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#8fd5f7]">
                  Quick Order Basket Total
                </div>
                <div className="text-lg font-extrabold tabular-nums">
                  KES {subtotalKes}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="btn-shine bg-[#27a8ec] hover:bg-white text-[#0d2433] text-xs font-extrabold uppercase tracking-widest px-7 py-3.5 cursor-pointer transition-colors"
            >
              Review &amp; Checkout →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

