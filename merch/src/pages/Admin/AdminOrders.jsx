// src/pages/Admin/AdminOrders.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import { SkeletonList } from "../../components/Skeleton";
import { PRODUCT_CATALOG } from "../../data/products";
import "./AdminOrders.css";

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

  async function exportOrdersCsv(dateFilter = null, rangeStart = null, rangeEnd = null) {
    try {
      const params = {};
      if (rangeStart && rangeEnd) {
        params.startDate = rangeStart;
        params.endDate = rangeEnd;
      } else if (dateFilter) {
        params.date = dateFilter;
      }
      const res = await api.get('/api/admin/orders/export', {
        params,
        responseType: 'blob',
      });
      const contentType = res.headers?.['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Export failed');
      }
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateSuffix = rangeStart && rangeEnd ? `-${rangeStart}_to_${rangeEnd}` : (dateFilter ? `-${dateFilter}` : '');
      a.download = `orders${dateSuffix}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(err.message || err.response?.data?.message || 'Failed to export');
    }
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

  async function deleteOrder(orderId, email) {
    if (!confirm(`Permanently delete order for ${email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/orders/${orderId}`);
      setAllOrders(prev => prev.filter(o => o.id !== orderId));
      setConfirmedOrders(prev => prev.filter(o => o.id !== orderId));
      setCartItems(prev => prev.filter(o => o.id !== orderId));
      toast.success('Order deleted');
    } catch (err) {
      console.error('Failed to delete order:', err);
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  }

  const resellListings = allOrders.filter(o => o.type === 'resell_listing');

  // CSV date range state
  const [csvStartDate, setCsvStartDate] = React.useState('');
  const [csvEndDate, setCsvEndDate] = React.useState('');
  
  const displayOrders = activeTab === 'all' ? allOrders 
    : activeTab === 'orders' ? confirmedOrders
    : activeTab === 'cart' ? cartItems
    : activeTab === 'resell' ? resellListings
    : allOrders;

  function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10)
    };
  }

  return (
    <section className="admin-section">
      <div className="section-heading">
        Order Management
        <Link to="/admin/dashboard" className="btn btn--ghost btn--sm">
          ← Dashboard
        </Link>
      </div>
      <div className="admin-panel">
        <div className="admin-orders-header">
          <button className="btn" onClick={loadAllOrders} disabled={loading}>
            {loading ? "Loading..." : "Refresh Orders"}
          </button>
          <div className="admin-orders-export">
            <span className="admin-export-label">Export CSV:</span>
            <button className="btn btn--ghost btn--sm" onClick={() => exportOrdersCsv(new Date().toISOString().slice(0, 10))}>
              Today
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => {
              const { startDate, endDate } = getWeekRange();
              exportOrdersCsv(null, startDate, endDate);
            }}>
              This Week
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => exportOrdersCsv()}>
              All
            </button>
          </div>
          <div className="admin-orders-export" style={{ gap: '6px' }}>
            <input type="date" value={csvStartDate} onChange={e => setCsvStartDate(e.target.value)} style={{ fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.15)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>to</span>
            <input type="date" value={csvEndDate} onChange={e => setCsvEndDate(e.target.value)} style={{ fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.15)' }} />
            <button 
              className="btn btn--ghost btn--sm" 
              disabled={!csvStartDate || !csvEndDate}
              onClick={() => exportOrdersCsv(null, csvStartDate, csvEndDate)}
            >
              Export Range
            </button>
          </div>
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
          <div style={{ padding: 24 }}><SkeletonList rows={5} /></div>
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
                  className={`order-card ${isSoldOut ? 'is-soldout' : ''}`}
                  style={isSoldOut ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
                >
                  <div className="orders-row">
                    <div className="order-email">
                      <div className="order-name">
                        {order.name && order.name !== 'Unknown' && order.name.trim() ? order.name : (order.email ? order.email.split('@')[0] : 'Unknown')}
                      </div>
                      <div className="order-email-text">{order.email || 'No email'}</div>
                    </div>
                    <div className="order-usn">{order.usn && order.usn.trim() ? order.usn : '-'}</div>
                    <div className="order-type">
                      <span className={`type-badge type-${order.type === 'confirmed_order' ? 'order' : order.type === 'resell_listing' ? 'resell' : order.type}`}>
                        {order.type === 'confirmed_order' ? 'Order' : order.type === 'resell_listing' ? 'Resell Listing' : order.type}
                      </span>
                      {order.orderNumber && <div className="order-number">{order.orderNumber}</div>}
                      {order.type === 'resell_listing' && (() => {
                        const itemStatus = order.items[0]?.status;
                        const payStatus = order.paymentStatus;
                        const isDeleted = payStatus === 'deleted' || itemStatus === 'deleted';
                        const isExpired = payStatus === 'expired' || itemStatus === 'expired';
                        return (
                          <div className={`resell-status ${isDeleted ? 'deleted' : isExpired ? 'expired' : 'active'}`}>
                            {isDeleted ? '🗑️ Deleted' : isExpired ? '⏱️ Expired' : '✓ Active'}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="order-items-summary">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      <span className="order-total-inline">{formatPrice(isNaN(total) ? 0 : total)}</span>
                      {order.is_delivery && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>📦 Delivery</span>}
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
                      <span className="order-payment-na">N/A</span>
                    )}
                  </div>
                  <div className="order-actions">
                    {order.type === 'confirmed_order' && order.paymentStatus === 'paid' && (
                      <button
                        className="btn btn--ghost btn-refund"
                        onClick={() => handleRefund(order.id, order.email)}
                      >
                        Refund
                      </button>
                    )}
                    <button
                      className="btn btn--ghost btn--sm"
                      style={{ color: '#991b1b', fontSize: '0.8rem' }}
                      onClick={() => deleteOrder(order.id, order.email)}
                      title="Delete this order"
                    >
                      Delete
                    </button>
                  </div>
                  </div>

                  <details className="order-details-expand">
                    <summary>View items</summary>
                    <div className="order-items-grid">
                      {order.items.map((item, i) => (
                        <div key={i} className="order-item-card">
                          <div className="order-item-name">
                            {item.name || item.title}
                            {item.variant && <span className="order-item-variant"> ({item.variant})</span>}
                            {item.condition && <span> · {item.condition}</span>}
                            {item.year && <span> ({item.year})</span>}
                          </div>
                          {order.type === 'resell_listing' ? (
                            <div className="order-item-meta">
                              {item.priceRange && <span>{item.priceRange}</span>}
                              {item.pictures?.length > 0 && <span>{item.pictures.length} image{item.pictures.length !== 1 ? 's' : ''}</span>}
                            </div>
                          ) : (
                            <div className="order-item-meta">
                              Qty {item.quantity || 1} × {formatPrice(item.price || 0)} = <strong>{formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="order-summary-bar">
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      {order.is_delivery && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>
                          📦 Delivery — {order.delivery_address || 'No address provided'}
                        </span>
                      )}
                      <span className="order-summary-total">Total: {order.type === 'resell_listing' ? (order.items[0]?.priceRange || 'TBD') : formatPrice(isNaN(total) ? 0 : total)}</span>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

