// src/pages/Events/EventPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getCart, updateCartItem } from "../../api/cart";
import { Analytics } from "../../api/analytics";
import { SkeletonGrid } from "../../components/Skeleton";
import { triggerCartUpdate } from "../../hooks/useCartCount";
import toast from "react-hot-toast";
import { PRODUCT_CATALOG, BASE_PRODUCT_IDS } from "../../data/products";
import ProductModal from "../../components/ProductModal";
import WishlistHeart from "../../components/WishlistHeart";
import FlipClock from "../../components/FlipClock";
import api from "../../api";
import ProductGrid3DEntrance from "../../components/ui/ProductGrid3DEntrance";
import Antigravity from "../../components/ui/Antigravity";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const EVENT_ANTIGRAVITY_COLORS = {
  utsav: "#c0392b",
  phaseshift: "#1e3a5f",
  farouche: "#410c68",
  club: "#0f5132",
};

export default function EventPage() {
  const { eventKey } = useParams();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [productSelections, setProductSelections] = useState({});
  const [soldOutItems, setSoldOutItems] = useState({});
  const [eventStatus, setEventStatus] = useState({ type: "ongoing", countdown: null });
  const [productOverrides, setProductOverrides] = useState({});
  const [loadingSoldOut, setLoadingSoldOut] = useState(true); // Start as true - don't render until data loads
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Removed localStorage dependency - countdown is now fetched from backend

  useEffect(() => {
    let cancelled = false;
    const maxWait = 12000; // Show products after 12s even if API is slow (Render cold start)
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setLoadingSoldOut(false);
    }, maxWait);

    async function fetchSoldOutFromServer() {
      setLoadingSoldOut(true);
      try {
        const res = await api.get('/api/items/soldouts', { params: { tabKey: eventKey } });
        if (cancelled) return;
        const map = {};
        let serverStatus = null;
        
        // Sort by updated_at descending to get the most recent entry for each product
        const items = (res.data?.items || []).sort((a, b) => {
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        });
        
        // Use a Set to track which products we've already processed
        const processed = new Set();
        
        items.forEach(item => {
          // Create a unique key for this product
          const uniqueId = `${item.product_id}:${item.club_or_dept || ''}`;
          
          // Only process the most recent entry for each product
          if (processed.has(uniqueId)) return;
          processed.add(uniqueId);
          
          // Item is unavailable if:
          // 1. Event status is soldout/over/no_new_releases (whole event unavailable)
          // 2. OR individual item is marked sold_out (even if event is ongoing)
          const itemEventStatus = item.event_status || 'ongoing';
          const isEventUnavailable = 
            itemEventStatus === "soldout" || 
            itemEventStatus === "over" || 
            itemEventStatus === "no_new_releases";
          
          // Individual item sold_out takes precedence
          const isItemSoldOut = item.sold_out === true;
          
          if (isEventUnavailable || isItemSoldOut) {
            // Create multiple keys to ensure matching works
            const baseKey = `${item.tab_key}:${item.product_id}:${item.variant || "standard"}`;
            const standardKey = `${item.tab_key}:${item.product_id}:standard`;
            const nullKey = `${item.tab_key}:${item.product_id}:null`;
            
            // Set all possible key variants to ensure matching
            map[baseKey] = true;
            map[standardKey] = true;
            map[nullKey] = true;
            
            // Also set for club_or_dept if present
            if (item.club_or_dept) {
              map[`${baseKey}:${item.club_or_dept}`] = true;
              map[`${standardKey}:${item.club_or_dept}`] = true;
            }
          }
          
          // Track event-level status
          if (!serverStatus && item.tab_key === eventKey && item.event_status) {
            serverStatus = item.event_status;
          }
        });
        
        console.log('Loaded soldout items:', Object.keys(map).length, 'from', processed.size, 'unique products');
        
        // Replace soldOutItems with server data (authoritative source)
        setSoldOutItems(map);
        
        // Update event status from server response (includes countdown date)
        if (res.data?.eventStatus) {
          const serverEventStatus = res.data.eventStatus;
          setEventStatus({
            type: serverEventStatus.type || "ongoing",
            countdown: serverEventStatus.countdown || null
          });
          console.log('Event status from server:', serverEventStatus);
        } else if (serverStatus) {
          // Fallback: use status from items if eventStatus not in response
          // Try to find countdown date from items
          const countdownItem = items.find(item => 
            item.tab_key === eventKey && 
            item.event_status === "countdown" && 
            item.countdown_date
          );
          setEventStatus({
            type: serverStatus,
            countdown: countdownItem?.countdown_date || null
          });
        } else {
          // If no server status found, default to ongoing
          setEventStatus({ type: "ongoing", countdown: null });
        }
      } catch (err) {
        console.error('Failed to load sold-out data from server', err);
      } finally {
        if (!cancelled) setLoadingSoldOut(false);
      }
    }

    async function fetchOverrides() {
      try {
        const res = await api.get('/api/catalog/overrides', { params: { tabKey: eventKey } });
        const map = {};
        (res.data?.overrides || []).forEach((item) => {
          map[item.product_id] = item;
        });
        setProductOverrides(map);
      } catch (err) {
        console.error('Failed to load catalog overrides', err);
      }
    }

    fetchSoldOutFromServer();
    fetchOverrides();
    
    // Lightweight function to only fetch event status (for countdown updates)
    // This doesn't trigger loading state to avoid page refresh glitch
    async function fetchEventStatusOnly() {
      try {
        const res = await api.get('/api/items/soldouts', { params: { tabKey: eventKey } });
        
        // Only update event status, don't touch soldOutItems or loading state
        if (res.data?.eventStatus) {
          const serverEventStatus = res.data.eventStatus;
          // Only update if status or countdown actually changed to avoid unnecessary re-renders
          setEventStatus(prev => {
            if (prev.type === serverEventStatus.type && prev.countdown === serverEventStatus.countdown) {
              return prev; // No change, return same object to prevent re-render
            }
            return {
              type: serverEventStatus.type || "ongoing",
              countdown: serverEventStatus.countdown || null
            };
          });
        } else {
          // Fallback: find countdown from items
          const items = res.data?.items || [];
          const countdownItem = items.find(item => 
            item.tab_key === eventKey && 
            item.event_status === "countdown" && 
            item.countdown_date
          );
          if (countdownItem) {
            setEventStatus(prev => {
              // Only update if countdown actually changed
              if (prev.type === "countdown" && prev.countdown === countdownItem.countdown_date) {
                return prev;
              }
              return {
                type: "countdown",
                countdown: countdownItem.countdown_date
              };
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch event status:', err);
        // Silently fail - don't disrupt user experience
      }
    }
    
    // Poll for event status updates every 10 seconds (for countdown changes)
    // Only updates countdown, doesn't refresh the whole page
    const pollInterval = setInterval(() => {
      fetchEventStatusOnly();
    }, 10000); // 10 seconds
    
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      clearInterval(pollInterval);
    };
  }, [eventKey]);

  const eventProducts = useMemo(() => {
    const base = PRODUCT_CATALOG[eventKey] || [];
    const overrideList = Object.values(productOverrides);
    const hiddenIds = new Set(overrideList.filter(o => o.hidden === true || o.hidden === 'true').map(o => o.product_id));
    const mergedBase = base
      .filter(p => !hiddenIds.has(p.id))
      .map(product => {
        const override = productOverrides[product.id];
        if (!override) return product;
        return {
          ...product,
          ...(override.name ? { name: override.name } : {}),
          ...(override.description ? { description: override.description } : {}),
          ...(override.image_url ? { imageUrl: override.image_url } : {}),
          ...(override.price !== null && override.price !== undefined ? { price: Number(override.price) } : {}),
          ...(override.images ? { images: override.images } : {})
        };
      });
    const customProducts = overrideList
      .filter(o => !BASE_PRODUCT_IDS.includes(o.product_id) && !(o.hidden === true || o.hidden === 'true'))
      .map(o => ({
        id: o.product_id,
        name: o.name || 'Custom Item',
        description: o.description || '',
        price: o.price != null ? Number(o.price) : 0,
        imageUrl: o.image_url || null,
        images: o.images || [],
        sleeveOptions: [],
        previewLabel: (o.name || 'Custom').slice(0, 12),
        swatch: ['#6b7280', '#9ca3af']
      }));
    return [...mergedBase, ...customProducts];
  }, [eventKey, productOverrides]);
  const tabLabels = {
    utsav: "Utsav",
    phaseshift: "Phaseshift",
    farouche: "Farouche",
    club: "Club & Dept Merch"
  };
  const currentTabLabel = tabLabels[eventKey] || eventKey.charAt(0).toUpperCase() + eventKey.slice(1);

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  async function loadCart() {
    if (!user) return;
    try {
      const cart = await getCart();
      setCartItems(cart.map(item => ({
        tabKey: item.tab_key,
        productId: item.product_id,
        variant: item.variant,
        quantity: item.quantity,
        price: getProductPrice(item.tab_key, item.product_id),
      })));
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  }


  function getProductPrice(tabKey, productId) {
    const product = PRODUCT_CATALOG[tabKey]?.find(p => p.id === productId);
    if (tabKey === eventKey && productOverrides[productId]) {
      const overridePrice = productOverrides[productId].price;
      if (overridePrice !== undefined && overridePrice !== null) {
        return Number(overridePrice) || 0;
      }
    }
    return product?.price || 0;
  }

  async function adjustCart(tabKey, product, variant, delta) {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    const existing = cartItems.find(
      item => item.tabKey === tabKey && item.productId === product.id && (item.variant || null) === (variant || null)
    );
    const newQuantity = Math.max(0, (existing?.quantity || 0) + delta);

    try {
      await updateCartItem(tabKey, product.id, variant, newQuantity);
      await loadCart();
      triggerCartUpdate(); // Trigger cart count refresh
      if (delta > 0) {
        Analytics.cartAdd(tabKey, product.id, product.name, newQuantity);
        toast.success("Added to cart");
      } else if (newQuantity === 0) {
        toast.success("Removed from cart");
      }
    } catch (err) {
      console.error('Failed to update cart:', err);
      const errorMsg = err.message || 'Failed to update cart';
      toast.error(errorMsg);
    }
  }


  function findCartItem(tabKey, productId, variant) {
    return cartItems.find(
      item => item.tabKey === tabKey && item.productId === productId && (item.variant || null) === (variant || null)
    );
  }

  function handleVariantChange(productKey, variant) {
    setProductSelections(prev => ({ ...prev, [productKey]: variant }));
  }

  const isSoldOut = (productKey) => {
    // If loading, don't show as sold out to avoid flashing
    if (loadingSoldOut) return false;
    // If entire event is sold out/over/no_new_releases, all items are unavailable
    if (eventStatus.type === "soldout" || eventStatus.type === "over" || eventStatus.type === "no_new_releases") {
      return true;
    }
    // Check for the specific key
    if (soldOutItems[productKey]) return true;
    
    // Also check for the base key without variant (admin might save with null variant)
    // productKey format: "eventKey:productId:variant"
    const parts = productKey.split(':');
    if (parts.length >= 2) {
      const baseKey = `${parts[0]}:${parts[1]}:standard`;
      const nullVariantKey = `${parts[0]}:${parts[1]}:null`;
      if (soldOutItems[baseKey] || soldOutItems[nullVariantKey]) return true;
    }
    
    return false;
  };

  const antigravityColor = EVENT_ANTIGRAVITY_COLORS[eventKey] || EVENT_ANTIGRAVITY_COLORS.utsav;

  // Don't render until data is loaded to avoid flash
  if (loadingSoldOut) {
    return (
      <div className="event-page-with-bg">
        <div className="antigravity-bg" aria-hidden="true">
          <Antigravity
            count={300}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color={antigravityColor}
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="capsule"
            fieldStrength={10}
          />
        </div>
        <section className="product-section">
          <div className="section-heading">Merch line-up</div>
          <SkeletonGrid />
        </section>
      </div>
    );
  }

  return (
    <div className="event-page-with-bg">
      <div className="antigravity-bg" aria-hidden="true">
        <Antigravity
          count={300}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color={antigravityColor}
          autoAnimate
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
        />
      </div>
      <section className="product-section">
      <div className="section-heading">
        Merch line-up
        {eventStatus.type === "soldout" && (
          <span className="event-soldout" style={{ marginLeft: "16px", fontSize: "0.85rem", color: "#ef4444", fontWeight: 600 }}>
            SOLD OUT
          </span>
        )}
      </div>

      {eventStatus.type === "countdown" && eventStatus.countdown && (
        <FlipClock targetDate={eventStatus.countdown} />
      )}

      <div className="product-grid-wrapper">
        <ProductGrid3DEntrance>
        {eventProducts.map((product) => {
          const defaultVariant = product.sleeveOptions?.[0] || null;
          const productKey = `${eventKey}:${product.id}`;
          const selectedVariant = productSelections[productKey] || defaultVariant;
          const variant = selectedVariant;
          const itemKey = `${eventKey}:${product.id}:${variant || "standard"}`;
          const isProductSoldOut = isSoldOut(itemKey);
          const cartItem = findCartItem(eventKey, product.id, variant);
          const quantity = cartItem?.quantity || 0;

          return (
            <article
              key={productKey}
              className={`product-card ${isProductSoldOut ? "is-soldout" : ""}`}
              data-product-key={productKey}
              style={isProductSoldOut ? { pointerEvents: 'none', opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <div
                className="product-card__preview"
                style={{
                  background: product.imageUrl
                    ? `url(${product.imageUrl}) center/cover`
                    : `linear-gradient(135deg, ${product.swatch[0]}, ${product.swatch[1]})`,
                  cursor: isProductSoldOut ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !isProductSoldOut && setSelectedProduct(product)}
              >
                {isProductSoldOut && <div className="sold-out-overlay">UNAVAILABLE</div>}
                {!product.imageUrl && <span>{product.previewLabel || product.name}</span>}
                <WishlistHeart
                  tabKey={eventKey}
                  productId={product.id}
                  variant={variant}
                  productName={product.name}
                />
              </div>
              <div className="product-card__meta">
                <h3 
                  style={{ cursor: isProductSoldOut ? 'not-allowed' : 'pointer' }}
                  onClick={() => !isProductSoldOut && setSelectedProduct(product)}
                >
                  {product.name}
                </h3>
                <p>{product.description}</p>
                <div className="product-card__price-row">
                  <span className="product-card__price">{formatPrice(product.price)}</span>
                  <span className="product-card__badge">{currentTabLabel}</span>
                </div>
                {product.sleeveOptions && product.sleeveOptions.length > 1 && (
                  <div className="variant-toggle" role="group" aria-label={`${product.name} sleeve`}>
                    {product.sleeveOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`variant-chip ${selectedVariant === opt ? "is-active" : ""}`}
                        onClick={() => handleVariantChange(productKey, opt)}
                        disabled={isProductSoldOut}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="product-card__controls">
                <div className="qty-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => adjustCart(eventKey, product, variant, -1)}
                    disabled={quantity === 0 || isProductSoldOut}
                    aria-label={`Remove one ${product.name}`}
                  >
                    -
                  </button>
                  <span className="qty-count">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => adjustCart(eventKey, product, variant, 1)}
                    disabled={isProductSoldOut}
                    aria-label={`Add one ${product.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => adjustCart(eventKey, product, variant, 1)}
                  disabled={isProductSoldOut}
                >
                  {isProductSoldOut ? "Unavailable" : "Add to cart"}
                </button>
              </div>
            </article>
          );
        })}
        </ProductGrid3DEntrance>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          tabKey={eventKey}
          onClose={() => setSelectedProduct(null)}
          isProductSoldOut={isSoldOut(`${eventKey}:${selectedProduct.id}:${productSelections[`${eventKey}:${selectedProduct.id}`] || selectedProduct.sleeveOptions?.[0] || 'standard'}`)}
        />
      )}
      </section>
    </div>
  );
}


