// src/hooks/useCartWishlistCounts.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { getCart } from "../api/cart";
import { getWishlist } from "../api/wishlist";

// Global event system for cart/wishlist updates
const cartUpdateListeners = new Set();

export function triggerCartUpdate() {
  cartUpdateListeners.forEach(listener => listener());
}

export function useCartWishlistCounts() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    try {
      const cart = await getCart();
      const wishlist = await getWishlist();

      const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalCartItems);
      setWishlistCount(wishlist.length || 0);
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

  return { cartCount, wishlistCount, refresh: loadCounts };
}

