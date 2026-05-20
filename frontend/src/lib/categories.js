import { Battery, Cable, Gift, Headphones, Headset, Shield, Smartphone, Speaker, Watch, Zap } from 'lucide-react';

/** Matches backend shop categories (excludes Other). Bundles last. */
export const PRODUCT_CATEGORIES = [
  'Cases',
  'Chargers',
  'Cables',
  'Earphones',
  'Screen Guards',
  'Smart Watches',
  'Speakers',
  'Headphones',
  'Power Banks',
  'Bundles',
];

const CATEGORY_META = {
  Cases: { slug: 'cases', icon: Smartphone },
  Chargers: { slug: 'chargers', icon: Zap },
  Cables: { slug: 'cables', icon: Cable },
  Earphones: { slug: 'earphones', icon: Headphones },
  'Screen Guards': { slug: 'screen-guards', icon: Shield },
  'Smart Watches': { slug: 'smart-watches', icon: Watch },
  Speakers: { slug: 'speakers', icon: Speaker },
  Headphones: { slug: 'headphones', icon: Headset },
  'Power Banks': { slug: 'power-banks', icon: Battery },
  Bundles: { slug: 'bundles', icon: Gift, highlight: true },
};

export const SHOP_CATEGORIES = PRODUCT_CATEGORIES.map((name) => ({
  name,
  ...CATEGORY_META[name],
}));

export const REGULAR_SHOP_CATEGORIES = SHOP_CATEGORIES.filter((c) => c.slug !== 'bundles');
export const BUNDLES_SHOP_CATEGORY = SHOP_CATEGORIES.find((c) => c.slug === 'bundles');

const SLUG_TO_NAME = Object.fromEntries(SHOP_CATEGORIES.map((c) => [c.slug, c.name]));

export function slugToCategoryName(slug = '') {
  const key = String(slug || '').toLowerCase();
  if (SLUG_TO_NAME[key]) return SLUG_TO_NAME[key];
  return key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isCategorySlugActive(currentSlug, categorySlug) {
  return String(currentSlug || '').toLowerCase() === String(categorySlug || '').toLowerCase();
}
