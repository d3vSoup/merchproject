// src/pages/Cart/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getCart, updateCartItem } from "../../api/cart";
import { SkeletonList } from "../../components/Skeleton";
import { createOrder } from "../../api/orders";
import { triggerCartUpdate } from "../../hooks/useCartCount";
import { PRODUCT_CATALOG } from "../../data/products";
import toast from "react-hot-toast";
import api from "../../api";
import { useSortPreference, SORT_OPTIONS, sortItems } from "../../hooks/useSortPreference";
import AnimatedDropdown from "../../components/ui/AnimatedDropdown";
import { Analytics } from "../../api/analytics";
import "./CartPage.css";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productOverrides, setProductOverrides] = useState({});
  const [sortBy, changeSort] = useSortPreference('cart_sort', 'price_asc');
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMapsLink, setDeliveryMapsLink] = useState('');

  useEffect(() => {
    if (user) {
      loadOverrides();
      loadCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user]);

  // Reload cart when overrides change
  useEffect(() => {
    if (user && Object.keys(productOverrides).length > 0) {
      loadCart();
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
    } catch (err) {
      console.error('Failed to load product overrides:', err);
    }
  }

  async function loadCart() {
    if (!user) return;
    setLoading(true);
    try {
      const cart = await getCart();
      const itemsToRemove = [];
      const hasOverrides = Object.keys(productOverrides).length > 0;
      const items = cart
        .filter(item => {
          if (!hasOverrides) return true;
          const product = PRODUCT_CATALOG[item.tab_key]?.find(p => p.id === item.product_id);
          const overrideKey = `${item.tab_key}:${item.product_id}`;
          const override = productOverrides[overrideKey];
          if (override && (override.hidden === true || override.hidden === 'true')) {
            itemsToRemove.push(item);
            return false;
          }
          if (!product && !override) {
            itemsToRemove.push(item);
            return false;
          }
          return true;
        })
        .map(item => {
          const product = PRODUCT_CATALOG[item.tab_key]?.find(p => p.id === item.product_id);
          const overrideKey = `${item.tab_key}:${item.product_id}`;
          const override = productOverrides[overrideKey];
          
          let price = product?.price || 0;
          if (override && override.price !== null && override.price !== undefined) {
            price = Number(override.price);
          }
          
          const name = override?.name || product?.name || "Unknown";
          const description = override?.description || product?.description || "";
          
          let eventLabel;
          if (item.tab_key === 'club' && item.club_or_dept) {
            eventLabel = item.club_or_dept;
          } else {
            const eventLabels = {
              utsav: "Utsav",
              phaseshift: "Phaseshift",
              farouche: "Farouche",
              club: "Club & Dept Merch"
            };
            eventLabel = eventLabels[item.tab_key] || item.tab_key;
          }
          
          return {
            tabKey: item.tab_key,
            productId: item.product_id,
            variant: item.variant,
            quantity: item.quantity,
            price: price,
            name: name,
            description: description,
            eventLabel: eventLabel,
            clubOrDept: item.club_or_dept || null,
            imageUrl: override?.image_url || product?.imageUrl || null,
            swatch: product?.swatch || ['#2a2a2a', '#1a1a1a'],
            previewLabel: product?.previewLabel || name.substring(0, 4).toUpperCase(),
          };
        });
      setCartItems(items);
      // Remove hidden/deleted items from cart in backend
      for (const item of itemsToRemove) {
        try {
          await updateCartItem(item.tab_key, item.product_id, item.variant, 0, item.club_or_dept || null);
        } catch (e) {
          console.warn('Failed to remove deleted item from cart:', e);
        }
      }
      if (itemsToRemove.length > 0) {
        triggerCartUpdate();
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load cart';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function adjustCart(item, delta) {
    if (!user) {
      toast.error("Please sign in");
      return;
    }

    const newQuantity = Math.max(0, item.quantity + delta);
    try {
      // Pass clubOrDept for club items
      await updateCartItem(item.tabKey, item.productId, item.variant, newQuantity, item.clubOrDept);
      await loadCart();
      triggerCartUpdate(); // Trigger cart count refresh
      if (newQuantity === 0) {
        toast.success("Removed from cart");
      } else if (delta > 0) {
        toast.success("Added to cart");
      } else {
        toast.success("Updated cart");
      }
    } catch (err) {
      console.error('Failed to update cart:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to update cart';
      toast.error(errorMsg);
    }
  }

  async function removeItem(item) {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    try {
      // Pass clubOrDept for club items
      await updateCartItem(item.tabKey, item.productId, item.variant, 0, item.clubOrDept);
      await loadCart();
      triggerCartUpdate(); // Trigger cart count refresh
      toast.success("Removed from cart");
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast.error('Failed to remove item');
    }
  }

  async function handleCheckout() {
    if (!user) {
      toast.error("Please sign in to checkout");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    Analytics.checkoutStart(cartItems.length, total);

    const orderItems = cartItems.map(item => ({
      tabKey: item.tabKey,
      productId: item.productId,
      variant: item.variant,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));

    if (wantsDelivery && !deliveryAddress.trim() && !deliveryMapsLink.trim()) {
      toast.error('Please enter a delivery address or Google Maps link');
      return;
    }

    try {
      const deliveryInfo = wantsDelivery ? {
        address: deliveryAddress.trim(),
        mapsLink: deliveryMapsLink.trim(),
      } : null;
      const order = await createOrder(orderItems, total, wantsDelivery, deliveryInfo);
      if (order) {
        Analytics.orderPlaced(order?.id || order?.order_number, total);
        toast.success("Order placed successfully!");
        await loadCart(); // Cart is cleared on backend
        navigate("/");
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to place order";
      if (err.response?.data?.profilePercent !== undefined) {
        toast.error(`${errorMsg} (Profile: ${err.response.data.profilePercent}%)`, { duration: 5000 });
      } else {
        toast.error(errorMsg, { duration: 3000 });
      }
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = wantsDelivery ? 100 : 0;
  const total = subtotal + deliveryFee;
  const sortedCartItems = sortItems(cartItems, sortBy, (i) => i.price, (i) => i.eventLabel);

  if (loading) {
    return (
      <section className="cart-section">
        <div style={{ padding: "24px 0" }}><SkeletonList rows={3} /></div>
      </section>
    );
  }

  if (cartItems.length === 0) {
    return (
      <section className="cart-section">
        <div className="cart-header cart-header--empty">
          <div className="cart-header__left">
            <div className="cart-header__accent">
              <span className="cart-header__accent-line" />
              <span className="cart-header__accent-text">Your Collection</span>
            </div>
            <h1 className="cart-title">Shopping <br /><span className="cart-title__gradient">Bag</span></h1>
          </div>
          <p className="cart-subtitle">Add items to get started</p>
        </div>
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <p className="cart-empty-text">Your cart is empty</p>
          <button className="btn btn--primary" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-section">
      <div className="cart-layout">
        {/* Left: Scrollable cart items */}
        <div className="cart-items-col">
          <div className="cart-header">
            <div className="cart-header__left">
              <div className="cart-header__accent">
                <span className="cart-header__accent-line" />
                <span className="cart-header__accent-text">Your Collection</span>
              </div>
              <h1 className="cart-title">Shopping <br /><span className="cart-title__gradient">Bag</span></h1>
              <span className="cart-item-count">{sortedCartItems.length} Item{sortedCartItems.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="cart-sort">
              <AnimatedDropdown
                label="Sort by"
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={changeSort}
                id="cart-sort-select"
              />
            </div>
          </div>

          <div className="cart-items">
            {sortedCartItems.map((item, idx) => {
              const itemColor = item.swatch?.[0] || '#ff6b35';
              const itemStyle = { '--item-color': itemColor };

              return (
                <div
                  key={idx}
                  className="cart-item"
                  style={{ ...itemStyle, animationDelay: `${idx * 0.08}s` }}
                >
                  <div
                    className="cart-item-preview"
                    style={{
                      background: item.imageUrl
                        ? `url(${item.imageUrl}) center/cover`
                        : `linear-gradient(135deg, ${item.swatch[0]}, ${item.swatch[1]})`,
                    }}
                  >
                    {!item.imageUrl && <span>{item.previewLabel}</span>}
                  </div>
                  <div className="cart-item-body">
                    <div className="cart-item-top">
                      <div>
                        <h3 className="cart-item-name">{item.name}</h3>
                        <p className="cart-item-variant-line">
                          {item.eventLabel}
                          {item.variant ? ` / ${item.variant}` : ''}
                        </p>
                      </div>
                      <span className="cart-item-unit-price">{formatPrice(item.price)}</span>
                    </div>
                    <div className="cart-item-bottom">
                      <div className="qty-control">
                        <button
                          className="qty-btn"
                          onClick={() => adjustCart(item, -1)}
                          disabled={item.quantity === 0}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-count" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => adjustCart(item, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeItem(item)}
                        aria-label="Remove item"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Sticky summary sidebar */}
        <div className="cart-summary-col">
          <div className="cart-summary">
            <h2 className="cart-summary-title">Summary</h2>
            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span className="cart-summary-free">{wantsDelivery ? formatPrice(100) : 'FREE'}</span>
              </div>
              {wantsDelivery && (
                <div className="cart-summary-row">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(100)}</span>
                </div>
              )}
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="delivery-section">
              <label className="delivery-toggle">
                <input
                  type="checkbox"
                  checked={wantsDelivery}
                  onChange={(e) => setWantsDelivery(e.target.checked)}
                />
                <span>I want delivery</span>
              </label>
              <p className="delivery-fee-note">Delivery fee: ₹100</p>
              {wantsDelivery && (
                <div className="delivery-address-input">
                  <textarea
                    placeholder="Enter your delivery address…"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={2}
                  />
                  <div className="delivery-maps-link">
                    <span className="delivery-maps-icon">📍</span>
                    <input
                      type="url"
                      placeholder="Paste Google Maps link…"
                      value={deliveryMapsLink}
                      onChange={(e) => setDeliveryMapsLink(e.target.value)}
                    />
                  </div>
                  <a
                    className="delivery-maps-help"
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Google Maps →
                  </a>
                </div>
              )}
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

