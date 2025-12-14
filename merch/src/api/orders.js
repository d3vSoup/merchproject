// src/api/orders.js
import api from '../api';

export async function createOrder(items, totalAmount) {
  const res = await api.post('/api/orders/create', {
    items,
    totalAmount
  });
  return res.data.order;
}

