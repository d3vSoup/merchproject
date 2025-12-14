// src/hooks/useCartCount.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { getCart } from "../api/cart";

// Global event system for cart updates
const cartUpdateListeners = new Set();

export function triggerCartUpdate() {
  cartUpdateListeners.forEach(listener => listener());
}

export function useCartCount() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const cart = await getCart();
      const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalCartItems);
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  }, [user]);

  useEffect(() => {
    loadCounts();
    
    // Listen for cart updates
    cartUpdateListeners.add(loadCounts);
    return () => {
      cartUpdateListeners.delete(loadCounts);
    };
  }, [loadCounts]);

  return { cartCount, refresh: loadCounts };
}

