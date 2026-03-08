// src/components/WishlistHeart.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import api from '../api';
import { Analytics } from '../api/analytics';
import toast from 'react-hot-toast';

const WISHLIST_UPDATE_EVENT = 'wishlist-update';

export function triggerWishlistUpdate() {
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATE_EVENT));
}

export default function WishlistHeart({ tabKey, productId, variant, productName, onWishlistChange }) {
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
      const added = res.data.added;
      setIsWishlisted(added);
      triggerWishlistUpdate();
      onWishlistChange?.(added);

      if (added) {
        const badge = document.querySelector('.wishlist-badge');
        if (badge) {
          badge.classList.remove('bump');
          void badge.offsetWidth;
          badge.classList.add('bump');
        }
      }

      if (added) Analytics.wishlistAdd(tabKey, productId, productName || '');

      toast.success(
        (t) => (
          <span role="status" aria-live="polite">
            {added ? 'Added to wishlist' : 'Removed from wishlist'}
            {added && (
              <>
                {' · '}
                <a
                  href="/wishlist"
                  onClick={(ev) => { ev.preventDefault(); toast.dismiss(t.id); window.location.href = '/wishlist'; }}
                  style={{ color: 'var(--c-primary, #ff6600)', fontWeight: 600 }}
                >
                  View wishlist
                </a>
              </>
            )}
          </span>
        ),
        { duration: 2500 }
      );
    } catch (err) {
      toast.error(err.message || "Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <motion.button
      type="button"
      className={`wishlist-btn wishlist-btn--card ${isWishlisted ? 'is-active' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isWishlisted}
      initial={false}
      animate={isWishlisted ? { scale: [1, 1.2, 1], rotate: [0, -10, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.35 }}
    >
      {isWishlisted ? '♥' : '♡'}
    </motion.button>
  );
}
