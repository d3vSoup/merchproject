// src/api/wishlist.js
import api from '../api';
import { withRetry } from '../utils/withRetry';

export async function getWishlist() {
  const res = await withRetry(() => api.get('/api/wishlist'));
  return res.data.items || [];
}

export async function toggleWishlist(tabKey, productId, variant) {
  const res = await withRetry(() =>
    api.post('/api/wishlist/toggle', {
      tabKey,
      productId,
      variant: variant || null
    })
  );
  return res.data;
}

