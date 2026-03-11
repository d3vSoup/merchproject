// src/api/orders.js
import api from '../api';
import { withRetry, isOrderRetryable } from '../utils/withRetry';

export async function createOrder(items, totalAmount, isDelivery = false, deliveryAddress = null) {
  const res = await withRetry(
    () =>
      api.post('/api/orders/create', {
        items,
        totalAmount,
        isDelivery,
        deliveryAddress
      }),
    {
      maxRetries: 2,
      baseDelayMs: 1500,
      isRetryable: isOrderRetryable
    }
  );
  return res.data.order;
}

