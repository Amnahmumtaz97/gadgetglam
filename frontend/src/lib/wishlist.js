const STORAGE_KEY = 'gg_wishlist';

export function getLocalWishlistIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function setLocalWishlistIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('gg:wishlist-updated'));
}

export function toggleLocalWishlist(productId) {
  const list = getLocalWishlistIds();
  const exists = list.includes(productId);
  const next = exists ? list.filter((id) => id !== productId) : [...list, productId];
  setLocalWishlistIds(next);
  return !exists;
}

export function isInLocalWishlist(productId) {
  return getLocalWishlistIds().includes(productId);
}

/** Merge server wishlist into local storage when user is logged in. */
export async function syncWishlistFromServer(axios) {
  try {
    const { data } = await axios.get('/api/users/wishlist');
    const serverIds = (data.wishlist || []).map(String);
    if (serverIds.length) {
      const merged = [...new Set([...getLocalWishlistIds(), ...serverIds])];
      setLocalWishlistIds(merged);
    }
    return getLocalWishlistIds();
  } catch {
    return getLocalWishlistIds();
  }
}

export async function toggleWishlist(productId, axios, isLoggedIn) {
  const addedLocally = toggleLocalWishlist(productId);
  if (isLoggedIn) {
    try {
      const { data } = await axios.post(`/api/users/wishlist/${productId}`);
      setLocalWishlistIds((data.wishlist || []).map(String));
      return data.wishlist?.includes(productId) ?? addedLocally;
    } catch {
      return addedLocally;
    }
  }
  return addedLocally;
}
