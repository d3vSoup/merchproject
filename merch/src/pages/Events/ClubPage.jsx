// src/pages/Events/ClubPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getCart, updateCartItem } from "../../api/cart";
import { triggerCartUpdate } from "../../hooks/useCartCount";
import toast from "react-hot-toast";
import { PRODUCT_CATALOG } from "../../data/products";
import ProductModal from "../../components/ProductModal";
import api from "../../api";

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
  "AIML ALLIED",
  "ECE",
  "EEE",
  "AEROSPACE",
  "MECHANICAL",
  "CIVIL",
  "BIOTECHNOLOGY",
  "CHEMICAL",
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

  // Load sold-out status from backend only (no localStorage fallback)

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    
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
          // 1. Event status is soldout/over/no_new_releases (whole event unavailable)
          // 2. OR individual item is marked sold_out (even if event is ongoing)
          const eventStatus = item.event_status || 'ongoing';
          const isEventUnavailable = 
            eventStatus === "soldout" || 
            eventStatus === "over" || 
            eventStatus === "no_new_releases";
          
          // Individual item sold_out takes precedence
          const isItemSoldOut = item.sold_out === true;
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

    // Initial load
    fetchSoldOutFromServer();
    fetchOverrides();
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
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
      return base.map(product => {
        if (!product || !product.id) {
          console.warn('Invalid product in catalog:', product);
          return null;
        }
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
      }).filter(Boolean); // Remove null entries
    } catch (err) {
      console.error('Error computing base products:', err);
      return [];
    }
  }, [productOverrides]);

  const currentCategory = selectedClub || selectedDept || (ieeeSubclub ? `IEEE - ${ieeeSubclub}` : null);
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
        <p style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading products...</p>
      </section>
    );
  }

  return (
    <section className="product-section">
      <div className="club-tabs-container">
        <div className="club-main-tabs">
          <button
            className={`club-tab ${activeTab === "clubs" ? "is-active" : ""}`}
            onClick={() => { setActiveTab("clubs"); setSelectedClub(null); setSelectedDept(null); setIeeeSubclub(null); }}
          >
            CLUBS
          </button>
          <button
            className={`club-tab ${activeTab === "departments" ? "is-active" : ""}`}
            onClick={() => { setActiveTab("departments"); setSelectedClub(null); setSelectedDept(null); setIeeeSubclub(null); }}
          >
            DEPARTMENTS
          </button>
        </div>

        {activeTab === "clubs" && (
          <div className="club-selection">
            <div className="club-list">
              {CLUBS.map((club) => (
                <div key={club} className="club-item-wrapper">
                  {club === "IEEE" ? (
                    <div className="ieee-dropdown">
                      <button
                        className={`club-item ${selectedClub === club ? "is-active" : ""}`}
                        onClick={() => {
                          if (selectedClub === club) {
                            setSelectedClub(null);
                            setIeeeSubclub(null);
                          } else {
                            setSelectedClub(club);
                            setIeeeSubclub(null);
                          }
                        }}
                      >
                        {club} {selectedClub === club ? "▼" : "▶"}
                      </button>
                      {selectedClub === club && (
                        <div className="ieee-subclubs">
                          {IEEE_SUBCLUBS.map((subclub) => (
                            <button
                              key={subclub}
                              className={`club-item subclub ${ieeeSubclub === subclub ? "is-active" : ""}`}
                              onClick={() => setIeeeSubclub(subclub)}
                            >
                              {subclub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className={`club-item ${selectedClub === club ? "is-active" : ""}`}
                      onClick={() => {
                        setSelectedClub(selectedClub === club ? null : club);
                        setIeeeSubclub(null);
                      }}
                    >
                      {club}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "departments" && (
          <div className="department-selection">
            <div className="department-list">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  className={`department-item ${selectedDept === dept ? "is-active" : ""}`}
                  onClick={() => setSelectedDept(selectedDept === dept ? null : dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!currentCategory && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Select a Club or Department to view merchandise</p>
          <p style={{ fontSize: '0.9rem' }}>Choose from the tabs above to browse available items</p>
        </div>
      )}

      {currentCategory && (
        <>
          <div className="section-heading">
            {currentCategory} Merchandise
          </div>
          {displayProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <p>No products available for this category yet.</p>
            </div>
          ) : (
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
                <article 
                  key={productKey} 
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
              );
            })}
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


