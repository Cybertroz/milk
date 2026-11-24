import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import type { AuthUser, OrderReceipt } from '../types/dairy.ts';
import {
  PRODUCTS,
  getTrayPieceCount,
} from '../utils/catalog.ts';
import {
  clearOrderHistory,
  getStoredOrderHistory,
} from '../utils/orderStorage.ts';
import { EmailSignInPanel } from './EmailSignInPanel';

interface UserProfileModalProps {
  isOpen: boolean;
  authUser: AuthUser | null;
  onSignedIn: (user: AuthUser, token?: string) => void;
  onSignOut: () => void;
  onClose: () => void;
  onReorder: (cartItems: Array<{ productId: string; quantity: number }>) => void;
  onGoShop: () => void;
  onOrdersCleared?: () => void;
}

export function UserProfileModal({
  isOpen,
  authUser,
  onSignedIn,
  onSignOut,
  onClose,
  onReorder,
  onGoShop,
  onOrdersCleared,
}: UserProfileModalProps) {
  const [orders, setOrders] = useState<OrderReceipt[]>([]);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOrders(getStoredOrderHistory());
      setReorderSuccessMsg('');
      setConfirmingClear(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmClearHistory = () => {
    clearOrderHistory();
    setOrders([]);
    setConfirmingClear(false);
    setReorderSuccessMsg('Cached order history cleared from this device.');
    onOrdersCleared?.();
  };

  const handleReorderOrder = (order: OrderReceipt) => {
    const itemsToAdd: Array<{ productId: string; quantity: number }> = [];
    for (const item of order.items) {
      // Find matching product by name and size
      const found = PRODUCTS.find(
        (p) =>
          p.size === item.size &&
          (p.name.toLowerCase() === item.name.toLowerCase() ||
            p.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name.toLowerCase().includes(p.flavourLabel.toLowerCase()))
      );
      if (found) {
        itemsToAdd.push({ productId: found.id, quantity: item.quantity });
      }
    }

    if (itemsToAdd.length > 0) {
      onReorder(itemsToAdd);
      setReorderSuccessMsg(
        `Added ${itemsToAdd.reduce((sum, i) => sum + i.quantity, 0)} items from Order #${order.orderNumber} to your cart!`
      );
      window.setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const displayName = authUser?.displayName || 'Limuru Shopper';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'LD';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#0d2433]/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="User Profile and My Orders"
      onClick={onClose}
    >
      <div
        className="animate-drawer-in relative w-full max-w-2xl bg-white shadow-[0_24px_80px_rgba(13,36,51,0.32)] overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#8fd5f7] px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#0a74b5]/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#0d2433] text-white flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#8fd5f7]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a74b5]">
                Limuru Dairy Member
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#0d2433] truncate">
                Customer Profile &amp; Past Orders
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="w-9 h-9 bg-white inline-flex items-center justify-center text-[#0d2433] hover:bg-[#eef8fe] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content (keeps member card + My Orders accessible on short landscape screens) */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
        {/* Member Profile Quick Card */}
        <div className="bg-[#eef8fe]/80 border-b border-[#c3e8fb] px-4 sm:px-6 py-3.5 sm:py-4 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 bg-white border border-[#27a8ec] flex items-center justify-center text-[#0a74b5] font-bold text-base shadow-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#0d2433] flex flex-wrap items-center gap-2">
                  <span className="truncate">{displayName}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                      authUser
                        ? 'bg-[#16a34a] text-white'
                        : 'bg-[#0a74b5] text-white'
                    }`}
                  >
                    {authUser ? 'Email Signed In ✓' : 'Guest Preview'}
                  </span>
                </div>
                <div className="text-xs text-[#0d2433]/75 flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                  {authUser ? (
                    <span className="inline-flex items-center gap-1 break-all">
                      <Mail className="w-3 h-3 text-[#0a74b5] shrink-0" />
                      <span>{authUser.email}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#0a74b5] shrink-0" />
                      <span>0713833814</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#0a74b5] shrink-0" />
                    <span>Kiambu &amp; Nairobi Metro</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs self-start sm:self-center shrink-0">
              <span className="text-[#0d2433]/75 font-semibold">Cached Orders:</span>
              <span
                data-testid="profile-order-count-badge"
                className="px-2.5 py-1 bg-[#0d2433] text-white font-extrabold tabular-nums"
              >
                {orders.length}
              </span>
            </div>
          </div>

          <EmailSignInPanel
            authUser={authUser}
            onSignedIn={onSignedIn}
            onSignOut={onSignOut}
            heading="Sign in via email to link new orders"
            compact
          />
        </div>

        {reorderSuccessMsg && (
          <div className="bg-[#16a34a] text-white text-xs font-bold px-4 sm:px-6 py-2.5 flex items-center gap-2 animate-view-fade shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}

        {/* 'My Orders' Section */}
        <div className="px-4 py-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#0a74b5]" aria-hidden="true" />
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#0d2433]">
                My Orders ({orders.length})
              </h3>
            </div>
            {orders.length > 0 && (
              confirmingClear ? (
                <div className="inline-flex items-center gap-2 bg-[#fef2f2] border border-[#fecaca] px-2.5 py-1">
                  <span className="text-[11px] font-bold text-[#991b1b]">
                    Clear all cached orders?
                  </span>
                  <button
                    type="button"
                    data-testid="confirm-clear-history-btn"
                    onClick={handleConfirmClearHistory}
                    className="bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    type="button"
                    data-testid="cancel-clear-history-btn"
                    onClick={() => setConfirmingClear(false)}
                    className="bg-white border border-[#cbd5e1] text-[#0d2433] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="clear-history-btn"
                  onClick={() => setConfirmingClear(true)}
                  className="text-[11px] font-semibold text-[#0d2433]/65 hover:text-[#991b1b] inline-flex items-center gap-1 px-2 py-1 border border-transparent hover:border-[#fecaca] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#eef8fe]/40 border border-[#c3e8fb] space-y-3">
              <div className="w-12 h-12 mx-auto bg-white border border-[#c3e8fb] flex items-center justify-center text-[#0a74b5]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#0d2433]">
                No cached orders yet
              </h4>
              <p className="text-xs text-[#0d2433]/70 max-w-sm mx-auto">
                Once you place orders for fresh Relish yoghurts or Limuru Fresh milk,
                they will be saved here in your profile for easy tracking and 1-click re-ordering.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoShop();
                }}
                className="btn-shine inline-flex items-center justify-center bg-[#0a74b5] hover:bg-[#0d2433] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4" data-testid="orders-scrollable-list">
              {orders.map((order) => {
                const totalUnits = order.items.reduce(
                  (sum, i) => sum + i.quantity,
                  0
                );
                return (
                  <article
                    key={order.orderNumber}
                    data-testid={`order-card-${order.orderNumber}`}
                    className="border border-[#c3e8fb] bg-white p-5 space-y-3.5 shadow-sm hover:border-[#0a74b5] transition-colors"
                  >
                    {/* Order Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef8fe] pb-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#0a74b5]">
                          Order Reference
                        </div>
                        <div className="text-sm font-black text-[#0d2433] tabular-nums">
                          #{order.orderNumber}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${
                            order.status === 'delivered'
                              ? 'bg-[#16a34a]/15 text-[#15803d] border border-[#16a34a]/30'
                              : order.status === 'dispatched'
                                ? 'bg-[#0a74b5]/15 text-[#0a74b5] border border-[#0a74b5]/30'
                                : 'bg-[#eef8fe] text-[#0d2433] border border-[#c3e8fb]'
                          }`}
                        >
                          {order.status === 'delivered'
                            ? 'Delivered ✓'
                            : order.status === 'dispatched'
                              ? 'Out for Delivery'
                              : 'Order Confirmed'}
                        </span>
                        <div className="text-right text-[11px] text-[#0d2433]/60 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#0a74b5]" />
                          <span>{order.placedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Route & Window info */}
                    <div className="bg-[#eef8fe]/60 p-2.5 text-xs text-[#0d2433]/85 flex flex-wrap items-center justify-between gap-2 border border-[#dff1fb]">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#0a74b5]" />
                        <span>
                          <strong>Route:</strong> {order.deliveryZoneLabel ?? 'Kiambu & Nairobi'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#0a74b5] font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {order.deliveryWindowLabel ?? 'Morning Route (8:00 AM – 11:30 AM)'}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 text-xs">
                      {order.items.map((item, idx) => {
                        const trayCount = getTrayPieceCount(item.size);
                        const isFullTray =
                          trayCount !== null && item.quantity >= trayCount;
                        const fullTrays =
                          trayCount !== null ? Math.floor(item.quantity / trayCount) : 0;
                        const remainder =
                          trayCount !== null ? item.quantity % trayCount : 0;

                        return (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-[#f3f9fd] last:border-0"
                          >
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-[#0d2433]">
                                {item.name}
                              </span>
                              <span className="text-[#0a74b5] font-bold">
                                ({item.size})
                              </span>
                              {isFullTray && (
                                <span className="text-[10px] bg-[#dff1fb] text-[#0a74b5] font-bold px-1.5 py-0.5 border border-[#8fd5f7]">
                                  {fullTrays} Tray{fullTrays > 1 ? 's' : ''} ({trayCount} pcs/tray)
                                  {remainder > 0 ? ` + ${remainder} pcs` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-auto shrink-0">
                              <span className="tabular-nums text-[#0d2433]/70 font-medium">
                                × {item.quantity}
                              </span>
                              <span className="font-bold tabular-nums text-[#0d2433] min-w-[68px] text-right">
                                KES {item.lineTotalKes}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary row & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#c3e8fb]">
                      <div className="text-xs text-[#0d2433]">
                        <span className="text-[#0d2433]/70">
                          {totalUnits} items · Delivery:{' '}
                          {order.deliveryFeeKes === 0 ? 'FREE' : `KES ${order.deliveryFeeKes}`}
                          {' · '}
                        </span>
                        <strong className="text-sm font-extrabold tabular-nums">
                          Total: KES {order.totalKes}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReorderOrder(order)}
                        data-testid={`reorder-btn-${order.orderNumber}`}
                        className="btn-shine inline-flex items-center justify-center gap-1.5 bg-[#0d2433] hover:bg-[#0a74b5] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Re-order Items</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        </div>

        {/* Footer */}
        <div className="bg-[#eef8fe] px-4 sm:px-6 py-3 border-t border-[#c3e8fb] flex items-center justify-between gap-3 text-xs text-[#0d2433]/75 shrink-0">
          <span className="truncate">Fresh highland dairy sourced directly from 11,850 smallholder farmers.</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#0a74b5] hover:text-[#0d2433] cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
