import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABOUT_NAV_ITEMS,
  GALLERY_ITEMS,
  MANAGERS_MESSAGE,
  MEDIA_ARTICLES,
} from '../data/content';
import {
  DELIVERY_WINDOWS,
  DELIVERY_ZONES,
  PRODUCTS,
  SHOWCASE_PRODUCTS,
  WHOLESALE_PACKS,
  buildWhatsAppOrderUrl,
  calculateCartSummary,
  calculateWholesaleQuoteEstimate,
  filterAndSortProducts,
  getCartQuantityMap,
  getCheapestPerLitreIds,
  getDeliveryWindowById,
  getFlavourAccentColor,
  getFlavourCardGroups,
  getPricePerLitre,
  getProductNutritionStorage,
  getQuickStarterProducts,
  getTrayPieceCount,
  getTrayProgressHint,
  recommendProductFromQuiz,
  validateBulkQuoteRequest,
  validateCheckoutForm,
  validateKenyanPhone,
} from './catalog';

test('showcase contains all five 500ml hero products in exact order', () => {
  assert.equal(SHOWCASE_PRODUCTS.length, 5);
  assert.deepEqual(
    SHOWCASE_PRODUCTS.map((p) => p.id),
    [
      'strawberry-500ml',
      'vanilla-500ml',
      'lemon-biscuit-500ml',
      'passion-500ml',
      'long-life-milk-500ml',
    ]
  );
});

test('pricing per litre and best value detection work accurately', () => {
  const milk = PRODUCTS.find((p) => p.id === 'long-life-milk-500ml')!;
  const vanilla3l = PRODUCTS.find((p) => p.id === 'vanilla-3l')!;
  assert.equal(getPricePerLitre(milk), 140);
  assert.equal(Math.round(getPricePerLitre(vanilla3l)), 157);

  const allBest = getCheapestPerLitreIds(PRODUCTS);
  assert.equal(allBest.has('long-life-milk-500ml'), true);

  const vanillaOnly = PRODUCTS.filter((p) => p.flavour === 'vanilla');
  const vanillaBest = getCheapestPerLitreIds(vanillaOnly);
  assert.equal(vanillaBest.has('vanilla-3l'), true);
  assert.equal(vanillaBest.has('vanilla-5l'), false);
});

test('filter and sort return matching products', () => {
  const strawberry2L = filterAndSortProducts(PRODUCTS, {
    flavour: 'strawberry',
    size: '2L',
    search: '',
    sort: 'featured',
  });
  assert.equal(strawberry2L.length, 1);
  assert.equal(strawberry2L[0].priceKes, 320);

  const sortedByPrice = filterAndSortProducts(PRODUCTS, {
    flavour: 'all',
    size: 'all',
    search: '',
    sort: 'price-desc',
  });
  assert.equal(sortedByPrice[0].id, 'vanilla-5l');
  assert.equal(sortedByPrice[0].priceKes, 850);
});

test('cart summary enforces KES 1,500 free delivery threshold and KES 200 delivery fee', () => {
  const belowThreshold = calculateCartSummary([
    { productId: 'vanilla-5l', quantity: 1 }, // 850
    { productId: 'strawberry-2l', quantity: 1 }, // 320 -> subtotal 1170
  ]);
  assert.equal(belowThreshold.subtotalKes, 1170);
  assert.equal(belowThreshold.qualifiesFreeDelivery, false);
  assert.equal(belowThreshold.deliveryFeeKes, 200);
  assert.equal(belowThreshold.remainingForFreeDeliveryKes, 330);
  assert.equal(belowThreshold.totalKes, 1370);

  const atThreshold = calculateCartSummary([
    { productId: 'vanilla-5l', quantity: 1 }, // 850
    { productId: 'vanilla-3l', quantity: 1 }, // 470
    { productId: 'strawberry-1l', quantity: 1 }, // 170
    { productId: 'strawberry-100ml', quantity: 1 }, // 20 -> subtotal 1510
  ]);
  assert.equal(atThreshold.subtotalKes, 1510);
  assert.equal(atThreshold.qualifiesFreeDelivery, true);
  assert.equal(atThreshold.deliveryFeeKes, 0);
  assert.equal(atThreshold.totalKes, 1510);
});

test('delivery zone selector adjusts fees below threshold and keeps free delivery above 1500', () => {
  assert.equal(DELIVERY_ZONES.length, 4);
  const limuruCart = calculateCartSummary(
    [{ productId: 'strawberry-500ml', quantity: 2 }],
    'limuru-tigoni'
  );
  assert.equal(limuruCart.deliveryFeeKes, 150);
  assert.equal(limuruCart.totalKes, 330);

  const nairobiCart = calculateCartSummary(
    [{ productId: 'strawberry-500ml', quantity: 2 }],
    'nairobi-cbd-westlands'
  );
  assert.equal(nairobiCart.deliveryFeeKes, 250);
  assert.equal(nairobiCart.totalKes, 430);

  const nairobiFree = calculateCartSummary(
    [{ productId: 'vanilla-5l', quantity: 2 }],
    'nairobi-cbd-westlands'
  );
  assert.equal(nairobiFree.deliveryFeeKes, 0);
  assert.equal(nairobiFree.totalKes, 1700);
});

test('nutrition and storage specifications differentiate cultured yoghurt from UHT milk', () => {
  const yoghurt = getProductNutritionStorage(
    PRODUCTS.find((p) => p.id === 'strawberry-500ml')!
  );
  const uhtMilk = getProductNutritionStorage(
    PRODUCTS.find((p) => p.id === 'long-life-milk-500ml')!
  );

  assert.match(yoghurt.storageTemp, /2°C – 6°C/);
  assert.ok(yoghurt.certifications.includes('Live Probiotic Cultures'));
  assert.match(uhtMilk.shelfLife, /90 days/i);
  assert.match(uhtMilk.storageTemp, /Ambient/i);
});

test('wholesale crate estimator and validation compute bulk discounts accurately', () => {
  assert.ok(WHOLESALE_PACKS.length >= 6);
  const estimate = calculateWholesaleQuoteEstimate(
    [
      { packId: 'crate-longlife-500x12', crates: 2 }, // 2 * 740 = 1480 vs 1680
      { packId: 'crate-strawberry-500x12', crates: 1 }, // 950 vs 1080
    ],
    'nairobi-cbd-westlands'
  );

  assert.equal(estimate.totalCrates, 3);
  assert.equal(estimate.totalUnits, 36);
  assert.equal(estimate.estimatedTotalKes, 2430);
  assert.equal(estimate.retailEquivalentKes, 2760);
  assert.equal(estimate.totalSavingsKes, 330);

  const quoteErrors = validateBulkQuoteRequest({
    organizationName: 'A',
    contactName: '',
    phone: '0700',
    items: [],
  });
  assert.ok(quoteErrors.organizationName);
  assert.ok(quoteErrors.contactName);
  assert.ok(quoteErrors.phone);
  assert.ok(quoteErrors.items);
});

test('quiz recommends appropriate dairy products', () => {
  const rec1 = recommendProductFromQuiz({ mood: 'everyday', quantity: 'single' });
  assert.equal(rec1.product.id, 'long-life-milk-500ml');

  const rec2 = recommendProductFromQuiz({ mood: 'classic', quantity: 'family' });
  assert.equal(rec2.product.id, 'vanilla-3l');

  const rec3 = recommendProductFromQuiz({ mood: 'indulgent', quantity: 'single' });
  assert.equal(rec3.product.id, 'lemon-biscuit-500ml');
});

test('Kenyan phone validation and WhatsApp URL builder work reliably', () => {
  assert.equal(validateKenyanPhone('0713833814'), true);
  assert.equal(validateKenyanPhone('+254713833814'), true);
  assert.equal(validateKenyanPhone('0112345678'), true);
  assert.equal(validateKenyanPhone('12345'), false);

  const errors = validateCheckoutForm({
    fullName: 'A',
    phone: 'bad',
    address: 'abc',
    paymentMethod: 'mpesa',
  });
  assert.ok(errors.fullName);
  assert.ok(errors.phone);
  assert.ok(errors.address);

  const waUrl = buildWhatsAppOrderUrl(
    [{ productId: 'strawberry-500ml', quantity: 2 }],
    { fullName: 'Wanjiku Kamau', phone: '0713833814', address: 'Limuru Town', paymentMethod: 'mpesa' }
  );
  assert.ok(waUrl.startsWith('https://wa.me/254713833814?text='));
  assert.ok(decodeURIComponent(waUrl).includes('Relish Strawberry Yoghurt'));
  assert.ok(decodeURIComponent(waUrl).includes('KES 180'));
});

test('flavour card grouping consolidates sizes cleanly per flavour and provides accent colors', () => {
  const allGroups = getFlavourCardGroups(PRODUCTS, 'all');
  assert.equal(allGroups.length, 5);
  assert.deepEqual(
    allGroups.map((g) => g.flavour),
    ['strawberry', 'vanilla', 'lemon-biscuit', 'passion', 'long-life-milk']
  );

  const strawberry = allGroups.find((g) => g.flavour === 'strawberry')!;
  assert.equal(strawberry.defaultProduct.size, '500ml');
  assert.equal(strawberry.variants.length, 6);
  assert.equal(strawberry.variants[0].size, '100ml');
  assert.equal(strawberry.variants[strawberry.variants.length - 1].size, '2L');
  assert.equal(getFlavourAccentColor('strawberry'), '#e11d74');

  const vanillaOnly = getFlavourCardGroups(PRODUCTS, 'vanilla');
  assert.equal(vanillaOnly.length, 1);
  assert.equal(vanillaOnly[0].variants.length, 7);
});

test('About navigation excludes Farmer Services and Certifications and keeps Manager message heading accurate', () => {
  assert.equal(
    MANAGERS_MESSAGE.heading,
    'LIMURU DAIRY FARMERS COOP SOCIETY VISION BEARER'
  );
  assert.ok(ABOUT_NAV_ITEMS.every((item) => item.route === 'about'));
  assert.equal(ABOUT_NAV_ITEMS[0].id, 'managers-message');
});

test('Gallery excludes SKU product cutouts and includes all documentary & CSR photographs', () => {
  assert.equal(GALLERY_ITEMS.length, 44);
  assert.equal(
    GALLERY_ITEMS.some((item) => item.isCutout || item.category === 'Products'),
    false
  );

  const csrItems = GALLERY_ITEMS.filter((item) => item.category === 'CSR Activities');
  assert.equal(csrItems.length, 12);

  const imagePaths = new Set(GALLERY_ITEMS.map((item) => item.image));
  const requiredNewImages = [
    '/assets/aistudio/IMG_8104_c231dfd9.jpg',
    '/assets/aistudio/IMG_8003_9838f803.jpg',
    '/assets/aistudio/IMG_8113_8a54a225.jpg',
    '/assets/aistudio/IMG_8106_dd212b3b.jpg',
    '/assets/aistudio/_DSC1622_2d268ac1.JPG',
    '/assets/aistudio/_DSC1625_b3b69202.JPG',
    '/assets/aistudio/_DSC1634_a8af3e20.JPG',
    '/assets/aistudio/_DSC1663_662fa75b.JPG',
    '/assets/aistudio/IMG_6293_7a029c5c.JPG',
    '/assets/aistudio/IMG_6303_489ddcb8.JPG',
    '/assets/aistudio/IMG_6314_059ee2dd.JPG',
    '/assets/aistudio/IMG_6325_5237ff89.JPG',
    '/assets/aistudio/IMG_6295_27a85e44.JPG',
    '/assets/aistudio/IMG_7781__2__1f70f768.JPG',
    '/assets/aistudio/IMG_7815__2__66751618.JPG',
    '/assets/aistudio/IMG_7832_f32eaf76.JPG',
    '/assets/aistudio/IMG_7773_2424efcb.JPG',
    '/assets/aistudio/IMG_0428__2__e7f6b55c.JPG',
    '/assets/aistudio/IMG_0433__2__64b262cd.JPG',
    '/assets/aistudio/IMG_0496_bd6e1da1.JPG',
    '/assets/aistudio/IMG_0505_1e6fb00e.JPG',
    '/assets/aistudio/IMG_0455_c747daf8.JPG',
    '/assets/aistudio/IMG_0472_590e4c9e.JPG',
    '/assets/aistudio/IMG_0408__2__4b74aca0.JPG',
    '/assets/aistudio/IMG_0419_7e68ca6e.JPG',
    '/assets/aistudio/IMG_0409_d1493bb1.JPG',
    '/assets/aistudio/IMG_0509__2__49c79c68.JPG',
    '/assets/aistudio/IMG_0389_4e8dfba6.JPG',
    '/assets/aistudio/IMG_0398_1317e502.JPG',
    '/assets/aistudio/esl_art_8d78dfe3.png',
    '/assets/aistudio/Scrolling_Vet_-_Copy_0deeb412.jpg',
    '/assets/aistudio/IMG_4751_6b954f0d.jpg',
    '/assets/aistudio/IMG_7707__2__26f52958.jpg',
    '/assets/aistudio/IMG_5958_7709b32c.JPG',
    '/assets/aistudio/edit_21_017b5c23.JPG',
    '/assets/aistudio/Maziwa_hse_555665bd.jpeg',
    '/assets/aistudio/DSC_0127_fbb33261.jpg',
  ];
  for (const imgPath of requiredNewImages) {
    assert.equal(imagePaths.has(imgPath), true, `Missing uploaded gallery image: ${imgPath}`);
  }
});

test('Media articles and gallery accurately attribute World Bank, Deputy President, and Kiambu Governor visits', () => {
  const wbGallery = GALLERY_ITEMS.find((i) => i.id === 'gal-ushirika-group')!;
  assert.match(wbGallery.caption, /NARIGP/i);
  assert.match(wbGallery.caption, /134 million/i);

  const dpGallery = GALLERY_ITEMS.find((i) => i.id === 'gal-product-tasting')!;
  assert.match(dpGallery.title, /Kithure Kindiki/i);

  const govGallery = GALLERY_ITEMS.find((i) => i.id === 'gal-tree-watering')!;
  assert.match(govGallery.title, /Kiambu Governor/i);
  assert.match(govGallery.caption, /MOU/i);

  const wbDirector = GALLERY_ITEMS.find((i) => i.id === 'gal-signing')!;
  assert.match(wbDirector.title, /World Bank Director/i);

  assert.ok(MEDIA_ARTICLES.some((a) => /134M ESL/i.test(a.title)));
  assert.ok(MEDIA_ARTICLES.some((a) => /Kithure Kindiki/i.test(a.title)));
});

test('getCartQuantityMap and getQuickStarterProducts support instant inline ordering', () => {
  const qtyMap = getCartQuantityMap([
    { productId: 'strawberry-500ml', quantity: 2 },
    { productId: 'vanilla-500ml', quantity: 1 },
    { productId: 'strawberry-500ml', quantity: 3 },
    { productId: 'passion-500ml', quantity: 0 },
  ]);
  assert.deepEqual(qtyMap, {
    'strawberry-500ml': 5,
    'vanilla-500ml': 1,
  });

  const starters = getQuickStarterProducts();
  assert.equal(starters.length, 4);
  assert.deepEqual(
    starters.map((p) => p.id),
    ['strawberry-500ml', 'vanilla-500ml', 'long-life-milk-500ml', 'passion-500ml']
  );
});

test('getTrayPieceCount maps 500ml to 6, 250ml to 12, 100ml to 24 and other sizes to null', () => {
  assert.equal(getTrayPieceCount('500ml'), 6);
  assert.equal(getTrayPieceCount('250ml'), 12);
  assert.equal(getTrayPieceCount('100ml'), 24);
  assert.equal(getTrayPieceCount('150ml'), null);
  assert.equal(getTrayPieceCount('1L'), null);
  assert.equal(getTrayPieceCount('2L'), null);
  assert.equal(getTrayPieceCount('5L'), null);
});

test('delivery windows provide morning, afternoon, and evening routes with clear time ranges', () => {
  assert.equal(DELIVERY_WINDOWS.length, 3);
  const morning = getDeliveryWindowById('morning');
  assert.equal(morning.label, 'Morning Route');
  assert.match(morning.timeRange, /8:00 AM/);

  const afternoon = getDeliveryWindowById('afternoon');
  assert.equal(afternoon.label, 'Afternoon Route');
  assert.match(afternoon.timeRange, /1:00 PM/);

  const evening = getDeliveryWindowById('evening');
  assert.equal(evening.label, 'Evening Express');
  assert.match(evening.timeRange, /5:00 PM/);

  // Fallback defaults to morning
  assert.equal(getDeliveryWindowById(undefined).id, 'morning');
});

test('getTrayProgressHint suggests remaining items to complete a full tray and recognizes exact multiples', () => {
  const fourOf500 = getTrayProgressHint('500ml', 4)!;
  assert.equal(fourOf500.traySize, 6);
  assert.equal(fourOf500.isExactFullTray, false);
  assert.equal(fourOf500.itemsToCompleteTray, 2);
  assert.equal(fourOf500.nextTrayTarget, 6);
  assert.match(fourOf500.hintText, /Add 2 more pcs to complete a full tray \(6 pcs\)/i);

  const exact500 = getTrayProgressHint('500ml', 6)!;
  assert.equal(exact500.isExactFullTray, true);
  assert.equal(exact500.itemsToCompleteTray, 0);
  assert.match(exact500.hintText, /Tray-friendly! 1 full tray \(6 pcs\)/i);

  const eightOf500 = getTrayProgressHint('500ml', 8)!;
  assert.equal(eightOf500.itemsToCompleteTray, 4);
  assert.equal(eightOf500.nextTrayTarget, 12);
  assert.match(eightOf500.hintText, /Add 4 more pcs to complete tray #2 \(12 pcs\)/i);

  const tenOf250 = getTrayProgressHint('250ml', 10)!;
  assert.equal(tenOf250.itemsToCompleteTray, 2);
  assert.equal(tenOf250.nextTrayTarget, 12);

  const twentyOf100 = getTrayProgressHint('100ml', 20)!;
  assert.equal(twentyOf100.itemsToCompleteTray, 4);
  assert.equal(twentyOf100.nextTrayTarget, 24);

  assert.equal(getTrayProgressHint('1L', 3), null);
  assert.equal(getTrayProgressHint('500ml', 0), null);
});



