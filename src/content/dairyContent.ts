import { UPLOADED_ASSETS } from '../utils/catalog';

export const ASSET_IMAGES = {
  logo: UPLOADED_ASSETS.logo,
  maziwaHouse: UPLOADED_ASSETS.maziwaHouse,
  plantReception: UPLOADED_ASSETS.plantReception,
  plantInspection: UPLOADED_ASSETS.plantInspection,
  plantTanks: UPLOADED_ASSETS.plantTanks,
  plantPiping: UPLOADED_ASSETS.plantPiping,
  plantEquipment: UPLOADED_ASSETS.plantEquipment,
  eslArt: UPLOADED_ASSETS.eslArt,
  coolingCentre: UPLOADED_ASSETS.coolingCentre,
  limdaFeeds: UPLOADED_ASSETS.limdaFeeds,
  scrollingVet: UPLOADED_ASSETS.scrollingVet,
  vetExtension: UPLOADED_ASSETS.vetExtension,
  strawberry1L: UPLOADED_ASSETS.strawberry1L,
  longLifeMilk: UPLOADED_ASSETS.longLifeMilk500,
  managerPortrait: UPLOADED_ASSETS.managerPortrait,
  plantProductTeam: UPLOADED_ASSETS.plantProductTeam,
  lalaPlain1L: UPLOADED_ASSETS.lalaPlain1L,
  ushirikaGroup: UPLOADED_ASSETS.ushirikaGroup,
  stageHandshake: UPLOADED_ASSETS.stageHandshake,
  collectionCentre: UPLOADED_ASSETS.collectionCentre,
};

export const ABOUT_NAV_ITEMS = [
  { id: 'managers-message', label: 'Manager’s Message', route: 'about', sectionId: 'managers-message' },
  { id: 'who-we-are', label: 'Who We Are', route: 'about', sectionId: 'who-we-are' },
  { id: 'vision-values', label: 'Vision & Values', route: 'about', sectionId: 'vision-values' },
  { id: 'strategic-plan', label: 'Strategic Plan', route: 'about', sectionId: 'strategic-plan' },
  { id: 'history', label: 'History 1962–1997', route: 'about', sectionId: 'history' },
];

export const MANAGERS_MESSAGE = {
  eyebrow: 'Message from the General Manager',
  heading: 'LIMURU DAIRY FARMERS COOP SOCIETY VISION BEARER',
  quote: '“Our cooperative stands as a beacon of member-owned dairy excellence across Kenya, returning maximum value straight to 11,850 smallholder dairy households.”',
  paragraphs: [
    'Since our founding in 1962, Limuru Dairy Farmers’ Co-operative Society has remained firmly anchored in the dedication of Kiambu County smallholder farmers.',
    'Through World Bank NARIGP backing, advanced pasteurization lines, and transparent milk collection, we ensure every drop of Limuru Fresh and Relish Yoghurt upholds the highest standards of purity and cooperative trust.',
  ],
  role: 'General Manager · Limuru Dairy Farmers Co-op',
  image: ASSET_IMAGES.managerPortrait,
  imageAlt: 'General Manager of Limuru Dairy Farmers Co-operative Society',
  caption: 'Maziwa House Headquarters · Limuru Town',
};

export const CORE_VALUES = [
  { name: 'Integrity', description: 'Honest milk weighing, testing, and transparent monthly member payouts.' },
  { name: 'Quality', description: 'Uncompromising hygiene from farm collection to 90-day ESL aseptic cartoning.' },
  { name: 'Member Focus', description: 'Putting 11,850 smallholder dairy farmers at the center of all cooperative decisions.' },
  { name: 'Sustainability', description: 'Eco-friendly processing, water recycling, and tree planting initiatives in Kiambu.' },
  { name: 'Innovation', description: 'State-of-the-art World Bank NARIGP equipment and quick-order digital delivery.' },
];

export const STRATEGIC_GOALS = [
  { number: '01', title: 'Milk Production & Yield', detail: 'Empowering members with high-yield LIMDA dairy feeds, AI breeding, and veterinary extension.' },
  { number: '02', title: 'Processing Excellence', detail: 'Expanding sanitary ESL and UHT pasteurization capacity at our Maziwa House facility.' },
  { number: '03', title: 'Market Reach & Logistics', detail: 'Direct chilled doorstep delivery across Limuru, Kiambu, and Nairobi corridors.' },
  { number: '04', title: 'Member Financial Returns', detail: 'Maximizing percentage payout rates and providing affordable farm-input check-offs.' },
];

export const HISTORY_TIMELINE = [
  { year: '1962', title: 'Society Founding', text: 'Limuru Dairy Farmers’ Co-operative Society was established by smallholder dairy pioneers in Kiambu County.' },
  { year: '1978', title: 'Collection Centre Network', text: 'Expansion of village collection points and chilled transport routes across Limuru and Tigoni.' },
  { year: '1997', title: 'Maziwa House Headquarters', text: 'Commissioning of our modern multi-story Maziwa House headquarters and processing floor in Limuru Town.' },
  { year: '2024', title: 'World Bank NARIGP Modernization', text: 'Deployment of World Bank NARIGP-backed aseptic ESL cartoning and automated pasteurization lines.' },
];

export const FARM_TO_CUP_STEPS = [
  {
    id: 'step-1',
    stepNumber: '01',
    subtitle: 'Emerald Pastures',
    title: '11,850 Smallholder Farmers',
    description: 'Fresh milk harvested twice daily across the lush, cool highlands of Limuru and Kiambu by dedicated member families.',
    metricLabel: 'Daily Intakes',
    metricValue: '11,850 Farms',
    image: ASSET_IMAGES.collectionCentre,
  },
  {
    id: 'step-2',
    stepNumber: '02',
    subtitle: 'Collection & Chilling',
    title: 'Rapid Density & Acidity Screening',
    description: 'Every tanker and milk can undergoes strict lactometer and alcohol testing before immediate chilling below 4°C.',
    metricLabel: 'Screening',
    metricValue: '< 4°C Chilled',
    image: ASSET_IMAGES.plantInspection,
  },
  {
    id: 'step-3',
    stepNumber: '03',
    subtitle: 'Sanitary Processing',
    title: 'Automated ESL Pasteurization',
    description: 'Closed-loop plate pasteurization and live probiotic culture inoculation secure natural nutrition and 90-day ESL stability.',
    metricLabel: 'Quality Control',
    metricValue: 'KEBS & KDB Verified',
    image: ASSET_IMAGES.plantTanks,
  },
  {
    id: 'step-4',
    stepNumber: '04',
    subtitle: 'Eco Cartoning',
    title: 'Aseptic Pouch & Bottle Sealing',
    description: 'Packaged in hygienic 500ml pouches, bottles, and 3-litre tubs designed to protect freshness without added preservatives.',
    metricLabel: 'Shelf Life',
    metricValue: '90-Day Long Life',
    image: ASSET_IMAGES.eslArt,
  },
  {
    id: 'step-5',
    stepNumber: '05',
    subtitle: 'Doorstep Delivery',
    title: 'Chilled Corridor Van Network',
    description: 'Dispatched through temperature-controlled delivery vans across Limuru, Kiambu, and Nairobi with free delivery over KES 1,500.',
    metricLabel: 'Delivery',
    metricValue: 'Free ≥ KES 1,500',
    image: ASSET_IMAGES.vetExtension,
  },
];

export const RECIPE_CARDS = [
  {
    id: 'recipe-1',
    title: 'Limuru Morning Berry Smoothie',
    prepTime: '5 mins',
    serves: '2',
    productLabel: 'Relish Strawberry Yoghurt (500ml)',
    productId: 'strawberry-500ml',
    image: UPLOADED_ASSETS.strawberry500,
    ingredients: ['1 cup Relish Strawberry Yoghurt', '1 fresh banana', '1/2 cup fresh strawberries', '1 tsp raw honey'],
    method: 'Blend Relish Strawberry Yoghurt with ripe banana and fresh strawberries until smooth. Pour chilled and enjoy.',
  },
  {
    id: 'recipe-2',
    title: 'Highland Vanilla Overnight Oats',
    prepTime: '10 mins + chill',
    serves: '1',
    productLabel: 'Relish Vanilla Yoghurt (500ml)',
    productId: 'vanilla-500ml',
    image: UPLOADED_ASSETS.vanilla500,
    ingredients: ['1/2 cup rolled oats', '1/2 cup Relish Vanilla Yoghurt', '1/2 cup Limuru Fresh Milk', 'Chia seeds & berries'],
    method: 'Combine oats, Relish Vanilla Yoghurt, and Limuru Fresh Milk in a jar. Refrigerate overnight and top with berries.',
  },
  {
    id: 'recipe-3',
    title: 'Zesty Lemon Biscuit Parfait',
    prepTime: '8 mins',
    serves: '2',
    productLabel: 'Relish Lemon Biscuit Yoghurt (500ml)',
    productId: 'lemon-biscuit-500ml',
    image: UPLOADED_ASSETS.lemonBiscuit500,
    ingredients: ['1 cup Relish Lemon Biscuit Yoghurt', 'Crushed digestive biscuits', 'Lemon zest garnish'],
    method: 'Layer crushed biscuits and Relish Lemon Biscuit Yoghurt in chilled glasses. Garnish with a hint of fresh lemon zest.',
  },
];

export const WHY_CHOOSE_US_ITEMS = [
  { title: '100% Farmer Owned', description: 'Owned by 11,850 smallholder farmers in Kiambu.' },
  { title: 'World Bank Backed', description: 'Equipped with modern NARIGP processing lines.' },
  { title: '90-Day Freshness', description: 'Advanced ESL technology without preservatives.' },
  { title: 'Direct Corridor Delivery', description: 'Fast van delivery across Limuru & Nairobi.' },
];

const requiredNewImagesList = [
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

export const GALLERY_ITEMS: Array<{
  id: string;
  title: string;
  category: string;
  image: string;
  caption: string;
  aspectClass: string;
  isCutout: boolean;
}> = [
  {
    id: 'gal-ushirika-group',
    title: 'World Bank NARIGP Partnership & 134 million support',
    category: 'Cooperative Events',
    image: ASSET_IMAGES.ushirikaGroup,
    caption: 'World Bank NARIGP 134 million support for Limuru Dairy processing and chilling infrastructure.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-product-tasting',
    title: 'Deputy President Kithure Kindiki Tasting Limuru Fresh Milk',
    category: 'Cooperative Events',
    image: ASSET_IMAGES.stageHandshake,
    caption: 'Deputy President Kithure Kindiki congratulating cooperative leadership and celebrating Kenyan dairy.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-tree-watering',
    title: 'Kiambu Governor MoU and Tree Planting',
    category: 'Cooperative Events',
    image: '/assets/aistudio/_DSC1625_b3b69202.JPG',
    caption: 'Kiambu Governor signing MoU and participating in tree planting.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-signing',
    title: 'World Bank Director Inspection Visit',
    category: 'Processing Plant',
    image: ASSET_IMAGES.plantTanks,
    caption: 'World Bank Director visiting Maziwa House processing plant.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  // 12 genuine CSR Activities community outreach photos (zero white-dustcoat plant inspection photos)
  {
    id: 'gal-csr-1',
    title: 'Community Artisans & Craft Empowerment',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0428__2__e7f6b55c.JPG',
    caption: 'Limuru Dairy CSR team supporting local community artisans and women craft groups.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-2',
    title: 'Local Beadwork Women’s Enterprise Support',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0433__2__64b262cd.JPG',
    caption: 'Showcasing handmade community beadwork backed through cooperative CSR outreach.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-3',
    title: 'Relish Yoghurt Community Sharing Drive',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0496_bd6e1da1.JPG',
    caption: 'Cooperative volunteers sharing chilled Relish yoghurt cups with community families.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-4',
    title: 'Cooperative Nutrition & Outreach Briefing',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0505_1e6fb00e.JPG',
    caption: 'Community leaders welcoming the Limuru Dairy CSR team with food and dairy provisions.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-5',
    title: 'School & Youth Dairy Nutrition CSR',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0455_c747daf8.JPG',
    caption: 'Distributing Relish cultured yoghurt and household supplies at local youth outreach.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-6',
    title: 'Children Enjoying Relish Strawberry Yoghurt',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0472_590e4c9e.JPG',
    caption: 'Young community member enjoying nutritious Relish strawberry yoghurt during CSR visit.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-7',
    title: 'Host Household CSR Fellowship Visit',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0408__2__4b74aca0.JPG',
    caption: 'Cooperative staff and elders meeting community host families during CSR outreach.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-8',
    title: 'Community Household Support & Meal Sharing',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0419_7e68ca6e.JPG',
    caption: 'Sharing fellowship and nutritious dairy refreshments with community households.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-9',
    title: 'Village Elders & Families CSR Gathering',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0409_d1493bb1.JPG',
    caption: 'Engaging local household elders and youth during Limuru Dairy social responsibility day.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-10',
    title: 'Community Provisions & LIMDA Support Handover',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0509__2__49c79c68.JPG',
    caption: 'Handing over yoghurt cartons and household provisions with community representatives.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-11',
    title: 'Limuru Neighbourhood Community Outreach',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0389_4e8dfba6.JPG',
    caption: 'Full community gathering hosted by Limuru Dairy Farmers Co-operative CSR ambassadors.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
  {
    id: 'gal-csr-12',
    title: 'Inclusive Community Celebration & Support',
    category: 'CSR Activities',
    image: '/assets/aistudio/IMG_0398_1317e502.JPG',
    caption: 'Celebrating inclusive community partnership and support across Kiambu neighbourhoods.',
    aspectClass: 'aspect-[4/3]',
    isCutout: false,
  },
];

const CURATED_ARCHIVE_ITEMS: Array<{
  image: string;
  title: string;
  category: 'Processing Plant' | 'Farms & Collection' | 'Cooperative Events';
  caption: string;
}> = [
  {
    image: '/assets/aistudio/IMG_8003_9838f803.jpg',
    title: 'Limuru Dairy Farmers Coop Operations — Quality Tasting',
    category: 'Processing Plant',
    caption: 'Plant food-safety specialists in sanitary dustcoats evaluating Relish cultured yoghurt batches.',
  },
  {
    image: '/assets/aistudio/_DSC1634_a8af3e20.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Hygiene Protocol',
    category: 'Processing Plant',
    caption: 'Team donning sanitary white dustcoats and hairnets prior to entering the processing floor.',
  },
  {
    image: '/assets/aistudio/IMG_6293_7a029c5c.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Plant Walkthrough',
    category: 'Processing Plant',
    caption: 'Technical quality inspectors touring Maziwa processing grounds in full sanitary attire.',
  },
  {
    image: '/assets/aistudio/IMG_6303_489ddcb8.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Yard Briefing',
    category: 'Processing Plant',
    caption: 'Operations and production supervisors reviewing daily intake logistics at the plant.',
  },
  {
    image: '/assets/aistudio/IMG_6314_059ee2dd.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Sanitary Pipework',
    category: 'Processing Plant',
    caption: 'Engineers and quality leads inspecting closed-loop dairy piping inside the pasteurization hall.',
  },
  {
    image: '/assets/aistudio/IMG_6325_5237ff89.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Valve Inspection',
    category: 'Processing Plant',
    caption: 'Detailed clean-in-place stainless valve inspection by processing technicians.',
  },
  {
    image: '/assets/aistudio/IMG_6295_27a85e44.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Chilled Fleet',
    category: 'Processing Plant',
    caption: 'Plant dispatch and inspection staff alongside the Limuru Dairy refrigerated delivery truck.',
  },
  {
    image: '/assets/aistudio/IMG_7832_f32eaf76.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Milk Intake Team',
    category: 'Processing Plant',
    caption: 'Quality assurance and logistics staff reviewing chilled milk tanker arrivals.',
  },
  {
    image: '/assets/aistudio/IMG_5958_7709b32c.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Product Assurance',
    category: 'Processing Plant',
    caption: 'Quality leaders reviewing packaged Limuru Fresh milk cartons outside the processing hall.',
  },
  {
    image: '/assets/aistudio/edit_21_017b5c23.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Chilling Tankers',
    category: 'Processing Plant',
    caption: 'Plant engineers inspecting stainless milk bulk tankers at the reception bay.',
  },
  {
    image: '/assets/aistudio/IMG_8980_58a394cd.jpg',
    title: 'Limuru Dairy Farmers Coop Operations — Stainless Line Tour',
    category: 'Processing Plant',
    caption: 'Board leaders and quality assurance officers inside the stainless-steel processing line.',
  },
  {
    image: '/assets/aistudio/IMG_5759_37aab0de.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Aseptic Silos',
    category: 'Processing Plant',
    caption: 'Overhead view of stainless pasteurization silos and automated ESL piping.',
  },
  {
    image: '/assets/aistudio/esl_art_8d78dfe3.png',
    title: 'Limuru Fresh 90-Day ESL Packaging Showcase',
    category: 'Processing Plant',
    caption: 'Stacked cartons and aseptic 500ml pouches of Limuru Fresh Long Life Milk.',
  },
  {
    image: '/assets/aistudio/DSC_0127_fbb33261.jpg',
    title: 'Processing Plant Reception & Landscaped Grounds',
    category: 'Processing Plant',
    caption: 'Main processing reception entrance and landscaped compound in Limuru.',
  },
  {
    image: '/assets/aistudio/Maziwa_hse_555665bd.jpeg',
    title: 'Maziwa House Cooperative Headquarters',
    category: 'Processing Plant',
    caption: 'Multi-storey Maziwa House headquarters housing cooperative administration in Limuru Town.',
  },
  {
    image: '/assets/aistudio/IMG_7815__2__66751618.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Digital Weighing',
    category: 'Farms & Collection',
    caption: 'Digital scale milk weighing and can inspection at the collection centre.',
  },
  {
    image: '/assets/aistudio/Scrolling_Vet_-_Copy_0deeb412.jpg',
    title: 'Limuru Veterinary & Animal Health Care',
    category: 'Farms & Collection',
    caption: 'Cooperative veterinary officers examining dairy cattle on a member smallholder farm.',
  },
  {
    image: '/assets/aistudio/IMG_4751_6b954f0d.jpg',
    title: 'Limuru Dairy Farmers Coop Operations — Cooling Centre',
    category: 'Farms & Collection',
    caption: 'Attendant weighing morning milk beside the Faspol stainless cooling tank at a village centre.',
  },
  {
    image: '/assets/aistudio/IMG_7707__2__26f52958.jpg',
    title: 'Limuru Dairy Farmers Coop Operations — Farm Extension',
    category: 'Farms & Collection',
    caption: 'Cooperative dairy extension officer conducting herd health check at a member homestead.',
  },
  {
    image: '/assets/aistudio/_MG_9703_8fc03d2e.JPG',
    title: 'Limuru Dairy Farmers Coop Operations — Village Weighing',
    category: 'Farms & Collection',
    caption: 'Morning raw milk intake and density check at a cooperative village collection centre.',
  },
  {
    image: '/assets/aistudio/IMG_8113_8a54a225.jpg',
    title: 'Annual General & Ushirika Leadership Address',
    category: 'Cooperative Events',
    caption: 'Cooperative directors and national leaders addressing Limuru Dairy member farmers.',
  },
  {
    image: '/assets/aistudio/IMG_8106_dd212b3b.jpg',
    title: 'Cooperative Members Stage Welcome',
    category: 'Cooperative Events',
    caption: 'Board members and community leaders welcoming guests during Ushirika celebrations.',
  },
  {
    image: '/assets/aistudio/_DSC1622_2d268ac1.JPG',
    title: 'Cooperative Environmental Tree Planting',
    category: 'Cooperative Events',
    caption: 'County leaders and cooperative representatives planting indigenous trees for sustainability.',
  },
  {
    image: '/assets/aistudio/IMG_7773_2424efcb.JPG',
    title: 'Maziwa House Leadership & Staff Briefing',
    category: 'Cooperative Events',
    caption: 'Cooperative management and field extension team outside Maziwa House.',
  },
  {
    image: '/assets/aistudio/IMG_7781__2__1f70f768.JPG',
    title: 'Cooperative Member Relations Briefing',
    category: 'Cooperative Events',
    caption: 'Leadership engaging field partners and farmer representatives at the society offices.',
  },
  {
    image: '/assets/aistudio/IMG_8924_f52553d9.jpg',
    title: 'World Bank NARIGP Delegation Signing',
    category: 'Cooperative Events',
    caption: 'Development partners signing the official visitors ledger during the NARIGP review.',
  },
  {
    image: '/assets/aistudio/IMG_8904_086f8e12.jpg',
    title: 'Cooperative & County Partner Handshake',
    category: 'Cooperative Events',
    caption: 'Board chairperson welcoming development partners to Limuru Dairy.',
  },
  {
    image: '/assets/aistudio/IMG_8909_b50584ef.jpg',
    title: 'NARIGP Partnership Garden Welcome',
    category: 'Cooperative Events',
    caption: 'Cooperative leadership greeting international dairy development guests.',
  },
];

for (const item of CURATED_ARCHIVE_ITEMS) {
  if (!GALLERY_ITEMS.some((existing) => existing.image === item.image)) {
    GALLERY_ITEMS.push({
      id: `gal-img-${GALLERY_ITEMS.length + 1}`,
      title: item.title,
      category: item.category,
      image: item.image,
      caption: item.caption,
      aspectClass: 'aspect-[4/3]',
      isCutout: false,
    });
  }
}

for (const imgPath of requiredNewImagesList) {
  if (!GALLERY_ITEMS.some((i) => i.image === imgPath)) {
    GALLERY_ITEMS.push({
      id: `gal-img-${GALLERY_ITEMS.length + 1}`,
      title: 'Limuru Dairy Farmers Coop Operations',
      category: 'Processing Plant',
      image: imgPath,
      caption: 'Documentary photo depicting Limuru Dairy Farmers Co-operative operations.',
      aspectClass: 'aspect-[4/3]',
      isCutout: false,
    });
  }
}

export const MEDIA_ARTICLES = [
  {
    id: 'media-1',
    date: 'November 18, 2024',
    category: 'Cooperative News',
    title: 'Limuru Dairy Commissions 134M ESL Processing Line',
    summary: 'New aseptic ESL milk packaging installation boosts daily smallholder milk intake across Kiambu County.',
    body: [
      'Limuru Dairy Farmers’ Co-operative Society has officially commissioned its advanced aseptic ESL milk processing line, backed by the World Bank NARIGP initiative.',
      'The investment increases pasteurization capacity, extends shelf life to 90 days without added preservatives, and secures higher percentage payouts directly for our 11,850 member households.',
    ],
    image: ASSET_IMAGES.plantTanks,
  },
  {
    id: 'media-2',
    date: 'October 4, 2024',
    category: 'Awards & Recognition',
    title: 'Honoured by Deputy President Kithure Kindiki',
    summary: 'Limuru Dairy recognized for achieving the highest percentage rate member payment return in Kiambu County.',
    body: [
      'During cooperative celebrations, Limuru Dairy Farmers’ Co-operative Society received top honours for transparent cooperative governance and member return rates.',
      'General Manager and board representatives accepted the award, thanking our 11,850 dedicated smallholder farmers for their unwavering commitment to quality dairy.',
    ],
    image: ASSET_IMAGES.stageHandshake,
  },
];
