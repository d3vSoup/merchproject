// src/pages/Wishlist/WishlistPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import { SkeletonGrid } from "../../components/Skeleton";
import { updateCartItem } from "../../api/cart";
import { triggerCartUpdate } from "../../hooks/useCartCount";
import { PRODUCT_CATALOG } from "../../data/products";
import toast from "react-hot-toast";
import "./WishlistPage.css";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export default function WishlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productOverrides, setProductOverrides] = useState({});

  useEffect(() => {
    if (user) {
      async function init() {
        const overrides = await loadOverrides();
        await loadWishlist(overrides);
      }
      init();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [user]);

  // Reload wishlist when overrides change (after initial load)
  useEffect(() => {
    if (user && Object.keys(productOverrides).length > 0) {
      loadWishlist(productOverrides);
    }
  }, [productOverrides]);

  async function loadOverrides() {
    try {
      // Load overrides for all tabs
      const tabs = ['utsav', 'phaseshift', 'farouche', 'club'];
      const allOverrides = {};
      
      for (const tab of tabs) {
        try {
          const res = await api.get('/api/catalog/overrides', { params: { tabKey: tab } });
          (res.data?.overrides || []).forEach(override => {
            allOverrides[`${override.tab_key}:${override.product_id}`] = override;
          });
        } catch (err) {
          console.warn(`Failed to load overrides for ${tab}:`, err);
        }
      }
      
      setProductOverrides(allOverrides);
      return allOverrides;
    } catch (err) {
      console.error('Failed to load product overrides:', err);
      return {};
    }
  }

  async function loadWishlist(currentOverrides = null) {
    if (!user) return;
    setLoading(true);
    try {
      // Use passed overrides or current state
      const overrides = currentOverrides || productOverrides;
      
      const res = await api.get('/api/wishlist');
      const wishlist = res.data?.items || [];
      const eventLabels = {
        utsav: "Utsav",
        phaseshift: "Phaseshift",
        farouche: "Farouche",
        club: "Club & Dept"
      };
      const items = wishlist.map(item => {
        const product = PRODUCT_CATALOG[item.tab_key]?.find(p => p.id === item.product_id);
        const overrideKey = `${item.tab_key}:${item.product_id}`;
        const override = overrides[overrideKey];
        const eventLabel = eventLabels[item.tab_key] || item.tab_key;
        
        // Use override image if available (can be single URL or array)
        let imageUrl = product?.imageUrl;
        if (override) {
          if (override.images && override.images.length > 0) {
            // Use first image from array
            imageUrl = override.images[0];
          } else if (override.image_url) {
            imageUrl = override.image_url;
          }
        }
        
        return {
          tabKey: item.tab_key,
          productId: item.product_id,
          variant: item.variant,
          name: override?.name || product?.name || "Unknown",
          description: override?.description || product?.description || "",
          price: override?.price !== null && override?.price !== undefined 
            ? Number(override.price) 
            : (product?.price || 0),
          swatch: product?.swatch || ["#2a2a2a", "#1a1a1a"],
          imageUrl: imageUrl,
          previewLabel: product?.previewLabel,
          eventLabel: eventLabel,
          sleeveOptions: product?.sleeveOptions || [],
        };
      });
      setWishlistItems(items);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item) {
    if (!user) return;
    try {
      await api.post('/api/wishlist/toggle', {
        tabKey: item.tabKey,
        productId: item.productId,
        variant: item.variant
      });
      await loadWishlist(productOverrides);
      toast.success("Removed from wishlist");
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      toast.error('Failed to remove from wishlist');
    }
  }

  async function addToCart(item) {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }
    try {
      await updateCartItem(item.tabKey, item.productId, item.variant, 1);
      triggerCartUpdate();
      toast.success("Added to cart");
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error(err.message || 'Failed to add to cart');
    }
  }

  if (loading) {
    return (
      <div className="wishlist-page">
        <div style={{ padding: "24px 0" }}><SkeletonGrid count={4} /></div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-header">
          <h1 className="wishlist-title">Your Wishlist</h1>
        </div>
        <div className="wishlist-empty">
          <div className="wishlist-empty__icon">♡</div>
          <p className="wishlist-empty__text">Your wishlist is empty</p>
          <button className="btn btn--primary" onClick={() => navigate("/")}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1 className="wishlist-title">Your Wishlist</h1>
        <p className="wishlist-count">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div className="wishlist-grid">
        {wishlistItems.map((item, idx) => (
          <article key={idx} className="wishlist-card">
            <div
              className="wishlist-card__image"
              style={{
                background: item.imageUrl
                  ? `url(${item.imageUrl}) center/cover`
                  : `linear-gradient(135deg, ${item.swatch[0]}, ${item.swatch[1]})`,
              }}
            >
              {!item.imageUrl && <span>{item.previewLabel || item.name}</span>}
            </div>
            
            <button
              className="wishlist-card__remove"
              onClick={() => removeItem(item)}
              aria-label={`Remove ${item.name} from wishlist`}
            >
              ✕
            </button>
            
            <div className="wishlist-card__content">
              <h3 className="wishlist-card__name">{item.name}</h3>
              <p className="wishlist-card__desc">{item.description}</p>
              
              <div className="wishlist-card__meta">
                <span className="wishlist-card__price">{formatPrice(item.price)}</span>
                <span className="wishlist-card__event">{item.eventLabel}</span>
              </div>
              
              {item.variant && (
                <p className="wishlist-card__variant">{item.variant}</p>
              )}
              
              <div className="wishlist-card__actions">
                <button
                  className="btn btn--primary"
                  onClick={() => addToCart(item)}
                >
                  Add to Cart
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => navigate(`/event/${item.tabKey}`)}
                >
                  View
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
