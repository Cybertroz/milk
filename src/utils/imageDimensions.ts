export interface ImageDimension {
  width: number;
  height: number;
}

const IMAGE_DIMENSIONS_BY_PATH: Record<string, ImageDimension> = {
  '/assets/aistudio/150-removebg-preview__1__d91627ef.png': { width: 612, height: 408 },
  '/assets/aistudio/1litre_s-removebg-preview__2__ca6944ba.png': { width: 408, height: 612 },
  '/assets/aistudio/1ltr-removebg-preview__2__-_Copy_df92a049.png': { width: 408, height: 612 },
  '/assets/aistudio/250-removebg-preview_f9a7124d.png': { width: 612, height: 408 },
  '/assets/aistudio/250_straw-removebg-preview__1__1cee3171.png': { width: 612, height: 408 },
  '/assets/aistudio/2litre-removebg-preview__1__5e0b4ed9.png': { width: 348, height: 717 },
  '/assets/aistudio/500-removebg-preview__5__bfe74132.png': { width: 612, height: 408 },
  '/assets/aistudio/500_straw-removebg-preview__1__9f36e748.png': { width: 408, height: 612 },
  '/assets/aistudio/5litre-removebg-preview__1__8281a889.png': { width: 408, height: 612 },
  '/assets/aistudio/DSC_0127_fbb33261.jpg': { width: 1800, height: 931 },
  '/assets/aistudio/IMG_0389_4e8dfba6.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0398_1317e502.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0408__2__4b74aca0.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0409_d1493bb1.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0419_7e68ca6e.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0428__2__e7f6b55c.JPG': { width: 4000, height: 6000 },
  '/assets/aistudio/IMG_0433__2__64b262cd.JPG': { width: 4000, height: 6000 },
  '/assets/aistudio/IMG_0455_c747daf8.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0472_590e4c9e.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0496_bd6e1da1.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0505_1e6fb00e.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_0509__2__49c79c68.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_4751_6b954f0d.jpg': { width: 2849, height: 2560 },
  '/assets/aistudio/IMG_5021-removebg-preview__1__3ac120c3.png': { width: 367, height: 679 },
  '/assets/aistudio/IMG_5029-removebg-preview__1___1__7ac7d5e9.png': { width: 408, height: 612 },
  '/assets/aistudio/IMG_5759_37aab0de.JPG': { width: 3984, height: 2656 },
  '/assets/aistudio/IMG_5958_7709b32c.JPG': { width: 3984, height: 2656 },
  '/assets/aistudio/IMG_6293_7a029c5c.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_6295_27a85e44.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_6303_489ddcb8.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_6314_059ee2dd.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_6325_5237ff89.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_7707__2__26f52958.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_7773_2424efcb.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_7781__2__1f70f768.JPG': { width: 4442, height: 3902 },
  '/assets/aistudio/IMG_7815__2__66751618.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_7832_f32eaf76.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_8003_9838f803.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_8104_c231dfd9.jpg': { width: 4096, height: 3658 },
  '/assets/aistudio/IMG_8106_dd212b3b.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_8113_8a54a225.jpg': { width: 5488, height: 4000 },
  '/assets/aistudio/IMG_8883_4b8bedb4.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_8904_086f8e12.jpg': { width: 4000, height: 4359 },
  '/assets/aistudio/IMG_8909_b50584ef.jpg': { width: 4000, height: 6000 },
  '/assets/aistudio/IMG_8924_f52553d9.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_8980_58a394cd.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/IMG_9045_2e1e054e.jpg': { width: 6000, height: 4000 },
  '/assets/aistudio/LIMURU_FRESH_LOGO__2__-_Copy_726569a9.png': { width: 1844, height: 1141 },
  '/assets/aistudio/Maziwa_hse_555665bd.jpeg': { width: 854, height: 1202 },
  '/assets/aistudio/Scrolling_Vet_-_Copy_0deeb412.jpg': { width: 1024, height: 683 },
  '/assets/aistudio/_DSC1622_2d268ac1.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/_DSC1625_b3b69202.JPG': { width: 4000, height: 6000 },
  '/assets/aistudio/_DSC1634_a8af3e20.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/_DSC1663_662fa75b.JPG': { width: 6000, height: 4000 },
  '/assets/aistudio/_MG_9703_8fc03d2e.JPG': { width: 4272, height: 2848 },
  '/assets/aistudio/edit_21_017b5c23.JPG': { width: 3984, height: 2656 },
  '/assets/aistudio/esl_art_8d78dfe3.png': { width: 1352, height: 645 },
  '/assets/aistudio/lemon_design_b_0ba95b62.png': { width: 683, height: 1024 },
  '/assets/aistudio/limda_group-removebg-preview__2__-_Copy_b1e2a916.png': { width: 252, height: 639 },
  '/assets/aistudio/maziwa-1__2_-removebg-preview__5__ef5427d8.png': { width: 223, height: 264 },
  '/assets/aistudio/milk_cartons_f9659651.jpeg': { width: 1600, height: 1200 },
  '/assets/aistudio/passion_design_b_4ff26a5f.png': { width: 1686, height: 2528 },
};

export function getImageDimensions(src: string): ImageDimension {
  const cleanPath = src.split('?')[0];
  if (IMAGE_DIMENSIONS_BY_PATH[cleanPath]) {
    return IMAGE_DIMENSIONS_BY_PATH[cleanPath];
  }
  const idx = cleanPath.indexOf('/assets/aistudio/');
  if (idx !== -1) {
    const sub = cleanPath.slice(idx);
    if (IMAGE_DIMENSIONS_BY_PATH[sub]) {
      return IMAGE_DIMENSIONS_BY_PATH[sub];
    }
  }
  return { width: 800, height: 600 };
}
