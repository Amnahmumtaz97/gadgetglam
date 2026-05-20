const ASSET_BASE = '/assets/';

export const realProductImages = {
  cases: [
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=82',
  ],
  chargers: [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=82',
  ],
  cables: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=82',
  ],
  earphones: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82',
  ],
  'screen guards': [
    `${ASSET_BASE}gg-screen-guard.svg`,
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=82',
  ],
  bundles: [
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=82',
  ],
  'smart watches': [
    'https://images.unsplash.com/photo-1523275335684-378980b3693b?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1544112474-2cdc81a5c677?auto=format&fit=crop&w=900&q=82',
  ],
  speakers: [
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1545454679-3531b543cbeb?auto=format&fit=crop&w=900&q=82',
  ],
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=82',
  ],
  'power banks': [
    'https://images.unsplash.com/photo-1609096458733-95b38583ac4e?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=82',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=900&q=82',
  ],
  default: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82',
  ],
};

export const referenceMockups = {
  cases: `${ASSET_BASE}gg-phone-case.svg`,
  chargers: `${ASSET_BASE}gg-charger.svg`,
  cables: `${ASSET_BASE}gg-charger.svg`,
  earphones: `${ASSET_BASE}gg-earbuds.svg`,
  earbuds: `${ASSET_BASE}gg-earbuds.svg`,
  headphones: `${ASSET_BASE}gg-headphones.svg`,
  speakers: `${ASSET_BASE}gg-speaker.svg`,
  'smart watches': `${ASSET_BASE}gg-smart-watch.svg`,
  watches: `${ASSET_BASE}gg-smart-watch.svg`,
  'screen guards': `${ASSET_BASE}gg-screen-guard.svg`,
  'screen-guards': `${ASSET_BASE}gg-screen-guard.svg`,
  bundles: `${ASSET_BASE}gg-phone-case.svg`,
  'smart watches': `${ASSET_BASE}gg-smart-watch.svg`,
  'smart-watches': `${ASSET_BASE}gg-smart-watch.svg`,
  speakers: `${ASSET_BASE}gg-speaker.svg`,
  'power banks': `${ASSET_BASE}gg-charger.svg`,
  'power-banks': `${ASSET_BASE}gg-charger.svg`,
  default: `${ASSET_BASE}gg-phone-case.svg`,
};

export function getReferenceMockup(category) {
  const key = String(category || '').trim().toLowerCase();
  return referenceMockups[key] || referenceMockups.default;
}

function getCategoryKey(category) {
  const key = String(category || '').trim().toLowerCase();
  if (key === 'screen-guards') return 'screen guards';
  if (key === 'smart-watches') return 'smart watches';
  if (key === 'power-banks') return 'power banks';
  if (key === 'earbuds') return 'earphones';
  return realProductImages[key] ? key : 'default';
}

function getStableIndex(product) {
  const raw = String(product?._id || product?.slug || product?.name || '');
  return raw.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getRealProductFallback(product) {
  const key = getCategoryKey(product?.category);
  const bank = realProductImages[key] || realProductImages.default;
  return bank[getStableIndex(product) % bank.length];
}

/** Known dead or misleading CDN URLs — skip so category fallback applies */
const BLOCKED_IMAGE_SUBSTRINGS = [
  'photo-1601504658430-97b3d76d5a48',
  'source.unsplash.com',
];

export function isUsableImage(url = '') {
  const s = String(url);
  if (BLOCKED_IMAGE_SUBSTRINGS.some((part) => s.includes(part))) return false;
  return /^https?:\/\//i.test(s) || s.startsWith('/') || s.startsWith('data:');
}

export function getProductDisplayImage(product) {
  if (!product) return realProductImages.default[0];
  if (isUsableImage(product.thumbnail)) return product.thumbnail;
  const galleryImage = (product.images || []).find(isUsableImage);
  if (galleryImage) return galleryImage;
  return getRealProductFallback(product);
}

export function getProductGallery(product) {
  if (!product) return realProductImages.default;
  const gallery = (product.images || []).filter(isUsableImage);
  if (gallery.length) return gallery;
  if (isUsableImage(product.thumbnail)) return [product.thumbnail];
  return [getRealProductFallback(product)];
}
