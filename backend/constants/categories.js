/** Canonical product categories — keep in sync with Product model enum */
const PRODUCT_CATEGORIES = [
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
  'Other',
];

const SHOP_CATEGORIES = PRODUCT_CATEGORIES.filter((c) => c !== 'Other');

module.exports = { PRODUCT_CATEGORIES, SHOP_CATEGORIES };
