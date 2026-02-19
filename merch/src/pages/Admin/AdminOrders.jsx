// src/pages/Admin/AdminOrders.jsx
import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { PRODUCT_CATALOG } from "../../data/products";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export default function AdminOrders() {
  const [allOrders, setAllOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [productOverrides, setProductOverrides] = useState({});
  
  // Auto-load orders on mount
  useEffect(() => {
    loadProductOverrides();
    loadAllOrders();
  }, []);

  async function loadProductOverrides() {
    try {
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

  async function loadAllOrders() {
    setLoading(true);
    try {
      // Ensure overrides are loaded first
      let currentOverrides = productOverrides;
      if (Object.keys(currentOverrides).length === 0) {
        await loadProductOverrides();
        // Get fresh overrides from state after loading
        // We'll reload them inline to ensure we have the latest
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
        currentOverrides = allOverrides;
        setProductOverrides(allOverrides);
      }
      
      const res = await api.get('/api/admin/orders');
      const orders = res.data.orders || [];
      
      // Enrich orders with product details and current prices from overrides
      const enrichOrder = (order) => {
        // Handle resell listings - show price range
        if (order.type === 'resell_listing') {
          const resellItem = order.items[0];
          if (resellItem && resellItem.priceRange) {
            // Try to parse price range (e.g., "₹500-700" or "500-700")
            const priceMatch = resellItem.priceRange.match(/[\d,]+/g);
            if (priceMatch && priceMatch.length > 0) {
              // Use the first number as minimum price for display
              const minPrice = parseFloat(priceMatch[0].replace(/,/g, '')) || 0;
              return {
                ...order,
                totalAmount: minPrice, // Show minimum price as total
                items: order.items.map(item => ({
                  ...item,
                  price: minPrice // For display purposes
                }))
              };
            }
          }
          return order;
        }
        
        const enrichedItems = order.items.map(item => {
          const product = PRODUCT_CATALOG[item.tabKey]?.find(p => p.id === item.productId);
          const overrideKey = `${item.tabKey}:${item.productId}`;
          const override = currentOverrides[overrideKey];
          
          // Use override price if available, otherwise use product price, then fallback to stored price
          let price = product?.price || item.price || 0;
          if (override && override.price !== null && override.price !== undefined) {
            price = Number(override.price);
          }
          
          // Use override name if available
          const name = override?.name || product?.name || item.name || 'Unknown Product';
          const description = override?.description || product?.description || item.description || '';
          
          return {
            ...item,
            name,
            price,
            description
          };
        });
        return {
          ...order,
          items: enrichedItems,
          totalAmount: enrichedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
        };
      };
      
      const enrichedOrders = orders.map(enrichOrder);
      
      // Separate by type
      const confirmed = enrichedOrders.filter(o => o.type === 'confirmed_order');
      const carts = enrichedOrders.filter(o => o.type === 'cart');
      
      setAllOrders(enrichedOrders);
      setConfirmedOrders(confirmed);
      setCartItems(carts);
      
      if (enrichedOrders.length > 0) {
        toast.success(`Loaded ${enrichedOrders.length} orders`, { duration: 2000 });
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load orders';
      toast.error(`Failed to load orders: ${errorMsg}`, { duration: 3000 });
    }
    setLoading(false);
  }

  async function updatePaymentStatus(orderId, status) {
    try {
      await api.post('/api/admin/orders/update-status', { orderId, status });
      setAllOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, paymentStatus: status } : o
      ));
      toast.success('Payment status updated');
    } catch (err) {
      console.error('Failed to update payment status:', err);
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    }
  }

  async function handleRefund(orderId, email) {
    if (!confirm(`Refund order for ${email}?`)) return;
    try {
      await api.post('/api/admin/orders/update-status', { orderId, status: 'refunded' });
      setAllOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, paymentStatus: 'refunded' } : o
      ));
      toast.success('Order refunded successfully');
    } catch (err) {
      console.error('Failed to refund:', err);
      toast.error(err.response?.data?.message || 'Failed to process refund');
    }
  }

  const resellListings = allOrders.filter(o => o.type === 'resell_listing');
  
  const displayOrders = activeTab === 'all' ? allOrders 
    : activeTab === 'orders' ? confirmedOrders
    : activeTab === 'cart' ? cartItems
    : activeTab === 'resell' ? resellListings
    : allOrders;

  return (
    <section className="admin-section">
      <div className="section-heading">Order Management</div>
      <div className="admin-panel">
        <div className="admin-orders-header">
          <button className="btn" onClick={loadAllOrders} disabled={loading}>
            {loading ? "Loading..." : "Refresh Orders"}
          </button>
          <div className="admin-orders-tabs">
            <button 
              className={`btn ${activeTab === 'all' ? '' : 'btn--ghost'}`}
              onClick={() => setActiveTab('all')}
            >
              All ({allOrders.length})
            </button>
            <button 
              className={`btn ${activeTab === 'orders' ? '' : 'btn--ghost'}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders ({confirmedOrders.length})
            </button>
            <button 
              className={`btn ${activeTab === 'cart' ? '' : 'btn--ghost'}`}
              onClick={() => setActiveTab('cart')}
            >
              Cart ({cartItems.length})
            </button>
            <button 
              className={`btn ${activeTab === 'resell' ? '' : 'btn--ghost'}`}
              onClick={() => setActiveTab('resell')}
            >
              Resell Listings ({allOrders.filter(o => o.type === 'resell_listing').length})
            </button>
          </div>
        </div>

        {loading && allOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
            Loading orders...
          </p>
        ) : displayOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
            No {activeTab === 'all' ? '' : activeTab} items found.
          </p>
        ) : (
          <div className="orders-table">
            <div className="orders-header-row">
              <div>Name / Email</div>
              <div>USN</div>
              <div>Type</div>
              <div>Items</div>
              <div>Total</div>
              <div>Payment</div>
              <div>Actions</div>
            </div>
            {displayOrders.map((order, idx) => {
              // Calculate total - for resell listings, use priceRange if available
              let total = order.totalAmount;
              if (!total || (order.type === 'resell_listing' && total === 0)) {
                if (order.type === 'resell_listing' && order.items[0]?.priceRange) {
                  // Parse price range for resell items
                  const priceMatch = order.items[0].priceRange.match(/[\d,]+/g);
                  if (priceMatch && priceMatch.length > 0) {
                    total = parseFloat(priceMatch[0].replace(/,/g, '')) || 0;
                  }
                } else {
                  total = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
                }
              }
              const isSoldOut = order.paymentStatus === 'soldout' || order.type === 'soldout';
              return (
                <div 
                  key={order.id || idx} 
                  className={`orders-row ${isSoldOut ? 'is-soldout' : ''}`}
                  style={isSoldOut ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
                >
                  <div className="order-email">
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {order.name && order.name !== 'Unknown' && order.name.trim() ? order.name : (order.email ? order.email.split('@')[0] : 'Unknown')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', wordBreak: 'break-word' }}>
                      {order.email || 'No email'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: order.usn ? 500 : 400 }}>
                    {order.usn && order.usn.trim() ? order.usn : '-'}
                  </div>
                  <div className="order-type">
                    <span className={`type-badge type-${order.type === 'confirmed_order' ? 'order' : order.type === 'resell_listing' ? 'resell' : order.type}`}>
                      {order.type === 'confirmed_order' ? 'Order' : order.type === 'resell_listing' ? 'Resell Listing' : order.type}
                    </span>
                    {order.orderNumber && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                        {order.orderNumber}
                      </div>
                    )}
                    {order.type === 'resell_listing' && (() => {
                      // Determine the actual status
                      const itemStatus = order.items[0]?.status;
                      const payStatus = order.paymentStatus;
                      const isDeleted = payStatus === 'deleted' || itemStatus === 'deleted';
                      const isExpired = payStatus === 'expired' || itemStatus === 'expired';
                      
                      return (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          marginTop: 4,
                          color: isDeleted ? '#ef4444' : isExpired ? '#f59e0b' : '#22c55e',
                          fontWeight: 500
                        }}>
                          {isDeleted ? '🗑️ Deleted' : isExpired ? '⏱️ Expired' : '✓ Active'}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="order-items">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    <details style={{ marginTop: 4 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--muted)' }}>View Details</summary>
                      <ul style={{ marginTop: 8, paddingLeft: 16, fontSize: 12, listStyle: 'none' }}>
                        {order.items.map((item, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <strong>{item.name || item.title}</strong>
                            {item.variant && <span> ({item.variant})</span>}
                            {item.condition && <span> - {item.condition}</span>}
                            {item.year && <span> ({item.year})</span>}
                            <br />
                            {order.type === 'resell_listing' ? (
                              <span style={{ color: 'var(--muted)' }}>
                                {item.priceRange && `Price: ${item.priceRange}`}
                                {item.description && (
                                  <>
                                    <br />
                                    {item.description.substring(0, 100)}{item.description.length > 100 ? '...' : ''}
                                  </>
                                )}
                                {item.pictures && item.pictures.length > 0 && (
                                  <>
                                    <br />
                                    {item.pictures.length} image{item.pictures.length !== 1 ? 's' : ''}
                                  </>
                                )}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>
                                Qty: {item.quantity || 1} × {formatPrice(item.price || 0)} = {formatPrice((item.price || 0) * (item.quantity || 1))}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <div className="order-total">
                    {order.type === 'resell_listing' ? (
                      <span style={{ fontWeight: 500 }}>
                        {order.items[0]?.priceRange || 'Price TBD'}
                      </span>
                    ) : (
                      formatPrice(isNaN(total) ? 0 : total)
                    )}
                  </div>
                  <div className="order-payment">
                    {order.type === 'confirmed_order' ? (
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                      </select>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>N/A</span>
                    )}
                  </div>
                  <div className="order-actions">
                    {order.type === 'confirmed_order' && order.paymentStatus === 'paid' && (
                      <button
                        className="btn btn--ghost"
                        style={{ fontSize: 12, padding: '4px 8px' }}
                        onClick={() => handleRefund(order.id, order.email)}
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

