// src/api/orders.js
import api from '../api';
import { withRetry, isOrderRetryable } from '../utils/withRetry';

export async function createOrder(items, totalAmount) {
  const res = await withRetry(
    () =>
      api.post('/api/orders/create', {
        items,
        totalAmount
      }),
    {
      maxRetries: 2,
      baseDelayMs: 1500,
      isRetryable: isOrderRetryable
    }
  );
  return res.data.order;
}

