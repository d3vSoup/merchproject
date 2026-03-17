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
import FadeInSection from "../../components/ui/FadeInSection";
import GlareHover from "../../components/ui/GlareHover";
import RotatingText from "../../components/ui/RotatingText";
import EventDetailsSection from "../../components/EventDetailsSection";
import TextType from "../../components/ui/TextType";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const MERCH_HEADING_TEXTS = [
  "Limited Drops",
  "Campus Drip",
  "Fresh Fits",
  "New Arrivals",
  "Event Exclusives",
  "Student Essentials",
];

export default function EventPage() {
  const { eventKey } = useParams();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [productSelections, setProductSelections] = useState({});
  const [soldOutItems, setSoldOutItems] = useState({});
  const [limitedItems, setLimitedItems] = useState({});
  const [eventStatus, setEventStatus] = useState({ type: "ongoing", countdown: null });
  const [productOverrides, setProductOverrides] = useState({});
  const [loadingSoldOut, setLoadingSoldOut] = useState(true); // Start as true - don't render until data loads
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [heroCarouselIdx, setHeroCarouselIdx] = useState(0);
  const [trendingStatus, setTrendingStatus] = useState({});

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
        const limitMap = {};
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
          const isItemLimited = item.limited === true;
          
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

          if (isItemLimited) {
            const baseKey = `${item.tab_key}:${item.product_id}:${item.variant || "standard"}`;
            const standardKey = `${item.tab_key}:${item.product_id}:standard`;
            const nullKey = `${item.tab_key}:${item.product_id}:null`;
            
            limitMap[baseKey] = true;
            limitMap[standardKey] = true;
            limitMap[nullKey] = true;
            
            if (item.club_or_dept) {
              limitMap[`${baseKey}:${item.club_or_dept}`] = true;
              limitMap[`${standardKey}:${item.club_or_dept}`] = true;
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
        setLimitedItems(limitMap);
        
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

    async function fetchTrendingStatus() {
      try {
        const res = await api.get('/api/catalog/overrides', { params: { tabKey: 'system' } });
        if (cancelled) return;
        const trendingOverride = res.data?.overrides?.find(o => o.product_id === 'trending_status');
        if (trendingOverride && trendingOverride.description) {
          try {
            setTrendingStatus(JSON.parse(trendingOverride.description));
          } catch(e) {}
        }
      } catch (err) {
        console.error('Failed to load trending status', err);
      }
    }

    Promise.all([
      fetchSoldOutFromServer(),
      fetchOverrides(),
      fetchTrendingStatus()
    ]).finally(() => {
      if (!cancelled) setLoadingSoldOut(false);
    });

    async function fetchEventDetails() {
      try {
        const res = await api.get('/api/event-details', { params: { tabKey: eventKey } });
        if (!cancelled) setEventDetails(res.data?.eventDetails || null);
      } catch (err) {
        if (!cancelled) setEventDetails(null);
      }
    }
    fetchEventDetails();
    
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

  const isLimited = (productKey) => {
    if (loadingSoldOut) return false;
    if (limitedItems[productKey]) return true;
    const parts = productKey.split(':');
    if (parts.length >= 2) {
      const baseKey = `${parts[0]}:${parts[1]}:standard`;
      const nullVariantKey = `${parts[0]}:${parts[1]}:null`;
      if (limitedItems[baseKey] || limitedItems[nullVariantKey]) return true;
    }
    return false;
  };

  // Collect all product images for the hero carousel (must be before early return to satisfy Rules of Hooks)
  const heroImages = eventProducts
    .flatMap(p => p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : [])
    .filter(Boolean);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setHeroCarouselIdx(i => (i + 1) % heroImages.length), 2500);
    return () => clearInterval(t);
  }, [heroImages.length]);

  // Don't render until data is loaded to avoid flash
  if (loadingSoldOut) {
    return (
      <section className="product-section">
        <SkeletonGrid />
      </section>
    );
  }

  const eventTitles = {
    utsav: "Utsav",
    phaseshift: "Phaseshift",
    farouche: "Farouche",
  };
  const eventTitle = eventTitles[eventKey] || currentTabLabel;
  const showCountdown = eventStatus.type === "countdown" && eventStatus.countdown;

  const mainStageHeadlines = [
    "MADE FOR THE MAIN STAGE",
    "LIMITED EDITION DROPS",
    "WEAR THE ENERGY",
    "EXCLUSIVE EVENT MERCH",
  ];



  return (
    <section className="product-section event-page">
      {showCountdown && (
        <>
          <div className={`made-for-main-stage made-for-main-stage--${eventKey}`}>
            <div className="made-for-main-stage__content">
              <div className="made-for-main-stage__text">
                <h2 className="made-for-main-stage__headline">
                  <RotatingText
                    texts={mainStageHeadlines}
                    mainClassName="made-for-main-stage__rotate"
                    splitBy="words"
                    rotationInterval={2500}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-120%", opacity: 0 }}
                  />
                </h2>
                <p className="made-for-main-stage__desc">
                  Every piece in the {eventTitle} collection is designed to survive the mosh pits and the after-parties. Don&apos;t just attend the event, wear the energy.
                </p>
                <div className="made-for-main-stage__social">
                  <span className="made-for-main-stage__avatars">●●●</span>
                  <span>+500 STUDENTS HAVE JOINED THE WAITLIST</span>
                </div>
              </div>
              <div className="made-for-main-stage__visual">
                <div className="made-for-main-stage__box made-for-main-stage__box--base" />
                <div className="made-for-main-stage__box made-for-main-stage__box--top" style={{ overflow: 'hidden', position: 'relative' }}>
                  {heroImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="made-for-main-stage__product-img"
                      style={{
                        backgroundImage: `url(${src})`,
                        position: 'absolute',
                        inset: 0,
                        opacity: idx === heroCarouselIdx ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                      }}
                    />
                  ))}
                  {heroImages.length === 0 && eventProducts[0]?.imageUrl && (
                    <div
                      className="made-for-main-stage__product-img"
                      style={{ backgroundImage: `url(${eventProducts[0].imageUrl})` }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="event-hero-countdown made-for-main-stage__countdown">
              <FlipClock targetDate={eventStatus.countdown} />
            </div>
          </div>
        </>
      )}

      {!showCountdown && (
        <div className="event-collection-header">
          <div className="section-heading">
            <RotatingText
              texts={MERCH_HEADING_TEXTS}
              mainClassName="section-heading__rotate"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="section-heading__rotate-split"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2500}
            />
            {eventStatus.type === "soldout" && (
              <span className="event-soldout">SOLD OUT</span>
            )}
          </div>
          <p className="event-collection-subtitle">
            Exclusive apparel designed for the culture.
            {trendingStatus[eventKey] && (
              <span 
                className="trending-tag"
                style={{ color: '#ef4444', fontSize: '1rem', marginLeft: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} 
              >
                Trending 🔥
              </span>
            )}
          </p>
        </div>
      )}

      {showCountdown && (
        <div className="event-collection-header event-collection-header--below-hero">
          <h3 className="event-collection-title">
            The {eventTitle} Collection
            {trendingStatus[eventKey] && (
              <span 
                className="trending-tag"
                style={{ color: '#ef4444', fontSize: 'clamp(1rem, 2vw, 1.3rem)', marginLeft: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} 
              >
                Trending 🔥
              </span>
            )}
          </h3>
          <p className="event-collection-subtitle">Exclusive apparel designed for the culture.</p>
        </div>
      )}

      <div className="product-grid-wrapper">
        <div className="product-grid">
        {eventProducts.map((product, idx) => {
          const defaultVariant = product.sleeveOptions?.[0] || null;
          const productKey = `${eventKey}:${product.id}`;
          const selectedVariant = productSelections[productKey] || defaultVariant;
          const variant = selectedVariant;
          const itemKey = `${eventKey}:${product.id}:${variant || "standard"}`;
          const isProductSoldOut = isSoldOut(itemKey);
          const isProductLimited = isLimited(itemKey);
          const cartItem = findCartItem(eventKey, product.id, variant);
          const quantity = cartItem?.quantity || 0;
          const showLimitedBadge = showCountdown && idx === 0 && !isProductSoldOut;

          return (
            <FadeInSection key={productKey} as="div" className="product-grid__card">
            <GlareHover
              fill
              width="100%"
              height="100%"
              borderRadius="20px"
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="product-card-glare"
            >
            <article
              className={`product-card ${isProductSoldOut ? "is-soldout" : ""} ${showLimitedBadge ? "product-card--featured" : ""}`}
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
                {showLimitedBadge && <span className="product-card__badge-tag">Limited</span>}
                {isProductSoldOut && <div className="sold-out-overlay">UNAVAILABLE</div>}
                {!isProductSoldOut && isProductLimited && <div className="limited-overlay" style={{ position: 'absolute', top: '10px', right: '10px', background: '#FF6B00', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10, letterSpacing: '1px' }}>LIMITED</div>}
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
            </GlareHover>
            </FadeInSection>
          );
        })}
        </div>
      </div>

      <EventDetailsSection eventDetails={eventDetails} eventTitle={eventTitle} />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          tabKey={eventKey}
          onClose={() => setSelectedProduct(null)}
          isProductSoldOut={isSoldOut(`${eventKey}:${selectedProduct.id}:${productSelections[`${eventKey}:${selectedProduct.id}`] || selectedProduct.sleeveOptions?.[0] || 'standard'}`)}
        />
      )}
    </section>
  );
}


