import React, { useEffect, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import type {
  AuthUser,
  CartItem,
  CheckoutFormData,
  DeliveryWindowId,
  DeliveryZoneId,
  OrderReceipt,
} from '../types/dairy';
import {
  DELIVERY_WINDOWS,
  DELIVERY_ZONES,
  FREE_DELIVERY_THRESHOLD_KES,
  buildWhatsAppOrderUrl,
  calculateCartSummary,
  getDeliveryWindowById,
  getDeliveryZoneById,
  getTrayPieceCount,
  getTrayProgressHint,
  validateCheckoutForm,
  validateKenyanPhone,
} from '../utils/catalog';
import { saveOrderToHistory } from '../utils/orderStorage';
import {
  parseSavedOrderLookup,
  type SavedOrderLookup,
} from '../utils/security';
import { buildApiHeaders, resolveApiUrl } from '../utils/wpConfig';
import { ProductStudioVisual } from './BrandMark';
import { EmailSignInPanel } from './EmailSignInPanel';

const LAST_ORDER_KEY = 'limuru_last_order_v1';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  authUser: AuthUser | null;
  sessionToken?: string | null;
  onSignedIn: (user: AuthUser, token?: string) => void;
  onSignOut: () => void;
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onSetQty?: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onGoShop: () => void;
  onOpenProfile?: () => void;
}

interface VisualDeliveryStatusIndicatorProps {
  zone: { label: string; region: string; eta: string };
  windowOpt: { label: string; timeRange: string; etaBadge: string };
  stage?: 'confirmed' | 'packing' | 'dispatched' | 'delivered';
}

function VisualDeliveryStatusIndicator({
  zone,
  windowOpt,
  stage = 'confirmed',
}: VisualDeliveryStatusIndicatorProps) {
  const steps = [
    { id: 'confirmed', label: 'Order Confirmed', time: 'Instant' },
    { id: 'packing', label: 'Cold-Store Pack', time: 'Limuru (<4°C)' },
    { id: 'dispatched', label: 'In Chilled Van', time: 'Refrigerated' },
    { id: 'delivered', label: 'Doorstep Arrival', time: windowOpt.timeRange },
  ];

  const currentIdx =
    stage === 'delivered'
      ? 3
      : stage === 'dispatched'
        ? 2
        : stage === 'packing'
          ? 1
          : 0;

  return (
    <div
      data-testid="delivery-status-indicator"
      className="bg-[#eef8fe] border border-[#c3e8fb] p-3.5 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0d2433]">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span>Cold-Chain Delivery Progress</span>
        </div>
        <span
          data-testid="delivery-eta-badge"
          className="text-[10px] font-bold uppercase tracking-wider bg-[#0a74b5] text-white px-2 py-0.5"
        >
          {windowOpt.timeRange}
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative pt-1 pb-1">
        <div className="grid grid-cols-4 gap-1 relative z-10">
          {steps.map((step, idx) => {
            const isActive = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={step.id} className="text-center">
                <div
                  className={`w-6 h-6 mx-auto flex items-center justify-center text-[10px] font-black transition-colors ${
                    isCurrent
                      ? 'bg-[#0a74b5] text-white ring-2 ring-[#8fd5f7]'
                      : isActive
                        ? 'bg-[#16a34a] text-white'
                        : 'bg-white text-[#0d2433]/50 border border-[#c3e8fb]'
                  }`}
                >
                  {isActive && !isCurrent ? '✓' : idx + 1}
                </div>
                <div
                  className={`text-[9.5px] leading-tight font-bold mt-1.5 truncate ${
                    isActive ? 'text-[#0d2433]' : 'text-[#0d2433]/45'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[8.5px] text-[#0a74b5] font-semibold truncate mt-0.5">
                  {step.time}
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#c3e8fb] -z-0" />
      </div>

      <div className="bg-white/90 p-2.5 text-[11px] text-[#0d2433]/85 border border-[#c3e8fb]/60 flex items-center justify-between">
        <span className="truncate">
          <strong>Destination:</strong> {zone.label}
        </span>
        <span className="text-[#0a74b5] font-bold shrink-0 ml-2">
          {windowOpt.label}
        </span>
      </div>
    </div>
  );
}

export function CartDrawer({
  isOpen,
  cart,
  authUser,
  sessionToken,
  onSignedIn,
  onSignOut,
  onClose,
  onUpdateQty,
  onSetQty,
  onRemoveItem,
  onClearCart,
  onGoShop,
  onOpenProfile,
}: CartDrawerProps) {
  const [form, setForm] = useState<CheckoutFormData>({
    fullName: authUser?.displayName ?? '',
    email: authUser?.email ?? '',
    phone: '',
    address: '',
    paymentMethod: 'mpesa',
    deliveryZoneId: 'limuru-tigoni',
    deliveryWindowId: 'morning',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutFormData, string>>
  >({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [savedLookup, setSavedLookup] = useState<SavedOrderLookup | null>(() => {
    try {
      return parseSavedOrderLookup(window.localStorage.getItem(LAST_ORDER_KEY));
    } catch {
      return null;
    }
  });
  const [lookupCode, setLookupCode] = useState(() => savedLookup?.orderNumber ?? '');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [manuallyAdjustedIds, setManuallyAdjustedIds] = useState<Record<string, boolean>>({});
  const [draftQtyStrings, setDraftQtyStrings] = useState<Record<string, string>>({});

  const markManualAdjust = (productId: string) => {
    setManuallyAdjustedIds((prev) => (prev[productId] ? prev : { ...prev, [productId]: true }));
  };

  const selectedZone = getDeliveryZoneById(form.deliveryZoneId);
  const selectedWindow = getDeliveryWindowById(form.deliveryWindowId);
  const summary = calculateCartSummary(cart, selectedZone.id);
  const whatsappUrl = buildWhatsAppOrderUrl(cart, form);

  useEffect(() => {
    if (authUser) {
      setForm((prev) => ({
        ...prev,
        email: authUser.email,
        fullName: prev.fullName.trim() ? prev.fullName : authUser.displayName,
      }));
    } else {
      setForm((prev) => ({ ...prev, email: '' }));
    }
  }, [authUser]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.detailedItems.length === 0) return;

    if (!authUser) {
      setSubmitError('Please sign in via email above before placing your order.');
      return;
    }

    const submissionForm: CheckoutFormData = {
      ...form,
      email: authUser.email,
    };

    const validationErrors = validateCheckoutForm(submissionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError('');
      return;
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionToken) {
        requestHeaders['Authorization'] = `Bearer ${sessionToken}`;
      }
      const response = await fetch(resolveApiUrl('/api/orders'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildApiHeaders(requestHeaders),
        body: JSON.stringify({ cart, form: submissionForm }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setSubmitError(
          'Online order endpoint is unavailable in static preview. Please use "Order on WhatsApp" below to send your basket directly.'
        );
        return;
      }

      const payload = (await response.json()) as {
        order?: OrderReceipt;
        lookupToken?: string;
        error?: string;
        fieldErrors?: Partial<Record<keyof CheckoutFormData, string>>;
      };

      if (!response.ok || !payload.order) {
        if (payload.fieldErrors) setErrors(payload.fieldErrors);
        setSubmitError(payload.error ?? 'Could not place order right now.');
        return;
      }

      const nextSaved: SavedOrderLookup = {
        orderNumber: payload.order.orderNumber,
        lookupToken: payload.lookupToken,
      };
      setReceipt(payload.order);
      setSavedLookup(nextSaved);
      setLookupCode(payload.order.orderNumber);
      setLookupPhone('');
      try {
        window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(nextSaved));
        // Save to cached past orders history for the user profile
        saveOrderToHistory(payload.order);
      } catch {
        // Ignore storage quota errors
      }
      onClearCart();
    } catch {
      setSubmitError('Network error while saving your order. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasBrowserTokenForCode =
    Boolean(savedLookup?.lookupToken) &&
    savedLookup?.orderNumber === lookupCode.trim().toUpperCase();

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupCode.trim().toUpperCase();
    if (!/^LDF-\d{4,8}$/.test(cleaned)) {
      setLookupError('Enter an order reference like LDF-12345678.');
      return;
    }

    const cleanedPhone = lookupPhone.trim();
    if (!hasBrowserTokenForCode && !validateKenyanPhone(cleanedPhone)) {
      setLookupError('Enter the M-Pesa phone number used when placing that order.');
      return;
    }

    setLookupError('');
    setLookupLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (hasBrowserTokenForCode && savedLookup?.lookupToken) {
        headers['x-lookup-token'] = savedLookup.lookupToken;
      }
      if (cleanedPhone) {
        headers['x-verify-phone'] = cleanedPhone;
      }

      const res = await fetch(
        resolveApiUrl(`/api/orders/${encodeURIComponent(cleaned)}`),
        {
          headers: buildApiHeaders(headers),
        }
      );
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setLookupError('Order lookup requires the active Limuru Dairy or WordPress REST backend.');
        return;
      }
      const data = (await res.json()) as { order?: OrderReceipt; error?: string };
      if (!res.ok || !data.order) {
        setLookupError(
          data.error ?? 'Order reference and verification details did not match.'
        );
        return;
      }
      setReceipt(data.order);
    } catch {
      setLookupError('Unable to check order status right now.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-[#0d2433]/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart and checkout"
      onClick={onClose}
    >
      <div
        className="animate-drawer-in w-full max-w-md bg-white h-[100dvh] flex flex-col shadow-[0_24px_80px_rgba(13,36,51,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#8fd5f7] pt-[max(1rem,env(safe-area-inset-top))] pb-4 pl-4 sm:pl-6 pr-[max(1rem,env(safe-area-inset-right))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#0d2433]" aria-hidden="true" />
            <h2 className="text-base font-bold uppercase tracking-wider text-[#0d2433]">
              Your Basket ({summary.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-9 h-9 bg-white inline-flex items-center justify-center text-[#0d2433] hover:bg-[#eef8fe] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        {!receipt && (
          <div className="bg-[#eef8fe] px-4 sm:px-6 py-3">
            <div className="text-xs font-semibold text-[#0d2433] flex items-center justify-between gap-2">
              {summary.qualifiesFreeDelivery ? (
                <span className="text-[#0a74b5] font-bold">
                  Free delivery unlocked (over KES {FREE_DELIVERY_THRESHOLD_KES})
                </span>
              ) : (
                <span>
                  Add{' '}
                  <strong className="text-[#0a74b5] tabular-nums">
                    KES {summary.remainingForFreeDeliveryKes}
                  </strong>{' '}
                  more for free delivery
                </span>
              )}
              <span className="tabular-nums text-[#0d2433]/65">
                {summary.freeDeliveryProgressPct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-white overflow-hidden">
              <div
                className="h-full bg-[#27a8ec] transition-[width] duration-300"
                style={{ width: `${summary.freeDeliveryProgressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pl-4 sm:pl-6 pr-[max(1rem,env(safe-area-inset-right))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-6">
          {receipt ? (
            <div
              data-testid="order-confirmation"
              className="bg-[#eef8fe] p-6 space-y-4 border border-[#c3e8fb]"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="w-7 h-7 text-[#0a74b5] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]">
                    Order Saved &amp; Confirmed
                  </div>
                  <h3 className="text-lg font-bold text-[#0d2433] tabular-nums">
                    Order #{receipt.orderNumber}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-[#0d2433]/80 space-y-1.5 border-t border-[#c3e8fb] pt-3">
                <div>
                  <strong>Customer:</strong> {receipt.customerName}
                </div>
                {receipt.customerEmail && (
                  <div className="break-all">
                    <strong>Email:</strong> {receipt.customerEmail}
                  </div>
                )}
                <div>
                  <strong>Phone:</strong> {receipt.phone}
                </div>
                {receipt.deliveryZoneLabel && (
                  <div>
                    <strong>Zone:</strong> {receipt.deliveryZoneLabel}
                  </div>
                )}
                {receipt.estimatedDelivery && (
                  <div>
                    <strong>Dispatch:</strong> {receipt.estimatedDelivery}
                  </div>
                )}
                <div>
                  <strong>Address:</strong> {receipt.address}
                </div>
                <div>
                  <strong>Payment:</strong>{' '}
                  {receipt.paymentMethod === 'mpesa'
                    ? 'M-Pesa Paybill / STK'
                    : 'Cash on delivery'}
                </div>
                <div>
                  <strong>Placed:</strong> {receipt.placedAt}
                </div>
              </div>

              <div className="border-t border-[#c3e8fb] pt-3 space-y-1.5">
                {receipt.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-xs text-[#0d2433]"
                  >
                    <span>
                      {item.name} ({item.size}) × {item.quantity}
                    </span>
                    <span className="font-bold tabular-nums">
                      KES {item.lineTotalKes}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-[#0d2433]/75 pt-2 border-t border-[#c3e8fb]">
                  <span>Delivery</span>
                  <span className="tabular-nums">
                    {receipt.deliveryFeeKes === 0
                      ? 'FREE'
                      : `KES ${receipt.deliveryFeeKes}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#0d2433] pt-1">
                  <span>Total</span>
                  <span className="tabular-nums">KES {receipt.totalKes}</span>
                </div>
              </div>

              {/* Visual Delivery Status on Confirmed Order */}
              <VisualDeliveryStatusIndicator
                zone={{
                  label: receipt.deliveryZoneLabel ?? 'Kiambu County',
                  region: 'Delivery Area',
                  eta: receipt.estimatedDelivery ?? 'Cold-Chain Van',
                }}
                windowOpt={{
                  label: receipt.deliveryWindowLabel ?? 'Morning Route',
                  timeRange:
                    receipt.deliveryWindowId === 'evening'
                      ? '5:00 PM – 7:30 PM'
                      : receipt.deliveryWindowId === 'afternoon'
                        ? '1:00 PM – 4:30 PM'
                        : '8:00 AM – 11:30 AM',
                  etaBadge: receipt.estimatedDelivery ?? 'Scheduled Arrival',
                }}
                stage={receipt.status ?? 'dispatched'}
              />

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReceipt(null);
                    onClose();
                  }}
                  className="w-full bg-[#0d2433] hover:bg-[#0a74b5] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 cursor-pointer transition-colors"
                >
                  Continue shopping
                </button>

                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt(null);
                      onClose();
                      onOpenProfile();
                    }}
                    data-testid="view-my-orders-btn"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-white border border-[#0a74b5] text-[#0a74b5] hover:bg-[#eef8fe] text-xs font-bold uppercase tracking-wider py-3 px-4 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>View All My Orders in Profile</span>
                  </button>
                )}
              </div>
            </div>
          ) : summary.detailedItems.length === 0 ? (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-[#eef8fe] flex items-center justify-center text-[#0a74b5]">
                  <ShoppingBag className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0d2433]">
                    Your dairy basket is empty
                  </h3>
                  <p className="text-xs text-[#0d2433]/75 mt-1">
                    Explore fresh Relish yoghurts and 90-day Limuru Fresh milk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoShop();
                  }}
                  className="btn-shine inline-flex items-center justify-center bg-[#0d2433] text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 cursor-pointer"
                >
                  Browse shop
                </button>
              </div>

              {/* Persisted Order Lookup */}
              <form
                onSubmit={handleOrderLookup}
                className="bg-[#eef8fe] border border-[#c3e8fb] p-4 space-y-2.5"
              >
                <label
                  htmlFor="order-lookup-code"
                  className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5]"
                >
                  Retrieve Saved Order
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="order-lookup-code"
                      type="text"
                      maxLength={16}
                      value={lookupCode}
                      onChange={(e) => setLookupCode(e.target.value)}
                      placeholder="e.g. LDF-12345678"
                      className="flex-1 bg-white border border-[#c3e8fb] px-3 py-2 text-xs text-[#0d2433] uppercase focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                    />
                    <button
                      type="submit"
                      disabled={lookupLoading}
                      className="inline-flex items-center gap-1.5 bg-[#0d2433] hover:bg-[#0a74b5] text-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
                    >
                      <Search className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{lookupLoading ? '...' : 'Find'}</span>
                    </button>
                  </div>
                  {!hasBrowserTokenForCode && (
                    <div>
                      <label htmlFor="order-lookup-phone" className="sr-only">
                        Verification M-Pesa Phone Number
                      </label>
                      <input
                        id="order-lookup-phone"
                        type="tel"
                        maxLength={32}
                        value={lookupPhone}
                        onChange={(e) => setLookupPhone(e.target.value)}
                        placeholder="M-Pesa phone used at checkout (e.g. 0713833814)"
                        className="w-full bg-white border border-[#c3e8fb] px-3 py-2 text-xs text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                      />
                    </div>
                  )}
                </div>
                {lookupError && (
                  <p className="text-xs text-[#991b1b]" role="alert">
                    {lookupError}
                  </p>
                )}
              </form>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-4">
                {summary.detailedItems.map(({ product, quantity, lineTotalKes }) => {
                  const trayPieceCount = getTrayPieceCount(product.size);
                  const trayHint = getTrayProgressHint(product.size, quantity);
                  const isFullTray = trayPieceCount !== null && quantity >= trayPieceCount;
                  const fullTrays = trayPieceCount !== null ? Math.floor(quantity / trayPieceCount) : 0;
                  const trayRemainder = trayPieceCount !== null ? quantity % trayPieceCount : 0;
                  const isManualAdjusted = Boolean(manuallyAdjustedIds[product.id]);

                  return (
                    <div
                      key={product.id}
                      data-testid={`cart-row-${product.id}`}
                      className="flex gap-4 pb-4 border-b border-[#eef8fe]"
                    >
                      <div className="w-18 h-20 shrink-0 border border-[#c3e8fb] overflow-hidden">
                        <ProductStudioVisual
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full p-0.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[#0d2433] truncate">
                              {product.name}
                            </h3>
                            <div className="text-xs text-[#0a74b5] font-medium">
                              {product.size} · KES {product.priceKes} each
                            </div>
                            {trayPieceCount !== null && (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold bg-[#eef8fe] text-[#0a74b5] border border-[#c3e8fb] px-1.5 py-0.5">
                                  1 Tray = {trayPieceCount} pcs
                                </span>
                                {isFullTray && (
                                  <span className="text-[10px] font-extrabold bg-[#27a8ec]/20 text-[#0a74b5] border border-[#27a8ec]/40 px-1.5 py-0.5">
                                    {fullTrays} Tray{fullTrays > 1 ? 's' : ''}
                                    {trayRemainder > 0 ? ` + ${trayRemainder} pcs` : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            aria-label={`Remove ${product.name} ${product.size}`}
                            className="text-[#0d2433]/45 hover:text-[#991b1b] p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center bg-[#eef8fe] border border-[#c3e8fb]">
                              <button
                                type="button"
                                onClick={() => {
                                  markManualAdjust(product.id);
                                  onUpdateQty(product.id, -1);
                                  setDraftQtyStrings((prev) => {
                                    const next = { ...prev };
                                    delete next[product.id];
                                    return next;
                                  });
                                }}
                                aria-label={`Decrease quantity of ${product.name}`}
                                className="w-7 h-7 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                inputMode="numeric"
                                aria-label={`Manual quantity for ${product.name} ${product.size}`}
                                data-testid={`cart-qty-input-${product.id}`}
                                value={draftQtyStrings[product.id] ?? String(quantity)}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  markManualAdjust(product.id);
                                  setDraftQtyStrings((prev) => ({ ...prev, [product.id]: raw }));
                                  const parsed = parseInt(raw, 10);
                                  if (!Number.isNaN(parsed) && parsed >= 1) {
                                    if (onSetQty) {
                                      onSetQty(product.id, parsed);
                                    } else {
                                      onUpdateQty(product.id, parsed - quantity);
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  setDraftQtyStrings((prev) => {
                                    const next = { ...prev };
                                    delete next[product.id];
                                    return next;
                                  });
                                }}
                                className="w-11 h-7 text-center text-xs font-bold tabular-nums bg-white border-x border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-1 focus:ring-[#27a8ec]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  markManualAdjust(product.id);
                                  onUpdateQty(product.id, 1);
                                  setDraftQtyStrings((prev) => {
                                    const next = { ...prev };
                                    delete next[product.id];
                                    return next;
                                  });
                                }}
                                aria-label={`Increase quantity of ${product.name}`}
                                className="w-7 h-7 inline-flex items-center justify-center hover:bg-[#dff1fb] text-[#0d2433] cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {trayPieceCount !== null && (
                              <button
                                type="button"
                                onClick={() => {
                                  markManualAdjust(product.id);
                                  onUpdateQty(product.id, trayPieceCount);
                                }}
                                title={`Add 1 full tray (${trayPieceCount} pcs) of ${product.name}`}
                                className="inline-flex items-center gap-1 bg-white hover:bg-[#dff1fb] text-[#0a74b5] border border-[#c3e8fb] px-2 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                <Boxes className="w-3 h-3" />
                                <span>+1 Tray ({trayPieceCount})</span>
                              </button>
                            )}
                          </div>

                          <span className="text-sm font-extrabold text-[#0d2433] tabular-nums">
                            KES {lineTotalKes}
                          </span>
                        </div>

                        {/* Tray-friendly progress hint when manually adjusted or partial tray */}
                        {trayHint && (isManualAdjusted || !trayHint.isExactFullTray) && (
                          <div
                            data-testid={`tray-hint-${product.id}`}
                            role="status"
                            className={`mt-2 px-2.5 py-1.5 text-[11px] flex items-center justify-between gap-2 border ${
                              trayHint.isExactFullTray
                                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                                : 'bg-[#eef8fe] border-[#8fd5f7] text-[#0d2433]'
                            }`}
                          >
                            <span className="font-semibold leading-snug">
                              {trayHint.hintText}
                            </span>
                            {!trayHint.isExactFullTray && (
                              <button
                                type="button"
                                data-testid={`complete-tray-btn-${product.id}`}
                                onClick={() => {
                                  markManualAdjust(product.id);
                                  onUpdateQty(product.id, trayHint.itemsToCompleteTray);
                                  setDraftQtyStrings((prev) => {
                                    const next = { ...prev };
                                    delete next[product.id];
                                    return next;
                                  });
                                }}
                                className="shrink-0 bg-[#0a74b5] hover:bg-[#0d2433] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 cursor-pointer transition-colors"
                              >
                                +{trayHint.itemsToCompleteTray} Finish Tray
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Zone & Window Selection */}
              <div className="bg-[#eef8fe]/75 border border-[#c3e8fb] p-4 space-y-3.5">
                <div>
                  <label
                    htmlFor="delivery-zone-select"
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delivery Zone</span>
                  </label>
                  <select
                    id="delivery-zone-select"
                    data-testid="delivery-zone-select"
                    value={selectedZone.id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        deliveryZoneId: e.target.value as DeliveryZoneId,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec] cursor-pointer"
                  >
                    {DELIVERY_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.label} · KES {zone.feeKes}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Window Selector */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a74b5] mb-1.5">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Selected Delivery Window</span>
                  </label>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label="Delivery Arrival Window"
                  >
                    {DELIVERY_WINDOWS.map((win) => {
                      const isSelected = form.deliveryWindowId === win.id;
                      return (
                        <button
                          key={win.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          data-testid={`delivery-window-${win.id}`}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              deliveryWindowId: win.id,
                            }))
                          }
                          className={`p-2 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#0d2433] border-[#0d2433] text-white shadow-sm'
                              : 'bg-white border-[#c3e8fb] text-[#0d2433] hover:bg-[#dff1fb]'
                          }`}
                        >
                          <div className="text-[10px] font-extrabold uppercase tracking-wider truncate">
                            {win.label.replace(' Route', '').replace(' Express', '')}
                          </div>
                          <div
                            className={`text-[9px] font-semibold truncate mt-1 ${
                              isSelected ? 'text-[#8fd5f7]' : 'text-[#0a74b5]'
                            }`}
                          >
                            {win.timeRange}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Real-Time Delivery Status Indicator */}
                <VisualDeliveryStatusIndicator
                  zone={selectedZone}
                  windowOpt={selectedWindow}
                  stage="confirmed"
                />

                <div className="flex items-center justify-between gap-2 text-[11px] text-[#0d2433]/75 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#0a74b5]" aria-hidden="true" />
                    <span>{selectedZone.eta}</span>
                  </span>
                  <span className="font-semibold text-[#0a74b5]">
                    Free ≥ KES {selectedZone.freeOverKes}
                  </span>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-[#eef8fe] p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#0d2433]/75">Subtotal</span>
                  <span className="font-bold tabular-nums">
                    KES {summary.subtotalKes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0d2433]/75">
                    Delivery ({selectedZone.region})
                  </span>
                  <span
                    data-testid="cart-delivery-fee"
                    className="font-bold tabular-nums text-[#0a74b5]"
                  >
                    {summary.deliveryFeeKes === 0
                      ? 'FREE'
                      : `KES ${summary.deliveryFeeKes}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#0d2433] pt-2 border-t border-[#c3e8fb]">
                  <span>Total</span>
                  <span data-testid="cart-total-kes" className="tabular-nums">
                    KES {summary.totalKes}
                  </span>
                </div>
              </div>

              {/* Email Sign-In Gate OR Unlocked Checkout Form */}
              <div className="space-y-4 pt-2">
                <EmailSignInPanel
                  authUser={authUser}
                  onSignedIn={onSignedIn}
                  onSignOut={onSignOut}
                  heading="Sign in via email to complete your order"
                  subtitle="Enter your email address to verify your identity cleanly before scheduling dispatch."
                />

                {authUser ? (
                  <form
                    onSubmit={handleCheckoutSubmit}
                    noValidate
                    className="space-y-4"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0d2433]">
                      Delivery &amp; Payment Details
                    </h3>

                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-semibold text-[#0d2433] mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        maxLength={120}
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="e.g. Wanjiku Kamau"
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#eef8fe]/55 border border-[#c3e8fb] text-[#0d2433] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                      />
                      {errors.fullName && (
                        <p className="text-xs text-[#991b1b] mt-1" role="alert">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-semibold text-[#0d2433] mb-1"
                      >
                        M-Pesa Phone Number
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        inputMode="tel"
                        maxLength={32}
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="0713833814"
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#eef8fe]/55 border border-[#c3e8fb] text-[#0d2433] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                      />
                      {errors.phone && (
                        <p className="text-xs text-[#991b1b] mt-1" role="alert">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-address"
                        className="block text-xs font-semibold text-[#0d2433] mb-1"
                      >
                        Delivery Estate / Street
                      </label>
                      <input
                        id="checkout-address"
                        type="text"
                        maxLength={240}
                        autoComplete="street-address"
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, address: e.target.value }))
                        }
                        placeholder="Estate, road or building landmark"
                        className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#eef8fe]/55 border border-[#c3e8fb] text-[#0d2433] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
                      />
                      {errors.address && (
                        <p className="text-xs text-[#991b1b] mt-1" role="alert">
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#0d2433] mb-1.5">
                        Payment Method
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, paymentMethod: 'mpesa' }))
                          }
                          className={`min-h-[44px] py-2.5 px-3 text-xs font-bold cursor-pointer transition-colors ${
                            form.paymentMethod === 'mpesa'
                              ? 'bg-[#0d2433] text-white'
                              : 'bg-[#eef8fe] text-[#0d2433]'
                          }`}
                        >
                          M-Pesa
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, paymentMethod: 'cash' }))
                          }
                          className={`min-h-[44px] py-2.5 px-3 text-xs font-bold cursor-pointer transition-colors ${
                            form.paymentMethod === 'cash'
                              ? 'bg-[#0d2433] text-white'
                              : 'bg-[#eef8fe] text-[#0d2433]'
                          }`}
                        >
                          Cash on delivery
                        </button>
                      </div>
                    </div>

                    {submitError && (
                      <p className="text-xs font-semibold text-[#991b1b]" role="alert">
                        {submitError}
                      </p>
                    )}

                    <div className="space-y-2.5 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="place-order-submit-btn"
                        className="btn-shine w-full min-h-[46px] bg-[#0a74b5] hover:bg-[#0d2433] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 transition-colors cursor-pointer"
                      >
                        {isSubmitting
                          ? 'Saving Order...'
                          : `Place Order · KES ${summary.totalKes}`}
                      </button>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        <span>Order on WhatsApp</span>
                      </a>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-[#0d2433]/65 text-center">
                    Delivery address, M-Pesa / Cash checkout, and WhatsApp dispatch unlock immediately after email verification above.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
