export type FlavourKey =
  | 'all'
  | 'strawberry'
  | 'vanilla'
  | 'lemon-biscuit'
  | 'passion'
  | 'long-life-milk';

export type SizeLabel =
  | '100ml'
  | '150ml'
  | '250ml'
  | '500ml'
  | '1L'
  | '2L'
  | '3L'
  | '5L';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export type PageRoute =
  | 'home'
  | 'about'
  | 'shop'
  | 'farmer-services'
  | 'certifications'
  | 'gallery'
  | 'media';

export type DeliveryZoneId =
  | 'limuru-tigoni'
  | 'kiambu-ruaka'
  | 'nairobi-cbd-westlands'
  | 'thika-juja';

export interface DeliveryZone {
  id: DeliveryZoneId;
  label: string;
  region: string;
  feeKes: number;
  freeOverKes: number;
  eta: string;
}

export type DeliveryWindowId = 'morning' | 'afternoon' | 'evening';

export interface DeliveryWindowOption {
  id: DeliveryWindowId;
  label: string;
  timeRange: string;
  description: string;
  etaBadge: string;
}

export interface ProductNutritionStorage {
  servingBasis: string;
  energyKcal: number;
  proteinG: string;
  carbsG: string;
  fatG: string;
  calciumMg: number;
  shelfLife: string;
  storageTemp: string;
  storageCare: string;
  ingredients: string;
  certifications: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: 'Relish' | 'Limuru Fresh';
  flavour: Exclude<FlavourKey, 'all'>;
  flavourLabel: string;
  size: SizeLabel;
  litres: number;
  priceKes: number;
  image: string;
  description: string;
  showcaseOrder?: number;
  glowColor?: string;
}

export interface WholesalePack {
  id: string;
  productId: string;
  name: string;
  packLabel: string;
  unitsPerCrate: number;
  retailTotalKes: number;
  wholesalePriceKes: number;
  savingsKes: number;
  savingsPct: number;
  minCrates: number;
  image: string;
  brand: 'Relish' | 'Limuru Fresh';
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface AuthUser {
  email: string;
  displayName: string;
  signedInAt: string;
  verified: boolean;
}

export interface CheckoutFormData {
  fullName: string;
  email?: string;
  phone: string;
  address: string;
  paymentMethod: 'mpesa' | 'cash';
  deliveryZoneId?: DeliveryZoneId;
  deliveryWindowId?: DeliveryWindowId;
}

export interface OrderReceipt {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  address: string;
  deliveryZoneId?: DeliveryZoneId;
  deliveryZoneLabel?: string;
  deliveryWindowId?: DeliveryWindowId;
  deliveryWindowLabel?: string;
  status?: 'confirmed' | 'packing' | 'dispatched' | 'delivered';
  estimatedDelivery?: string;
  paymentMethod: 'mpesa' | 'cash';
  items: Array<{
    name: string;
    size: SizeLabel;
    quantity: number;
    lineTotalKes: number;
  }>;
  subtotalKes: number;
  deliveryFeeKes: number;
  totalKes: number;
  placedAt: string;
  persisted?: boolean;
}

export interface BulkQuoteLineInput {
  packId: string;
  crates: number;
}

export interface BulkQuoteRequest {
  organizationName: string;
  contactName: string;
  phone: string;
  deliveryZoneId: DeliveryZoneId;
  notes?: string;
  items: BulkQuoteLineInput[];
}

export interface BulkQuoteReceipt {
  quoteNumber: string;
  organizationName: string;
  contactName: string;
  phone: string;
  deliveryZoneId: DeliveryZoneId;
  deliveryZoneLabel: string;
  estimatedDelivery: string;
  items: Array<{
    packId: string;
    packName: string;
    packLabel: string;
    crates: number;
    unitCrateKes: number;
    lineTotalKes: number;
  }>;
  retailEquivalentKes: number;
  estimatedTotalKes: number;
  totalSavingsKes: number;
  notes: string;
  createdAt: string;
}

export interface QuizAnswers {
  mood: 'fruity' | 'classic' | 'indulgent' | 'everyday' | null;
  quantity: 'single' | 'medium' | 'family' | null;
}
