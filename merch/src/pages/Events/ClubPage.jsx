// src/pages/Events/ClubPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getCart, updateCartItem } from "../../api/cart";
import { Analytics } from "../../api/analytics";
import { SkeletonGrid } from "../../components/Skeleton";
import { triggerCartUpdate } from "../../hooks/useCartCount";
import toast from "react-hot-toast";
import { PRODUCT_CATALOG, BASE_PRODUCT_IDS } from "../../data/products";
import ProductModal from "../../components/ProductModal";
import WishlistHeart from "../../components/WishlistHeart";
import api from "../../api";
import FadeInSection from "../../components/ui/FadeInSection";
import GlareHover from "../../components/ui/GlareHover";
import StaggeredMenu from "../../components/ui/StaggeredMenu";
import TextType from "../../components/ui/TextType";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const CLUBS = [
  "IEEE",
  "PENTAGRAM",
  "ROCKETRY CLUB",
  "TEAMCODELOCKED",
  "<CODE IO/>",
  "ACM CHAPTER",
  "AQUILLA AEROSPACE",
  "AUGMENT.AI",
  "BIG FOUNDATION",
  "BMSCE ALUMNI NETWORK",
  "BULLZ RACING",
  "CHIRANTANA",
  "DANZ ADDIX",
  "DSYNC",
  "EEEA",
  "ELSOC",
  "FINE ARTS CLUB",
  "FALCONS",
  "GDSC",
  "GRADIENT",
  "THE GROOVE HOUSE",
  "IIC",
  "INKSANITY",
  "ISE STUDENT CLUB",
  "LEO SATVA",
  "MANUSMARAN",
  "MELTON FOUNDATION",
  "MOUNTAINEERING CLUB",
  "MUNSOC",
  "NINAAD",
  "NSS",
  "TEAM PANACHE",
  "PARAMVAH",
  "PROTOCOL",
  "PRAVRUTTHI",
  "QCAINE",
  "RESPAWN",
  "ROBOTICS",
  "ROTARACT",
  "SAMSKRUTHI SAMBHRAMA",
  "SENSORED",
  "SINGULARITY",
  "SYNAPSE",
  "UPAGRAHA",
  "BUSINESS INSIGHTS",
  "MECHANICAL ENGG ASSC",
  "VARIANCE",
  "VAK",
  "AERO BMSCE",
  "WAKAI OTAKU",
  "NCC",
  "CORTECHS",
];

const IEEE_SUBCLUBS = [
  "IEEE COMPUTER SOCIETY",
  "IEEE COMSOC",
  "IEEE PELS AND IES",
  "IEEE PES AND SENSORS COUNCIL",
  "IEEE STUDENT BRANCH",
  "IEEE SSIT",
  "IEEE SSCS",
  "IEEE SIGNAL PROCESSING SOCIETY",
  "IEEE WIE",
];

const DEPARTMENTS = [
  "CSE",
  "CS ALLIED",
  "AIML",
  "AI-DS",
  "ECE",
  "EEE",
  "AEROSPACE",
  "MECHANICAL",
  "CIVIL",
  "BIOTECHNOLOGY",
  "CHEMICAL",
  "IEM",
];

export default function ClubPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("clubs");
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [ieeeSubclub, setIeeeSubclub] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [productSelections, setProductSelections] = useState({});
  const [soldOutItems, setSoldOutItems] = useState({});
  const [clubStatuses, setClubStatuses] = useState({});
  const [productOverrides, setProductOverrides] = useState({});
  const [loadingSoldOut, setLoadingSoldOut] = useState(true); // Start as true - don't render until data loads
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trendingStatus, setTrendingStatus] = useState({});

  // Load sold-out status from backend only (no localStorage fallback)

  useEffect(() => {
    let mounted = true;
    const maxWait = 12000;
    const fallbackTimer = setTimeout(() => {
      if (mounted) setLoadingSoldOut(false);
    }, maxWait);
    
    async function fetchSoldOutFromServer() {
      if (!mounted) return;
      setLoadingSoldOut(true);
      try {
        const res = await api.get('/api/items/soldouts', { params: { tabKey: "club" } });
        if (!mounted) return;
        
        const map = {};
        const statusMap = {};
        (res.data?.items || []).forEach(item => {
          // Item is unavailable if:
          // 1. Event status is soldout/over/no_new_releases (whole event unavailable for that club/dept)
          // 2. OR individual item is marked sold_out (even if event is ongoing)
          const eventStatus = item.event_status || 'ongoing';
          const isEventUnavailable = 
            eventStatus === "soldout" || 
            eventStatus === "over" || 
            eventStatus === "no_new_releases";
          
          // Individual item sold_out flag
          const isItemSoldOut = item.sold_out === true;
          
          // Item is unavailable if:
          // - Event status makes it unavailable (soldout/over/no_new_releases), OR
          // - Item is individually marked as sold_out (regardless of event status)
          const isUnavailable = isEventUnavailable || isItemSoldOut;
          
          if (!isUnavailable) return; // Skip if item is available
          
          // Create multiple key variations to ensure matching works
          const variant = item.variant || null;
          const variantStr = variant || "standard";
          const clubOrDept = item.club_or_dept;
          
          // Base keys (without club/dept)
          const baseKeyStandard = `club:${item.product_id}:standard`;
          const baseKeyNull = `club:${item.product_id}:null`;
          const baseKeyVariant = `club:${item.product_id}:${variantStr}`;
          const baseKeyNoVariant = `club:${item.product_id}`;
          
          // If club/dept is specified, create keys with it
          if (clubOrDept) {
            // Keys with club/dept
            map[`${baseKeyStandard}:${clubOrDept}`] = true;
            map[`${baseKeyNull}:${clubOrDept}`] = true;
            map[`${baseKeyVariant}:${clubOrDept}`] = true;
            map[`${baseKeyNoVariant}:${clubOrDept}`] = true;
          } else {
            // Keys without club/dept (for non-club tabs or general items)
            map[baseKeyStandard] = true;
            map[baseKeyNull] = true;
            map[baseKeyVariant] = true;
            map[baseKeyNoVariant] = true;
          }
          
          // Store event status per club/dept
          if (clubOrDept && eventStatus !== "ongoing" && eventStatus !== "countdown") {
            statusMap[clubOrDept] = eventStatus;
          }
        });
        if (mounted) {
          setSoldOutItems(map);
          setClubStatuses(statusMap);
        }
      } catch (err) {
        console.error('Failed to load sold-out data from server', err);
        // Set empty state on error to allow page to load
        if (mounted) {
          setSoldOutItems({});
          setClubStatuses({});
        }
      } finally {
        if (mounted) {
          setLoadingSoldOut(false);
        }
      }
    }

    async function fetchOverrides() {
      if (!mounted) return;
      try {
        const res = await api.get('/api/catalog/overrides', { params: { tabKey: 'club' } });
        if (!mounted) return;
        
        const map = {};
        (res.data?.overrides || []).forEach((item) => {
          map[item.product_id] = item;
        });
        if (mounted) {
          setProductOverrides(map);
        }
      } catch (err) {
        console.error('Failed to load club overrides', err);
        // Set empty map on error to allow page to load
        if (mounted) {
          setProductOverrides({});
        }
      }
    }

    async function fetchTrendingStatus() {
      if (!mounted) return;
      try {
        const res = await api.get('/api/catalog/overrides', { params: { tabKey: 'system' } });
        if (!mounted) return;
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

    // Initial load
    fetchSoldOutFromServer();
    fetchOverrides();
    fetchTrendingStatus();
    
    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Show loading only for initial load
  // Don't block rendering after data is fetched

  const baseProducts = useMemo(() => {
    try {
      if (!PRODUCT_CATALOG || !PRODUCT_CATALOG.club) {
        console.warn('PRODUCT_CATALOG.club is undefined');
        return [];
      }
      const base = PRODUCT_CATALOG.club;
      if (!Array.isArray(base)) {
        console.error('PRODUCT_CATALOG.club is not an array:', base);
        return [];
      }
      const overrideList = Object.values(productOverrides);
      const hiddenIds = new Set(overrideList.filter(o => o.hidden === true || o.hidden === 'true').map(o => o.product_id));
      const mergedBase = base
        .filter(p => p && p.id && !hiddenIds.has(p.id))
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
    } catch (err) {
      console.error('Error computing base products:', err);
      return [];
    }
  }, [productOverrides]);

  const currentCategory = (ieeeSubclub ? `IEEE - ${ieeeSubclub}` : null) || selectedClub || selectedDept;
  const displayProducts = currentCategory && Array.isArray(baseProducts) ? baseProducts : [];

  useEffect(() => {
    if (user) {
      loadCart();
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
        club_or_dept: item.club_or_dept || null,
      })));
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  }


  function getProductPrice(tabKey, productId) {
    const product = PRODUCT_CATALOG[tabKey]?.find(p => p.id === productId);
    if (tabKey === "club" && productOverrides[productId]) {
      const overridePrice = productOverrides[productId].price;
      if (overridePrice !== undefined && overridePrice !== null) {
        return Number(overridePrice) || 0;
      }
    }
    return product?.price || 0;
  }

  async function adjustCart(product, variant, delta) {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    // Include club/dept in the cart item match
    const existing = cartItems.find(
      item => item.tabKey === "club" && 
              item.productId === product.id && 
              (item.variant || null) === (variant || null) &&
              (item.club_or_dept || null) === (currentCategory || null)
    );
    const newQuantity = Math.max(0, (existing?.quantity || 0) + delta);

    try {
      // Normalize variant before sending
      const normalizedVariant = variant || null;
      // Pass the current club/dept as the 5th parameter
      await updateCartItem("club", product.id, normalizedVariant, newQuantity, currentCategory);
      if (delta > 0) Analytics.cartAdd("club", product.id, product.name, newQuantity);
      await loadCart();
      triggerCartUpdate(); // Trigger cart count refresh
      if (delta > 0) {
        toast.success(`Added ${currentCategory} item to cart`);
      } else if (newQuantity === 0) {
        toast.success("Removed from cart");
      }
    } catch (err) {
      console.error('Failed to update cart:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to update cart';
      toast.error(errorMsg);
    }
  }


  function findCartItem(productId, variant) {
    // Match including club/dept
    return cartItems.find(
      item => item.tabKey === "club" && 
              item.productId === productId && 
              (item.variant || null) === (variant || null) &&
              (item.club_or_dept || null) === (currentCategory || null)
    );
  }

  if (loadingSoldOut) {
    return (
      <section className="product-section">
        <div className="section-heading">Club & Dept Merchandise</div>
        <SkeletonGrid />
      </section>
    );
  }

  return (
    <section className="product-section event-page">
      {/* Top selection bar serving as StaggeredMenu triggers */}
      <div className="club-selection-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0.75rem', marginBottom: '2rem' }}>
        {/* Clubs Top Menu */}
        <div style={{ position: 'relative' }}>
          <StaggeredMenu
            position="left"
            items={CLUBS.map(c => ({ label: c, ariaLabel: `Select ${c}` }))}
            displaySocials={false}
            displayItemNumbering={true}
            menuButtonColor="var(--c-text, #111)"
            openMenuButtonColor="#111"
            changeMenuColorOnOpen={true}
            colors={['#FF6B00', '#FF9F4A']}
            accentColor="#FF6B00"
            isFixed={false}
            menuLabel={selectedClub || "CLUBS"}
            closeLabel="CLOSE"
            iconPosition="left"
            className="club-staggered-menu-top"
            onItemClick={(item) => {
              setActiveTab("clubs");
              setSelectedClub(item.label);
              setSelectedDept(null);
              setIeeeSubclub(null);
            }}
          />
        </div>

        {/* Depts Top Menu */}
        <div style={{ position: 'relative' }}>
          <StaggeredMenu
            position="right"
            items={DEPARTMENTS.map(d => ({ label: d, ariaLabel: `Select ${d}` }))}
            displaySocials={false}
            displayItemNumbering={true}
            menuButtonColor="var(--c-text, #111)"
            openMenuButtonColor="#111"
            changeMenuColorOnOpen={true}
            colors={['#5227FF', '#B19EEF']}
            accentColor="#5227FF"
            isFixed={false}
            menuLabel={selectedDept || "DEPARTMENTS"}
            closeLabel="CLOSE"
            iconPosition="right"
            className="dept-staggered-menu-top"
            onItemClick={(item) => {
              setActiveTab("departments");
              setSelectedDept(item.label);
              setSelectedClub(null);
              setIeeeSubclub(null);
            }}
          />
        </div>
      </div>

      {/* IEEE sub-club selector */}
      {selectedClub === "IEEE" && (
        <div className="club-selection club-selection--dropdown" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <label className="club-dropdown-label">
            <span>IEEE Subclub</span>
            <select
              className="club-dropdown"
              value={ieeeSubclub || ""}
              onChange={(e) => setIeeeSubclub(e.target.value || null)}
            >
              <option value="">-- Select IEEE subclub --</option>
              {IEEE_SUBCLUBS.map((subclub) => (
                <option key={subclub} value={subclub}>{subclub}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!currentCategory && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.02))', borderRadius: '24px', margin: '2rem auto', maxWidth: '600px', border: '1px dashed rgba(0,0,0,0.1)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9CA3AF' }}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>Select an Organization</h3>
          <p style={{ fontSize: '1.05rem', margin: 0, lineHeight: 1.6, maxWidth: '400px' }}>Use the <strong>CLUBS</strong> menu on the left or the <strong>DEPTS</strong> menu on the right to browse their exclusive merchandise collections.</p>
        </div>
      )}

      {currentCategory && (
        <>
          <div className="event-collection-header">
            <h3 className="event-collection-title">
              {currentCategory} Merchandise
              {trendingStatus[currentCategory] && (
                <span 
                  className="trending-tag"
                  style={{ color: '#ef4444', fontSize: 'clamp(1rem, 2vw, 1.3rem)', marginLeft: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} 
                >
                  Trending 🔥
                </span>
              )}
            </h3>
            <p className="event-collection-subtitle">Exclusive apparel for societies & teams.</p>
          </div>
          {displayProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <p>No products available for this category yet.</p>
            </div>
          ) : (
          <div className="product-grid-wrapper">
            <div className="product-grid">
            {displayProducts.map((product) => {
              const defaultVariant = product.sleeveOptions?.[0] || null;
              const productKey = `club:${product.id}`;
              const selectedVariant = productSelections[productKey] || defaultVariant;
              const variant = selectedVariant;
              
              // Create multiple possible keys to check
              const variantStr = variant || "standard";
              const nullVariantKey = `club:${product.id}:null:${currentCategory}`;
              const standardVariantKey = `club:${product.id}:standard:${currentCategory}`;
              const actualVariantKey = `club:${product.id}:${variantStr}:${currentCategory}`;
              const categoryKey = actualVariantKey;
              
              // Also check without variant
              const baseCategoryKey = `club:${product.id}:${currentCategory}`;
              const baseItemKey = `club:${product.id}:${variantStr}`;
              const baseNullKey = `club:${product.id}:null`;
              const baseStandardKey = `club:${product.id}:standard`;
              
              // Check if loading to avoid flashing
              // Priority: category-specific keys > base keys > event status
              const isProductSoldOut = loadingSoldOut ? false : (
                soldOutItems[categoryKey] ||
                soldOutItems[nullVariantKey] ||
                soldOutItems[standardVariantKey] ||
                soldOutItems[baseCategoryKey] ||
                soldOutItems[baseItemKey] ||
                soldOutItems[baseNullKey] ||
                soldOutItems[baseStandardKey] ||
                (clubStatuses[currentCategory] && (
                  clubStatuses[currentCategory] === "soldout" || 
                  clubStatuses[currentCategory] === "over" || 
                  clubStatuses[currentCategory] === "no_new_releases"
                ))
              );
              const cartItem = findCartItem(product.id, variant);
              const quantity = cartItem?.quantity || 0;

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
                  className={`product-card ${isProductSoldOut ? "is-soldout" : ""}`}
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
                      tabKey="club"
                      productId={product.id}
                      variant={selectedVariant}
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
                      <span className="product-card__badge">{currentCategory}</span>
                    </div>
                    {product.sleeveOptions && product.sleeveOptions.length > 1 && (
                      <div className="variant-toggle">
                        {product.sleeveOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`variant-chip ${selectedVariant === opt ? "is-active" : ""}`}
                            onClick={() => setProductSelections(prev => ({ ...prev, [productKey]: opt }))}
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
                        onClick={() => adjustCart(product, variant, -1)}
                        disabled={quantity === 0 || isProductSoldOut}
                        aria-label={`Remove one ${product.name}`}
                      >
                        -
                      </button>
                      <span className="qty-count">{quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => adjustCart(product, variant, 1)}
                        disabled={isProductSoldOut}
                        aria-label={`Add one ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => adjustCart(product, variant, 1)}
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
          )}
        </>
      )}

      {!currentCategory && (
        <div className="empty-state">
          <p>Select a club or department to view merchandise</p>
        </div>
      )}

      {selectedProduct && (() => {
        const variant = productSelections[`club:${selectedProduct.id}`] || selectedProduct.sleeveOptions?.[0] || null;
        const variantStr = variant || "standard";
        const categoryKey = `club:${selectedProduct.id}:${variantStr}:${currentCategory}`;
        const baseKey = `club:${selectedProduct.id}:${variantStr}`;
        const isModalSoldOut = soldOutItems[categoryKey] || 
                               soldOutItems[`club:${selectedProduct.id}:null:${currentCategory}`] ||
                               soldOutItems[`club:${selectedProduct.id}:standard:${currentCategory}`] ||
                               soldOutItems[baseKey] ||
                               (clubStatuses[currentCategory] && (
                                 clubStatuses[currentCategory] === "soldout" || 
                                 clubStatuses[currentCategory] === "over" || 
                                 clubStatuses[currentCategory] === "no_new_releases"
                               ));
        return (
          <ProductModal
            product={selectedProduct}
            tabKey="club"
            onClose={() => setSelectedProduct(null)}
            isProductSoldOut={isModalSoldOut}
          />
        );
      })()}
    </section>
  );
}


