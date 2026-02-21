// src/hooks/useSortPreference.js
import { useState, useEffect, useCallback } from 'react';

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'event_asc', label: 'Event: A–Z' },
  { value: 'event_desc', label: 'Event: Z–A' },
];

export { SORT_OPTIONS };

export function useSortPreference(storageKey, defaultSort = 'price_asc') {
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || defaultSort;
    } catch {
      return defaultSort;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, sortBy);
    } catch (e) {
      console.warn('Could not save sort preference:', e);
    }
  }, [storageKey, sortBy]);

  const changeSort = useCallback((value) => {
    setSortBy(value);
  }, []);

  return [sortBy, changeSort];
}

export function sortItems(items, sortBy, getPrice = (i) => i.price, getEventLabel = (i) => i.eventLabel || '') {
  if (!items?.length) return items;
  const arr = [...items];
  switch (sortBy) {
    case 'price_asc':
      return arr.sort((a, b) => getPrice(a) - getPrice(b));
    case 'price_desc':
      return arr.sort((a, b) => getPrice(b) - getPrice(a));
    case 'event_asc':
      return arr.sort((a, b) => (getEventLabel(a) || '').localeCompare(getEventLabel(b) || ''));
    case 'event_desc':
      return arr.sort((a, b) => (getEventLabel(b) || '').localeCompare(getEventLabel(a) || ''));
    default:
      return arr;
  }
}
