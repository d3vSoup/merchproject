// src/api/cart.js
import api from '../api';

export async function getCart() {
  try {
    const res = await api.get('/api/cart');
    return res.data.items || [];
  } catch (err) {
    console.error('getCart error:', err.response?.data || err.message);
    throw err;
  }
}

export async function updateCartItem(tabKey, productId, variant, quantity, clubOrDept = null) {
  try {
    // Normalize variant: convert undefined/empty string to null
    const normalizedVariant = (variant && variant.trim() !== '') ? variant : null;
    const res = await api.post('/api/cart/update', {
      tabKey,
      productId,
      variant: normalizedVariant,
      quantity,
      clubOrDept: clubOrDept || null
    });
    return res.data;
  } catch (err) {
    console.error('updateCartItem error:', err.response?.data || err.message);
    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update cart';
    throw new Error(errorMsg);
  }
}

export async function clearCart() {
  try {
    const res = await api.post('/api/cart/clear');
    return res.data;
  } catch (err) {
    console.error('clearCart error:', err.response?.data || err.message);
    throw err;
  }
}

