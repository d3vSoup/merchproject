// src/api/wishlist.js
import api from '../api';

export async function getWishlist() {
  const res = await api.get('/api/wishlist');
  return res.data.items || [];
}

export async function toggleWishlist(tabKey, productId, variant) {
  const res = await api.post('/api/wishlist/toggle', {
    tabKey,
    productId,
    variant: variant || null
  });
  return res.data;
}

