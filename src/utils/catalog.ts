import type {
  BulkQuoteLineInput,
  BulkQuoteRequest,
  CartItem,
  CheckoutFormData,
  DeliveryWindowId,
  DeliveryWindowOption,
  DeliveryZone,
  DeliveryZoneId,
  FlavourKey,
  OrderReceipt,
  Product,
  ProductNutritionStorage,
  QuizAnswers,
  SizeLabel,
  SortOption,
  WholesalePack,
} from '../types/dairy.ts';
import {
  normalizeKenyanPhone,
  sanitizeAndValidateEmail,
  sanitizeTextInput,
} from './security.ts';

export const FREE_DELIVERY_THRESHOLD_KES = 1500;
export const STANDARD_DELIVERY_FEE_KES = 200;
export const WHATSAPP_NUMBER_E164 = '254713833814';

export const UPLOADED_ASSETS = {
  logo: '/assets/aistudio/LIMURU_FRESH_LOGO__2__-_Copy_726569a9.png',
  strawberry100: '/assets/aistudio/150-removebg-preview__1__d91627ef.png',
  strawberry150: '/assets/aistudio/150-removebg-preview__1__d91627ef.png',
  strawberry250: '/assets/aistudio/250_straw-removebg-preview__1__1cee3171.png',
  strawberry500: '/assets/aistudio/500_straw-removebg-preview__1__9f36e748.png',
  strawberry1L: '/assets/aistudio/1litre_s-removebg-preview__2__ca6944ba.png',
  strawberry2L: '/assets/aistudio/2litre-removebg-preview__1__5e0b4ed9.png',
  vanilla100: '/assets/aistudio/150-removebg-preview__1__d91627ef.png',
  vanilla150: '/assets/aistudio/150-removebg-preview__1__d91627ef.png',
  vanilla250: '/assets/aistudio/250-removebg-preview_f9a7124d.png',
  vanilla500: '/assets/aistudio/500-removebg-preview__5__bfe74132.png',
  vanilla2L: '/assets/aistudio/IMG_5021-removebg-preview__1__3ac120c3.png',
  vanilla3L: '/assets/aistudio/IMG_5029-removebg-preview__1___1__7ac7d5e9.png',
  vanilla5L: '/assets/aistudio/5litre-removebg-preview__1__8281a889.png',
  lemonBiscuit500: '/assets/aistudio/lemon_design_b_0ba95b62.png',
  passion500: '/assets/aistudio/passion_design_b_4ff26a5f.png',
  longLifeMilk500: '/assets/aistudio/maziwa-1__2_-removebg-preview__5__ef5427d8.png',
  lalaPlain1L: '/assets/aistudio/1ltr-removebg-preview__2__-_Copy_df92a049.png',
  limdaFeeds: '/assets/aistudio/limda_group-removebg-preview__2__-_Copy_b1e2a916.png',
  milkCartons: '/assets/aistudio/milk_cartons_f9659651.jpeg',
  managerPortrait: '/assets/aistudio/IMG_8883_4b8bedb4.jpg',
  collectionCentre: '/assets/aistudio/_MG_9703_8fc03d2e.JPG',
  plantEquipment: '/assets/aistudio/IMG_5759_37aab0de.JPG',
  plantInspection: '/assets/aistudio/IMG_8980_58a394cd.jpg',
  ushirikaGroup: '/assets/aistudio/IMG_9045_2e1e054e.jpg',
  delegationSigning: '/assets/aistudio/IMG_8924_f52553d9.jpg',
  leadershipHandshake: '/assets/aistudio/IMG_8904_086f8e12.jpg',
  gardenHandshake: '/assets/aistudio/IMG_8909_b50584ef.jpg',
  stageHandshake: '/assets/aistudio/IMG_8104_c231dfd9.jpg',
  tastingRoom: '/assets/aistudio/IMG_8003_9838f803.jpg',
  podiumAddress: '/assets/aistudio/IMG_8113_8a54a225.jpg',
  stageWelcome: '/assets/aistudio/IMG_8106_dd212b3b.jpg',
  treePlanting: '/assets/aistudio/_DSC1622_2d268ac1.JPG',
  treeWatering: '/assets/aistudio/_DSC1625_b3b69202.JPG',
  hygienePrep: '/assets/aistudio/_DSC1634_a8af3e20.JPG',
  plantTanks: '/assets/aistudio/_DSC1663_662fa75b.JPG',
  plantDriveway: '/assets/aistudio/IMG_6293_7a029c5c.JPG',
  yardBriefing: '/assets/aistudio/IMG_6303_489ddcb8.JPG',
  plantPiping: '/assets/aistudio/IMG_6314_059ee2dd.JPG',
  plantValves: '/assets/aistudio/IMG_6325_5237ff89.JPG',
  maziwaFleet: '/assets/aistudio/IMG_6295_27a85e44.JPG',
  centreVisit: '/assets/aistudio/IMG_7781__2__1f70f768.JPG',
  digitalScale: '/assets/aistudio/IMG_7815__2__66751618.JPG',
  intakeBriefing: '/assets/aistudio/IMG_7832_f32eaf76.JPG',
  hqBanner: '/assets/aistudio/IMG_7773_2424efcb.JPG',
  csrCraftArtisans: '/assets/aistudio/IMG_0428__2__e7f6b55c.JPG',
  csrBeadedHandbag: '/assets/aistudio/IMG_0433__2__64b262cd.JPG',
  csrYoghurtSharing: '/assets/aistudio/IMG_0496_bd6e1da1.JPG',
  csrFoodBriefing: '/assets/aistudio/IMG_0505_1e6fb00e.JPG',
  csrChildrenGroup: '/assets/aistudio/IMG_0455_c747daf8.JPG',
  csrChildRelishCup: '/assets/aistudio/IMG_0472_590e4c9e.JPG',
  csrHostFellowship: '/assets/aistudio/IMG_0408__2__4b74aca0.JPG',
  csrCommunityMeal: '/assets/aistudio/IMG_0419_7e68ca6e.JPG',
  csrIndoorGathering: '/assets/aistudio/IMG_0409_d1493bb1.JPG',
  csrCrateHandover: '/assets/aistudio/IMG_0509__2__49c79c68.JPG',
  csrCompoundPortrait: '/assets/aistudio/IMG_0389_4e8dfba6.JPG',
  csrCelebrationGroup: '/assets/aistudio/IMG_0398_1317e502.JPG',
  eslArt: '/assets/aistudio/esl_art_8d78dfe3.png',
  scrollingVet: '/assets/aistudio/Scrolling_Vet_-_Copy_0deeb412.jpg',
  coolingCentre: '/assets/aistudio/IMG_4751_6b954f0d.jpg',
  vetExtension: '/assets/aistudio/IMG_7707__2__26f52958.jpg',
  plantProductTeam: '/assets/aistudio/IMG_5958_7709b32c.JPG',
  plantYardTour: '/assets/aistudio/edit_21_017b5c23.JPG',
  maziwaHouse: '/assets/aistudio/Maziwa_hse_555665bd.jpeg',
  plantReception: '/assets/aistudio/DSC_0127_fbb33261.jpg',
} as const;

export const PRODUCT_IMAGES = {
  strawberry: UPLOADED_ASSETS.strawberry500,
  vanilla: UPLOADED_ASSETS.vanilla500,
  lemonBiscuit: UPLOADED_ASSETS.lemonBiscuit500,
  passion: UPLOADED_ASSETS.passion500,
  longLifeMilk: UPLOADED_ASSETS.longLifeMilk500,
} as const;

export const PRODUCTS: Product[] = [
  // Hero 5 showcase 500ml items
  {
    id: 'strawberry-500ml',
    name: 'Relish Strawberry Yoghurt',
    brand: 'Relish',
    flavour: 'strawberry',
    flavourLabel: 'Strawberry',
    size: '500ml',
    litres: 0.5,
    priceKes: 90,
    image: UPLOADED_ASSETS.strawberry500,
    description: 'Velvety highland yoghurt blended with sun-ripened strawberry puree.',
    showcaseOrder: 1,
    glowColor: 'rgba(236, 72, 153, 0.28)',
  },
  {
    id: 'vanilla-500ml',
    name: 'Relish Vanilla Yoghurt',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '500ml',
    litres: 0.5,
    priceKes: 90,
    image: UPLOADED_ASSETS.vanilla500,
    description: 'Smooth cultured dairy yoghurt infused with fragrant natural vanilla.',
    showcaseOrder: 2,
    glowColor: 'rgba(39, 168, 236, 0.30)',
  },
  {
    id: 'lemon-biscuit-500ml',
    name: 'Relish Lemon Biscuit Yoghurt',
    brand: 'Relish',
    flavour: 'lemon-biscuit',
    flavourLabel: 'Lemon Biscuit',
    size: '500ml',
    litres: 0.5,
    priceKes: 90,
    image: UPLOADED_ASSETS.lemonBiscuit500,
    description: 'Zesty lemon yoghurt balanced with subtle golden biscuit notes.',
    showcaseOrder: 3,
    glowColor: 'rgba(34, 197, 94, 0.25)',
  },
  {
    id: 'passion-500ml',
    name: 'Relish Passion Yoghurt',
    brand: 'Relish',
    flavour: 'passion',
    flavourLabel: 'Passion',
    size: '500ml',
    litres: 0.5,
    priceKes: 90,
    image: UPLOADED_ASSETS.passion500,
    description: 'Creamy cultured yoghurt swirled with tangy Kenyan passion fruit.',
    showcaseOrder: 4,
    glowColor: 'rgba(147, 51, 234, 0.25)',
  },
  {
    id: 'long-life-milk-500ml',
    name: 'Limuru Fresh Long Life Milk',
    brand: 'Limuru Fresh',
    flavour: 'long-life-milk',
    flavourLabel: 'Long Life Milk',
    size: '500ml',
    litres: 0.5,
    priceKes: 70,
    image: UPLOADED_ASSETS.longLifeMilk500,
    description: 'Pure homogenized 90-day UHT milk straight from Limuru highlands.',
    showcaseOrder: 5,
    glowColor: 'rgba(10, 116, 181, 0.32)',
  },
  // Remaining Strawberry sizes
  {
    id: 'strawberry-100ml',
    name: 'Relish Strawberry Mini Cup',
    brand: 'Relish',
    flavour: 'strawberry',
    flavourLabel: 'Strawberry',
    size: '100ml',
    litres: 0.1,
    priceKes: 20,
    image: UPLOADED_ASSETS.strawberry100,
    description: 'Snack-sized 100ml strawberry cup ideal for school lunchboxes.',
  },
  {
    id: 'strawberry-150ml',
    name: 'Relish Strawberry Cup',
    brand: 'Relish',
    flavour: 'strawberry',
    flavourLabel: 'Strawberry',
    size: '150ml',
    litres: 0.15,
    priceKes: 35,
    image: UPLOADED_ASSETS.strawberry150,
    description: 'Single-serve 150ml strawberry yoghurt cup with live cultures.',
  },
  {
    id: 'strawberry-250ml',
    name: 'Relish Strawberry Yoghurt',
    brand: 'Relish',
    flavour: 'strawberry',
    flavourLabel: 'Strawberry',
    size: '250ml',
    litres: 0.25,
    priceKes: 50,
    image: UPLOADED_ASSETS.strawberry250,
    description: 'Handy 250ml cup for chilled refreshment on the go.',
  },
  {
    id: 'strawberry-1l',
    name: 'Relish Strawberry Yoghurt',
    brand: 'Relish',
    flavour: 'strawberry',
    flavourLabel: 'Strawberry',
    size: '1L',
    litres: 1.0,
    priceKes: 170,
    image: UPLOADED_ASSETS.strawberry1L,
    description: 'Table-ready 1-litre family bottle of smooth strawberry yoghurt.',
  },
  {
    id: 'strawberry-2l',
    name: 'Relish Strawberry Yoghurt',
    brand: 'Relish',
    flavour: 'strawberry',
    flavourLabel: 'Strawberry',
    size: '2L',
    litres: 2.0,
    priceKes: 320,
    image: UPLOADED_ASSETS.strawberry2L,
    description: 'Generous 2-litre sharing bottle for breakfasts and parfaits.',
  },
  // Remaining Vanilla sizes: 100ml, 150ml cup, 250ml, 2L, 3L, 5L
  {
    id: 'vanilla-100ml',
    name: 'Relish Vanilla Mini Cup',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '100ml',
    litres: 0.1,
    priceKes: 20,
    image: UPLOADED_ASSETS.vanilla100,
    description: 'Kid-friendly 100ml vanilla yoghurt cup packed with calcium.',
  },
  {
    id: 'vanilla-150ml',
    name: 'Relish Vanilla Cup',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '150ml',
    litres: 0.15,
    priceKes: 35,
    image: UPLOADED_ASSETS.vanilla150,
    description: 'Classic 150ml single-serve cup of creamy vanilla yoghurt.',
  },
  {
    id: 'vanilla-250ml',
    name: 'Relish Vanilla Yoghurt',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '250ml',
    litres: 0.25,
    priceKes: 50,
    image: UPLOADED_ASSETS.vanilla250,
    description: 'Refreshing 250ml vanilla yoghurt cup for mid-morning breaks.',
  },
  {
    id: 'vanilla-2l',
    name: 'Relish Vanilla Yoghurt',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '2L',
    litres: 2.0,
    priceKes: 320,
    image: UPLOADED_ASSETS.vanilla2L,
    description: 'Family 2-litre bottle ideal for smoothies, granola, and baking.',
  },
  {
    id: 'vanilla-3l',
    name: 'Relish Vanilla Yoghurt',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '3L',
    litres: 3.0,
    priceKes: 470,
    image: UPLOADED_ASSETS.vanilla3L,
    description: 'High-value 3-litre jerrycan crafted for large households and hospitality.',
  },
  {
    id: 'vanilla-5l',
    name: 'Relish Vanilla Yoghurt',
    brand: 'Relish',
    flavour: 'vanilla',
    flavourLabel: 'Vanilla',
    size: '5L',
    litres: 5.0,
    priceKes: 850,
    image: UPLOADED_ASSETS.vanilla5L,
    description: 'Bulk 5-litre catering pack for events, schools, and kitchens.',
  },
];

export const SHOWCASE_PRODUCTS: Product[] = PRODUCTS.filter(
  (p) => p.showcaseOrder !== undefined
).sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0));

export const FLAVOUR_TABS: Array<{ key: FlavourKey; label: string }> = [
  { key: 'all', label: 'All Products' },
  { key: 'strawberry', label: 'Strawberry' },
  { key: 'vanilla', label: 'Vanilla' },
  { key: 'lemon-biscuit', label: 'Lemon Biscuit' },
  { key: 'passion', label: 'Passion' },
  { key: 'long-life-milk', label: 'Long Life Milk' },
];

export const SIZE_FILTERS: Array<'all' | SizeLabel> = [
  'all',
  '100ml',
  '150ml',
  '250ml',
  '500ml',
  '1L',
  '2L',
  '3L',
  '5L',
];

export function getPricePerLitre(product: Product): number {
  if (product.litres <= 0) return product.priceKes;
  return Math.round((product.priceKes / product.litres) * 100) / 100;
}

export function getCheapestPerLitreIds(items: Product[]): Set<string> {
  if (items.length === 0) return new Set();
  const minPricePerLitre = Math.min(...items.map(getPricePerLitre));
  return new Set(
    items
      .filter((item) => Math.abs(getPricePerLitre(item) - minPricePerLitre) < 0.01)
      .map((item) => item.id)
  );
}

export function filterAndSortProducts(
  items: Product[],
  options: {
    flavour: FlavourKey;
    size: 'all' | SizeLabel;
    search: string;
    sort: SortOption;
  }
): Product[] {
  const query = options.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (options.flavour !== 'all' && item.flavour !== options.flavour) {
      return false;
    }
    if (options.size !== 'all' && item.size !== options.size) {
      return false;
    }
    if (query) {
      const haystack = `${item.name} ${item.flavourLabel} ${item.size} ${item.description}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  switch (options.sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.priceKes - b.priceKes || a.litres - b.litres);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.priceKes - a.priceKes || b.litres - a.litres);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name) || a.litres - b.litres);
      break;
    case 'featured':
    default:
      break;
  }

  return sorted;
}

export function getSiblingSizesForProduct(product: Product): Product[] {
  return PRODUCTS.filter((p) => p.flavour === product.flavour).sort(
    (a, b) => a.litres - b.litres
  );
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'limuru-tigoni',
    label: 'Limuru Town, Tigoni & Uplands',
    region: 'Limuru Highlands',
    feeKes: 150,
    freeOverKes: FREE_DELIVERY_THRESHOLD_KES,
    eta: 'Same-day chilled van (2–4 hrs)',
  },
  {
    id: 'kiambu-ruaka',
    label: 'Kiambu Town, Ruaka & Kikuyu',
    region: 'Kiambu County',
    feeKes: 200,
    freeOverKes: FREE_DELIVERY_THRESHOLD_KES,
    eta: 'Same-day afternoon route',
  },
  {
    id: 'nairobi-cbd-westlands',
    label: 'Westlands, Kilimani & Nairobi CBD',
    region: 'Nairobi Metro',
    feeKes: 250,
    freeOverKes: FREE_DELIVERY_THRESHOLD_KES,
    eta: 'Daily refrigerated dispatch',
  },
  {
    id: 'thika-juja',
    label: 'Thika Road, Ruiru & Juja',
    region: 'Kiambu East',
    feeKes: 250,
    freeOverKes: FREE_DELIVERY_THRESHOLD_KES,
    eta: 'Next-morning cold-chain route',
  },
];

export function getDeliveryZoneById(zoneId?: DeliveryZoneId): DeliveryZone {
  return (
    DELIVERY_ZONES.find((zone) => zone.id === zoneId) ?? {
      id: 'kiambu-ruaka',
      label: 'Kiambu Town, Ruaka & Kikuyu',
      region: 'Kiambu County',
      feeKes: STANDARD_DELIVERY_FEE_KES,
      freeOverKes: FREE_DELIVERY_THRESHOLD_KES,
      eta: 'Same-day afternoon route',
    }
  );
}

/**
 * Returns tray packaging unit count if applicable for the SKU size:
 * 500ml SKUs: 1 tray = 6 pieces
 * 250ml SKUs: 1 tray = 12 pieces
 * 100ml SKUs: 1 tray = 24 pieces
 */
export function getTrayPieceCount(size: SizeLabel): number | null {
  if (size === '500ml') return 6;
  if (size === '250ml') return 12;
  if (size === '100ml') return 24;
  return null;
}

export interface TrayProgressHint {
  traySize: number;
  fullTrays: number;
  remainder: number;
  itemsToCompleteTray: number;
  nextTrayTarget: number;
  isExactFullTray: boolean;
  hintText: string;
}

export function getTrayProgressHint(
  size: SizeLabel,
  quantity: number
): TrayProgressHint | null {
  const traySize = getTrayPieceCount(size);
  const safeQty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (traySize === null || safeQty <= 0) return null;

  const fullTrays = Math.floor(safeQty / traySize);
  const remainder = safeQty % traySize;
  const isExactFullTray = remainder === 0;
  const itemsToCompleteTray = isExactFullTray ? 0 : traySize - remainder;
  const nextTrayTarget = fullTrays * traySize + (isExactFullTray ? 0 : traySize);
  const targetTrayNumber = fullTrays + 1;

  const hintText = isExactFullTray
    ? `Tray-friendly! ${fullTrays} full tray${fullTrays > 1 ? 's' : ''} (${safeQty} pcs)`
    : `Tray-friendly tip: Add ${itemsToCompleteTray} more ${
        itemsToCompleteTray === 1 ? 'pc' : 'pcs'
      } to complete ${
        targetTrayNumber === 1 ? 'a full tray' : `tray #${targetTrayNumber}`
      } (${nextTrayTarget} pcs)`;

  return {
    traySize,
    fullTrays,
    remainder,
    itemsToCompleteTray,
    nextTrayTarget,
    isExactFullTray,
    hintText,
  };
}

export const DELIVERY_WINDOWS: DeliveryWindowOption[] = [
  {
    id: 'morning',
    label: 'Morning Route',
    timeRange: '8:00 AM – 11:30 AM',
    description: 'Fresh sunrise cold-chain dispatch from Limuru dairy plant',
    etaBadge: 'Expected Arrival: 8:00 AM – 11:30 AM',
  },
  {
    id: 'afternoon',
    label: 'Afternoon Route',
    timeRange: '1:00 PM – 4:30 PM',
    description: 'Refrigerated transit for home estates & institutional deliveries',
    etaBadge: 'Expected Arrival: 1:00 PM – 4:30 PM',
  },
  {
    id: 'evening',
    label: 'Evening Express',
    timeRange: '5:00 PM – 7:30 PM',
    description: 'Direct estate cold drop before evening dinner & tea',
    etaBadge: 'Expected Arrival: 5:00 PM – 7:30 PM',
  },
];

export function getDeliveryWindowById(windowId?: DeliveryWindowId): DeliveryWindowOption {
  return (
    DELIVERY_WINDOWS.find((w) => w.id === windowId) ?? DELIVERY_WINDOWS[0]
  );
}

export function calculateCartSummary(
  cart: CartItem[],
  deliveryZoneId?: DeliveryZoneId
) {
  const detailedItems = cart
    .map((entry) => {
      const product = PRODUCTS.find((p) => p.id === entry.productId);
      if (!product || entry.quantity <= 0) return null;
      return {
        product,
        quantity: entry.quantity,
        lineTotalKes: product.priceKes * entry.quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const zone = deliveryZoneId ? getDeliveryZoneById(deliveryZoneId) : null;
  const zoneFee = zone ? zone.feeKes : STANDARD_DELIVERY_FEE_KES;
  const thresholdKes = zone ? zone.freeOverKes : FREE_DELIVERY_THRESHOLD_KES;

  const itemCount = detailedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalKes = detailedItems.reduce((sum, item) => sum + item.lineTotalKes, 0);
  const qualifiesFreeDelivery = subtotalKes >= thresholdKes;
  const deliveryFeeKes =
    subtotalKes === 0 ? 0 : qualifiesFreeDelivery ? 0 : zoneFee;
  const remainingForFreeDeliveryKes = Math.max(0, thresholdKes - subtotalKes);
  const freeDeliveryProgressPct = Math.min(
    100,
    Math.round((subtotalKes / thresholdKes) * 100)
  );
  const totalKes = subtotalKes + deliveryFeeKes;

  return {
    detailedItems,
    itemCount,
    subtotalKes,
    qualifiesFreeDelivery,
    deliveryFeeKes,
    remainingForFreeDeliveryKes,
    freeDeliveryProgressPct,
    totalKes,
    deliveryZone: zone,
  };
}

export function getProductNutritionStorage(
  product: Product
): ProductNutritionStorage {
  const baseCertifications = [
    'KEBS Diamond Mark S#11894',
    'Kenya Dairy Board Licensed',
    '11,850 Limuru Farmers Co-op',
  ];

  if (product.flavour === 'long-life-milk') {
    return {
      servingBasis: 'Per 100ml serving',
      energyKcal: 64,
      proteinG: '3.3g',
      carbsG: '4.8g',
      fatG: '3.5g',
      calciumMg: 120,
      shelfLife: '90 days unopened',
      storageTemp: 'Ambient cool dry place (< 25°C)',
      storageCare:
        'No refrigeration required while sealed. Once opened, refrigerate below 4°C and consume within 3 days.',
      ingredients:
        '100% pure standardized, homogenized highland whole cow milk.',
      certifications: baseCertifications,
    };
  }

  const flavourNote: Record<Exclude<FlavourKey, 'all' | 'long-life-milk'>, string> = {
    strawberry: 'natural strawberry fruit puree, cane sugar, and live yoghurt cultures.',
    vanilla: 'natural vanilla extract, cane sugar, and live probiotic cultures.',
    'lemon-biscuit': 'zesty lemon-biscuit flavouring, cane sugar, and live yoghurt cultures.',
    passion: 'real Kenyan passion fruit preparation, cane sugar, and live yoghurt cultures.',
  };

  const nutritionStats: Record<
    Exclude<FlavourKey, 'all' | 'long-life-milk'>,
    { kcal: number; protein: string; carbs: string; fat: string; calcium: number }
  > = {
    strawberry: { kcal: 84, protein: '3.4g', carbs: '11.4g', fat: '2.8g', calcium: 118 },
    vanilla: { kcal: 82, protein: '3.5g', carbs: '10.8g', fat: '2.9g', calcium: 122 },
    'lemon-biscuit': { kcal: 89, protein: '3.3g', carbs: '12.2g', fat: '3.0g', calcium: 115 },
    passion: { kcal: 85, protein: '3.4g', carbs: '11.6g', fat: '2.8g', calcium: 118 },
  };

  const stats = nutritionStats[product.flavour];

  return {
    servingBasis: 'Per 100ml serving',
    energyKcal: stats.kcal,
    proteinG: stats.protein,
    carbsG: stats.carbs,
    fatG: stats.fat,
    calciumMg: stats.calcium,
    shelfLife: '14–21 days chilled',
    storageTemp: 'Keep refrigerated at 2°C – 6°C',
    storageCare:
      'Maintain continuous cold-chain below 6°C. Shake or stir gently before serving. Consume within 48 hours of opening.',
    ingredients: `Fresh pasteurized Limuru whole milk, milk solids, ${flavourNote[product.flavour]}`,
    certifications: [...baseCertifications, 'Live Probiotic Cultures'],
  };
}

export const WHOLESALE_PACKS: WholesalePack[] = [
  {
    id: 'crate-longlife-500x12',
    productId: 'long-life-milk-500ml',
    name: 'Limuru Fresh Long Life Milk',
    packLabel: '12 × 500ml Wholesale Carton',
    unitsPerCrate: 12,
    retailTotalKes: 840,
    wholesalePriceKes: 740,
    savingsKes: 100,
    savingsPct: 12,
    minCrates: 1,
    image: UPLOADED_ASSETS.milkCartons,
    brand: 'Limuru Fresh',
  },
  {
    id: 'crate-strawberry-500x12',
    productId: 'strawberry-500ml',
    name: 'Relish Strawberry Yoghurt',
    packLabel: '12 × 500ml Chilled Crate',
    unitsPerCrate: 12,
    retailTotalKes: 1080,
    wholesalePriceKes: 950,
    savingsKes: 130,
    savingsPct: 12,
    minCrates: 1,
    image: UPLOADED_ASSETS.strawberry500,
    brand: 'Relish',
  },
  {
    id: 'crate-vanilla-500x12',
    productId: 'vanilla-500ml',
    name: 'Relish Vanilla Yoghurt',
    packLabel: '12 × 500ml Chilled Crate',
    unitsPerCrate: 12,
    retailTotalKes: 1080,
    wholesalePriceKes: 950,
    savingsKes: 130,
    savingsPct: 12,
    minCrates: 1,
    image: UPLOADED_ASSETS.vanilla500,
    brand: 'Relish',
  },
  {
    id: 'crate-lemon-500x12',
    productId: 'lemon-biscuit-500ml',
    name: 'Relish Lemon Biscuit Yoghurt',
    packLabel: '12 × 500ml Chilled Crate',
    unitsPerCrate: 12,
    retailTotalKes: 1080,
    wholesalePriceKes: 960,
    savingsKes: 120,
    savingsPct: 11,
    minCrates: 1,
    image: UPLOADED_ASSETS.lemonBiscuit500,
    brand: 'Relish',
  },
  {
    id: 'crate-cups-150x24',
    productId: 'strawberry-150ml',
    name: 'School & Canteen 150ml Assorted',
    packLabel: '24 × 150ml School Tray',
    unitsPerCrate: 24,
    retailTotalKes: 840,
    wholesalePriceKes: 720,
    savingsKes: 120,
    savingsPct: 14,
    minCrates: 1,
    image: UPLOADED_ASSETS.strawberry150,
    brand: 'Relish',
  },
  {
    id: 'crate-vanilla-5lx4',
    productId: 'vanilla-5l',
    name: 'Relish Vanilla 5L Hospitality Pack',
    packLabel: '4 × 5L Catering Case (20L)',
    unitsPerCrate: 4,
    retailTotalKes: 3400,
    wholesalePriceKes: 2980,
    savingsKes: 420,
    savingsPct: 12,
    minCrates: 1,
    image: UPLOADED_ASSETS.vanilla5L,
    brand: 'Relish',
  },
];

export function calculateWholesaleQuoteEstimate(
  lines: BulkQuoteLineInput[],
  deliveryZoneId: DeliveryZoneId = 'limuru-tigoni'
) {
  const zone = getDeliveryZoneById(deliveryZoneId);
  const detailedLines = lines
    .map((line) => {
      const pack = WHOLESALE_PACKS.find((p) => p.id === line.packId);
      const crates = Math.floor(Number(line.crates) || 0);
      if (!pack || crates <= 0) return null;
      return {
        pack,
        crates,
        unitCount: pack.unitsPerCrate * crates,
        retailLineKes: pack.retailTotalKes * crates,
        lineTotalKes: pack.wholesalePriceKes * crates,
        savingsLineKes: pack.savingsKes * crates,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const totalCrates = detailedLines.reduce((sum, item) => sum + item.crates, 0);
  const totalUnits = detailedLines.reduce((sum, item) => sum + item.unitCount, 0);
  const retailEquivalentKes = detailedLines.reduce(
    (sum, item) => sum + item.retailLineKes,
    0
  );
  const estimatedTotalKes = detailedLines.reduce(
    (sum, item) => sum + item.lineTotalKes,
    0
  );
  const totalSavingsKes = retailEquivalentKes - estimatedTotalKes;
  const averageDiscountPct =
    retailEquivalentKes > 0
      ? Math.round((totalSavingsKes / retailEquivalentKes) * 100)
      : 0;

  return {
    detailedLines,
    totalCrates,
    totalUnits,
    retailEquivalentKes,
    estimatedTotalKes,
    totalSavingsKes,
    averageDiscountPct,
    deliveryZone: zone,
  };
}

export function validateBulkQuoteRequest(
  req: Partial<BulkQuoteRequest>
): Partial<Record<'organizationName' | 'contactName' | 'phone' | 'items', string>> {
  const errors: Partial<
    Record<'organizationName' | 'contactName' | 'phone' | 'items', string>
  > = {};

  const orgName = sanitizeTextInput(req.organizationName, 140);
  const contactName = sanitizeTextInput(req.contactName, 120);

  if (orgName.length < 2) {
    errors.organizationName = 'Enter a school, shop, hotel, or business name.';
  }
  if (contactName.length < 2) {
    errors.contactName = 'Enter a contact person name.';
  }
  if (!req.phone || !validateKenyanPhone(req.phone)) {
    errors.phone = 'Enter a valid Kenyan mobile number (e.g. 0713833814).';
  }
  const estimate = calculateWholesaleQuoteEstimate(req.items ?? []);
  if (estimate.totalCrates <= 0) {
    errors.items = 'Select at least 1 wholesale crate or carton.';
  }
  return errors;
}

export function recommendProductFromQuiz(answers: QuizAnswers): {
  product: Product;
  reason: string;
} {
  const mood = answers.mood ?? 'fruity';
  const quantity = answers.quantity ?? 'single';

  if (mood === 'everyday') {
    return {
      product: PRODUCTS.find((p) => p.id === 'long-life-milk-500ml')!,
      reason:
        'Wholesome 90-day Limuru Fresh Long Life Milk keeps your pantry stocked with pure highland nutrition anytime.',
    };
  }

  if (mood === 'indulgent') {
    return {
      product: PRODUCTS.find((p) => p.id === 'lemon-biscuit-500ml')!,
      reason:
        'Relish Lemon Biscuit pairs bright citrus zest with warm biscuit creaminess for an effortless dessert-style treat.',
    };
  }

  if (mood === 'classic') {
    const id =
      quantity === 'family'
        ? 'vanilla-3l'
        : quantity === 'medium'
          ? 'vanilla-2l'
          : 'vanilla-500ml';
    return {
      product: PRODUCTS.find((p) => p.id === id)!,
      reason:
        quantity === 'family'
          ? 'Our 3L Relish Vanilla is our top-value yoghurt size for the whole table, at just KES 157 per litre.'
          : 'Smooth, balanced Relish Vanilla is loved straight from the cup or over morning fruit and oats.',
    };
  }

  // Fruity mood
  if (quantity === 'single') {
    return {
      product: PRODUCTS.find((p) => p.id === 'passion-500ml')!,
      reason:
        'Bright Kenyan passion fruit meets thick, creamy Relish yoghurt in a refreshing 500ml cup.',
    };
  }

  const strawberryId = quantity === 'family' ? 'strawberry-2l' : 'strawberry-1l';
  return {
    product: PRODUCTS.find((p) => p.id === strawberryId)!,
    reason:
      'Relish Strawberry brings real berry sweetness in a generous bottle made for sharing.',
  };
}

export function validateKenyanPhone(raw: string): boolean {
  return normalizeKenyanPhone(raw) !== '';
}

export function validateCheckoutForm(
  form: CheckoutFormData
): Partial<Record<keyof CheckoutFormData, string>> {
  const errors: Partial<Record<keyof CheckoutFormData, string>> = {};
  const fullName = sanitizeTextInput(form.fullName, 120);
  const address = sanitizeTextInput(form.address, 240);

  if (form.email !== undefined && form.email.trim().length > 0) {
    if (!sanitizeAndValidateEmail(form.email)) {
      errors.email = 'Please sign in with a valid email address.';
    }
  }
  if (fullName.length < 2) {
    errors.fullName = 'Please enter your full name.';
  }
  if (!validateKenyanPhone(form.phone)) {
    errors.phone = 'Enter a valid Kenyan mobile number (e.g. 0713833814 or +254713833814).';
  }
  if (address.length < 5) {
    errors.address = 'Please enter a delivery location or estate in Nairobi / Kiambu.';
  }
  return errors;
}

export function buildWhatsAppOrderUrl(
  cart: CartItem[],
  customer?: Partial<CheckoutFormData>
): string {
  const zone = customer?.deliveryZoneId
    ? getDeliveryZoneById(customer.deliveryZoneId)
    : undefined;
  const summary = calculateCartSummary(cart, zone?.id);
  const lines: string[] = [
    'Hello Limuru Dairy, I would like to place an order:',
    '',
  ];

  summary.detailedItems.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.product.name} (${item.product.size}) x${item.quantity} - KES ${item.lineTotalKes}`
    );
  });

  lines.push('');
  lines.push(`Subtotal: KES ${summary.subtotalKes}`);
  lines.push(
    `Delivery (${zone ? zone.label : 'Standard'}): ${
      summary.deliveryFeeKes === 0 ? 'FREE' : `KES ${summary.deliveryFeeKes}`
    }`
  );
  lines.push(`Total: KES ${summary.totalKes}`);

  const cleanName = sanitizeTextInput(customer?.fullName, 120);
  const cleanEmail = sanitizeAndValidateEmail(customer?.email);
  const cleanPhone = sanitizeTextInput(customer?.phone, 32);
  const cleanAddress = sanitizeTextInput(customer?.address, 240);

  if (cleanName) {
    lines.push(`Name: ${cleanName}`);
  }
  if (cleanEmail) {
    lines.push(`Email: ${cleanEmail}`);
  }
  if (cleanPhone) {
    lines.push(`Phone: ${cleanPhone}`);
  }
  if (zone) {
    lines.push(`Delivery Zone: ${zone.label} (${zone.eta})`);
  }
  if (customer?.deliveryWindowId) {
    const windowOpt = getDeliveryWindowById(customer.deliveryWindowId);
    lines.push(`Delivery Window: ${windowOpt.label} (${windowOpt.timeRange})`);
  }
  if (cleanAddress) {
    lines.push(`Delivery Address: ${cleanAddress}`);
  }
  if (customer?.paymentMethod) {
    lines.push(
      `Payment: ${customer.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on delivery'}`
    );
  }

  return `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function generateClientSafeOrderSuffix(): string {
  const buf = new Uint32Array(1);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
    return String(10000000 + (buf[0] % 90000000));
  }
  return String(10000000 + (Date.now() % 90000000));
}

export function createOrderReceipt(
  cart: CartItem[],
  form: CheckoutFormData,
  options?: { persisted?: boolean; orderNumber?: string }
): OrderReceipt {
  const zone = getDeliveryZoneById(form.deliveryZoneId);
  const windowOpt = getDeliveryWindowById(form.deliveryWindowId);
  const summary = calculateCartSummary(cart, form.deliveryZoneId ? zone.id : undefined);
  const orderNumber = options?.orderNumber ?? `LDF-${generateClientSafeOrderSuffix()}`;
  const cleanEmail = sanitizeAndValidateEmail(form.email);
  return {
    orderNumber,
    customerName: sanitizeTextInput(form.fullName, 120),
    ...(cleanEmail ? { customerEmail: cleanEmail } : {}),
    phone: sanitizeTextInput(form.phone, 32),
    address: sanitizeTextInput(form.address, 240),
    deliveryZoneId: zone.id,
    deliveryZoneLabel: zone.label,
    deliveryWindowId: windowOpt.id,
    deliveryWindowLabel: `${windowOpt.label} (${windowOpt.timeRange})`,
    status: 'confirmed',
    estimatedDelivery: `${windowOpt.label} (${windowOpt.timeRange}) · ${zone.eta}`,
    paymentMethod: form.paymentMethod,
    items: summary.detailedItems.map((entry) => ({
      name: entry.product.name,
      size: entry.product.size,
      quantity: entry.quantity,
      lineTotalKes: entry.lineTotalKes,
    })),
    subtotalKes: summary.subtotalKes,
    deliveryFeeKes: summary.deliveryFeeKes,
    totalKes: summary.totalKes,
    placedAt: new Date().toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    persisted: options?.persisted ?? false,
  };
}

export const FLAVOUR_ACCENT_COLORS: Record<Exclude<FlavourKey, 'all'>, string> = {
  strawberry: '#e11d74',
  vanilla: '#27a8ec',
  'lemon-biscuit': '#16a34a',
  passion: '#9333ea',
  'long-life-milk': '#0a74b5',
};

export function getFlavourAccentColor(flavour: FlavourKey): string {
  if (flavour === 'all') return '#0a74b5';
  return FLAVOUR_ACCENT_COLORS[flavour] ?? '#0a74b5';
}

export interface FlavourCardGroup {
  flavour: Exclude<FlavourKey, 'all'>;
  flavourLabel: string;
  brand: Product['brand'];
  accentColor: string;
  defaultProduct: Product;
  variants: Product[];
}

const FLAVOUR_ORDER: Array<Exclude<FlavourKey, 'all'>> = [
  'strawberry',
  'vanilla',
  'lemon-biscuit',
  'passion',
  'long-life-milk',
];

export function getFlavourCardGroups(
  items: Product[] = PRODUCTS,
  activeFlavour: FlavourKey = 'all'
): FlavourCardGroup[] {
  const keys =
    activeFlavour === 'all'
      ? FLAVOUR_ORDER
      : FLAVOUR_ORDER.filter((key) => key === activeFlavour);

  const groups: FlavourCardGroup[] = [];

  for (const key of keys) {
    const variants = items
      .filter((p) => p.flavour === key)
      .sort((a, b) => a.litres - b.litres);

    if (variants.length === 0) continue;

    const preferred500 =
      variants.find((p) => p.size === '500ml') ?? variants[0];

    groups.push({
      flavour: key,
      flavourLabel: preferred500.flavourLabel,
      brand: preferred500.brand,
      accentColor: getFlavourAccentColor(key),
      defaultProduct: preferred500,
      variants,
    });
  }

  return groups;
}

export function getCartQuantityMap(cart: CartItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of cart) {
    if (!entry.productId || entry.quantity <= 0) continue;
    map[entry.productId] = (map[entry.productId] ?? 0) + entry.quantity;
  }
  return map;
}

const QUICK_STARTER_IDS = [
  'strawberry-500ml',
  'vanilla-500ml',
  'long-life-milk-500ml',
  'passion-500ml',
];

export function getQuickStarterProducts(items: Product[] = PRODUCTS): Product[] {
  return QUICK_STARTER_IDS.map((id) => items.find((p) => p.id === id)).filter(
    (p): p is Product => Boolean(p)
  );
}


