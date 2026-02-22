import api from '../api';

let sessionId = null;
function getSessionId() {
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  return sessionId;
}

export async function trackEvent(eventType, payload = {}) {
  try {
    await api.post('/api/analytics/track', {
      eventType,
      payload,
      sessionId: getSessionId(),
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics track failed:', err?.message);
    }
  }
}

export const Analytics = {
  pageView: (path, title) => trackEvent('page_view', { path, title }),
  productView: (tabKey, productId, name) => trackEvent('product_view', { tabKey, productId, name }),
  cartAdd: (tabKey, productId, name, quantity) => trackEvent('cart_add', { tabKey, productId, name, quantity }),
  checkoutStart: (itemCount, total) => trackEvent('checkout_start', { itemCount, total }),
  orderPlaced: (orderId, total) => trackEvent('order_placed', { orderId, total }),
  wishlistAdd: (tabKey, productId, name) => trackEvent('wishlist_add', { tabKey, productId, name }),
};
