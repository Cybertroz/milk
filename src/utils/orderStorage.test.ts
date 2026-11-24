import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_PAST_ORDERS,
  getStoredOrderHistory,
  saveOrderToHistory,
  clearOrderHistory,
  ORDER_HISTORY_STORAGE_KEY,
} from './orderStorage.ts';
import type { OrderReceipt } from '../types/dairy.ts';

// Mock localStorage for node environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

test('getStoredOrderHistory seeds realistic orders when cache is empty', () => {
  const mockStorage = new MockLocalStorage();
  // @ts-expect-error test mock
  globalThis.window = { localStorage: mockStorage };

  const orders = getStoredOrderHistory();
  assert.equal(orders.length, SEED_PAST_ORDERS.length);
  assert.equal(orders[0].orderNumber, SEED_PAST_ORDERS[0].orderNumber);
});

test('saveOrderToHistory prepends new order and avoids duplicates', () => {
  const mockStorage = new MockLocalStorage();
  // @ts-expect-error test mock
  globalThis.window = { localStorage: mockStorage };

  const newOrder: OrderReceipt = {
    orderNumber: 'LDF-99990001',
    customerName: 'Juma Mwangi',
    phone: '0712345678',
    address: 'Limuru Town, Market Lane',
    deliveryZoneId: 'limuru-tigoni',
    deliveryZoneLabel: 'Limuru & Tigoni',
    deliveryWindowId: 'evening',
    deliveryWindowLabel: 'Evening Express (5:00 PM – 7:30 PM)',
    status: 'confirmed',
    estimatedDelivery: 'Evening Express',
    paymentMethod: 'mpesa',
    items: [
      {
        name: 'Relish Strawberry Yoghurt',
        size: '500ml',
        quantity: 6,
        lineTotalKes: 540,
      },
    ],
    subtotalKes: 540,
    deliveryFeeKes: 150,
    totalKes: 690,
    placedAt: 'Nov 22, 2024, 4:00 PM',
  };

  const updated = saveOrderToHistory(newOrder);
  assert.equal(updated[0].orderNumber, 'LDF-99990001');
  assert.equal(updated[0].status, 'confirmed');

  // Saving again with same orderNumber should update it without creating a duplicate
  const updatedAgain = saveOrderToHistory({ ...newOrder, status: 'dispatched' });
  const matches = updatedAgain.filter((o) => o.orderNumber === 'LDF-99990001');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].status, 'dispatched');
});

test('clearOrderHistory empties the cached orders', () => {
  const mockStorage = new MockLocalStorage();
  // @ts-expect-error test mock
  globalThis.window = { localStorage: mockStorage };

  clearOrderHistory();
  const raw = mockStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
  assert.equal(raw, '[]');
});
