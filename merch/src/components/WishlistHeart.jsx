// src/components/WishlistHeart.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const WISHLIST_UPDATE_EVENT = 'wishlist-update';

export function triggerWishlistUpdate() {
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATE_EVENT));
}

export default function WishlistHeart({ tabKey, productId, variant, onWishlistChange }) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsWishlisted(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/wishlist');
        const items = res.data?.items || [];
        const found = items.some(
          item => item.tab_key === tabKey &&
            item.product_id === productId &&
            (item.variant || null) === (variant || null)
        );
        if (!cancelled) setIsWishlisted(found);
      } catch {
        if (!cancelled) setIsWishlisted(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, tabKey, productId, variant]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to add items to wishlist");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post('/api/wishlist/toggle', {
        tabKey,
        productId,
        variant
      });
      setIsWishlisted(res.data.added);
      triggerWishlistUpdate();
      onWishlistChange?.(res.data.added);
      toast.success(res.data.added ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      toast.error(err.message || "Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      type="button"
      className={`wishlist-btn wishlist-btn--card ${isWishlisted ? 'is-active' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={isWishlisted ? `Remove from wishlist` : `Add to wishlist`}
    >
      {isWishlisted ? '♥' : '♡'}
    </button>
  );
}
