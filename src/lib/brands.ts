export const ALLOWED_BRANDS = [
  'Shimano',
  'Daiwa',
  'Penn',
  'Abu Garcia',
  'Okuma',
  "Lew's",
  'Avet',
  'Accurate',
  'Van Staal',
  'Orvis',
  'Sage',
  'Hardy',
  'Ross Reels',
  'Abel Reels',
  'Lamson (Waterworks-Lamson)',
  'Nautilus Reels',
  'Hatch Outdoors',
  'Galvan Fly Reels',
  'Tibor Reels',
] as const;

export type Brand = (typeof ALLOWED_BRANDS)[number];

export const BRAND_CATEGORIES = {
  conventional: [
    'Shimano',
    'Daiwa',
    'Penn',
    'Abu Garcia',
    'Okuma',
    "Lew's",
    'Avet',
    'Accurate',
    'Van Staal',
  ],
  fly: [
    'Orvis',
    'Sage',
    'Hardy',
    'Ross Reels',
    'Abel Reels',
    'Lamson (Waterworks-Lamson)',
    'Nautilus Reels',
    'Hatch Outdoors',
    'Galvan Fly Reels',
    'Tibor Reels',
  ],
} as const;

export function isAllowedBrand(brand: string): brand is Brand {
  return (ALLOWED_BRANDS as readonly string[]).includes(brand);
}
