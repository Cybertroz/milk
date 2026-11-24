import type { OrderReceipt } from '../types/dairy.ts';

export const ORDER_HISTORY_STORAGE_KEY = 'limuru_orders_cache_v1';

export const SEED_PAST_ORDERS: OrderReceipt[] = [
  {
    orderNumber: 'LDF-84291045',
    customerName: 'Wanjiku Kamau',
    phone: '0713833814',
    address: 'Ridgeways Estate, House 4B, Kiambu Road',
    deliveryZoneId: 'kiambu-ruaka',
    deliveryZoneLabel: 'Kiambu Town, Ruaka & Kikuyu',
    deliveryWindowId: 'morning',
    deliveryWindowLabel: 'Morning Route (8:00 AM – 11:30 AM)',
    status: 'delivered',
    estimatedDelivery: 'Delivered · Morning Cold-Chain Route',
    paymentMethod: 'mpesa',
    items: [
      {
        name: 'Relish Strawberry Yoghurt',
        size: '500ml',
        quantity: 6, // 1 Full Tray
        lineTotalKes: 540,
      },
      {
        name: 'Limuru Fresh Long Life Milk',
        size: '500ml',
        quantity: 6, // 1 Full Tray
        lineTotalKes: 420,
      },
      {
        name: 'Relish Vanilla Yoghurt',
        size: '1L',
        quantity: 2,
        lineTotalKes: 340,
      },
    ],
    subtotalKes: 1300,
    deliveryFeeKes: 200,
    totalKes: 1500,
    placedAt: 'Nov 18, 2024, 9:15 AM',
    persisted: true,
  },
  {
    orderNumber: 'LDF-69204112',
    customerName: 'Wanjiku Kamau',
    phone: '0713833814',
    address: 'Riverside Drive, Nairobi',
    deliveryZoneId: 'nairobi-cbd-westlands',
    deliveryZoneLabel: 'Westlands, Kilimani & Nairobi CBD',
    deliveryWindowId: 'afternoon',
    deliveryWindowLabel: 'Afternoon Route (1:00 PM – 4:30 PM)',
    status: 'delivered',
    estimatedDelivery: 'Delivered · Refrigerated Express Van',
    paymentMethod: 'mpesa',
    items: [
      {
        name: 'Relish Vanilla Yoghurt',
        size: '250ml',
        quantity: 12, // 1 Full Tray (12 pcs)
        lineTotalKes: 600,
      },
      {
        name: 'Relish Lemon Biscuit Yoghurt',
        size: '500ml',
        quantity: 6, // 1 Full Tray (6 pcs)
        lineTotalKes: 540,
      },
      {
        name: 'Relish Passion Yoghurt',
        size: '500ml',
        quantity: 6, // 1 Full Tray (6 pcs)
        lineTotalKes: 540,
      },
    ],
    subtotalKes: 1680,
    deliveryFeeKes: 0, // Unlocked free delivery > 1500
    totalKes: 1680,
    placedAt: 'Nov 10, 2024, 2:30 PM',
    persisted: true,
  },
];

export function getStoredOrderHistory(): OrderReceipt[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return SEED_PAST_ORDERS;
  }

  try {
    const raw = window.localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic past orders so the user can immediately experience "My Orders"
      window.localStorage.setItem(
        ORDER_HISTORY_STORAGE_KEY,
        JSON.stringify(SEED_PAST_ORDERS)
      );
      return SEED_PAST_ORDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch {
    return SEED_PAST_ORDERS;
  }
}

export function saveOrderToHistory(order: OrderReceipt): OrderReceipt[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [order];
  }

  try {
    const existing = getStoredOrderHistory();
    const filtered = existing.filter((o) => o.orderNumber !== order.orderNumber);
    const updated = [order, ...filtered].slice(0, 50);
    window.localStorage.setItem(
      ORDER_HISTORY_STORAGE_KEY,
      JSON.stringify(updated)
    );
    return updated;
  } catch {
    return [order];
  }
}

export function clearOrderHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify([]));
  } catch {
    // Ignore storage quota errors
  }
}
