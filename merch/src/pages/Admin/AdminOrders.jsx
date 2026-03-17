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
  const [selectedOrder, setSelectedOrder] = useState(null);
  
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
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Order Management</h1>
        <p>Manage confirmed orders, carts, and resell listings.</p>
      </div>

      <div className="admin-orders-controls">
        <div className="admin-orders-tabs">
          <button 
            className={`admin-tab ${activeTab === 'all' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All <span className="admin-tab-count">{allOrders.length}</span>
          </button>
          <button 
            className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Confirmed <span className="admin-tab-count">{confirmedOrders.length}</span>
          </button>
          <button 
            className={`admin-tab ${activeTab === 'cart' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            In Carts <span className="admin-tab-count">{cartItems.length}</span>
          </button>
          <button 
            className={`admin-tab ${activeTab === 'resell' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('resell')}
          >
            Resell <span className="admin-tab-count">{resellListings.length}</span>
          </button>
        </div>

        <div className="admin-orders-actions">
          <div className="admin-orders-export-group">
            <span className="material-symbols-outlined">download</span>
            <button onClick={() => exportOrdersCsv(new Date().toISOString().slice(0, 10))}>Today</button>
            <button onClick={() => {
              const { startDate, endDate } = getWeekRange();
              exportOrdersCsv(null, startDate, endDate);
            }}>Week</button>
            <button onClick={() => exportOrdersCsv()}>All</button>
          </div>
          <button className="admin-icon-btn" onClick={loadAllOrders} disabled={loading} title="Refresh Data">
            <span className={`material-symbols-outlined ${loading ? 'spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-orders-filter-bar">
        <div className="admin-orders-search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search name, USN, email..." />
        </div>
        <div className="admin-orders-range">
          <input type="date" value={csvStartDate} onChange={e => setCsvStartDate(e.target.value)} />
          <span className="material-symbols-outlined">arrow_forward</span>
          <input type="date" value={csvEndDate} onChange={e => setCsvEndDate(e.target.value)} />
          <button 
            className="admin-btn admin-btn--primary"
            disabled={!csvStartDate || !csvEndDate}
            onClick={() => exportOrdersCsv(null, csvStartDate, csvEndDate)}
          >
            Export Range
          </button>
        </div>
      </div>

{loading && allOrders.length === 0 ? (
        <div style={{ padding: 24 }}><SkeletonList rows={5} /></div>
      ) : displayOrders.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: 24 }}>
          No {activeTab === 'all' ? '' : activeTab} items found.
        </p>
      ) : (
        <div className="admin-orders-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>USN</th>
                <th>Type</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((order, idx) => {
                let total = order.totalAmount;
                if (!total || (order.type === 'resell_listing' && total === 0)) {
                  if (order.type === 'resell_listing' && order.items[0]?.priceRange) {
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
                  <tr key={order.id || idx} className={isSoldOut ? 'row-muted' : ''}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-name">
                          {order.name && order.name !== 'Unknown' && order.name.trim() ? order.name : (order.email ? order.email.split('@')[0] : 'Unknown')}
                        </span>
                        <span className="admin-user-email">{order.email || 'No email'}</span>
                      </div>
                    </td>
                    <td>{order.usn && order.usn.trim() ? order.usn : '-'}</td>
                    <td>
                      <span className={`admin-type-badge type-${order.type}`}>
                        {order.type === 'confirmed_order' ? 'Order' : order.type === 'resell_listing' ? 'Resell' : order.type}
                      </span>
                      {order.orderNumber && <div className="admin-order-id">#{order.orderNumber}</div>}
                    </td>
                    <td>
                      {order.type === 'resell_listing' ? (
                        <span className={`admin-type-badge type-resell-${(order.items[0]?.status || 'active').toLowerCase()}`} style={{
                          background: order.items[0]?.status === 'deleted' ? 'rgba(220,38,38,0.1)' :
                            order.items[0]?.status === 'expired' ? 'rgba(245,158,11,0.1)' :
                            'rgba(34,197,94,0.1)',
                          color: order.items[0]?.status === 'deleted' ? '#dc2626' :
                            order.items[0]?.status === 'expired' ? '#d97706' :
                            '#16a34a'
                        }}>
                          {order.items[0]?.status === 'deleted' ? '🗑 Deleted' :
                           order.items[0]?.status === 'expired' ? '⏱ Expired' :
                           '✓ Active'}
                        </span>
                      ) : (
                        <span className="admin-text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-order-items-popover">
                        <span className="admin-items-count">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                        {order.is_delivery && <span className="admin-delivery-tag">📦 Delivery</span>}
                        {order.is_delivery && order.delivery_address && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.delivery_address}>📍 {order.delivery_address}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-order-price" style={order.is_delivery ? { color: '#ef4444', fontWeight: 'bold' } : {}}>
                        {order.type === 'resell_listing' ? (order.items[0]?.priceRange || 'TBD') : (
                          order.is_delivery
                            ? `${formatPrice((isNaN(total) ? 0 : total) - 100)} + 100`
                            : formatPrice(isNaN(total) ? 0 : total)
                        )}
                      </span>
                    </td>
                    <td>
                      {order.type === 'confirmed_order' ? (
                        <div className="admin-status-select">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                            className={`status-chip chip-${order.paymentStatus}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      ) : (
                        <span className="admin-text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button 
                          className="admin-icon-btn admin-icon-btn--sm" 
                          title="View Details"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button className="admin-icon-btn admin-icon-btn--sm admin-icon-btn--danger" onClick={() => deleteOrder(order.id, order.email)} title="Delete">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="admin-edit-modal" onClick={() => setSelectedOrder(null)}>
          <div className="admin-edit-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Order Details</h3>
              <button className="admin-icon-btn" onClick={() => setSelectedOrder(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--admin-bg)', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>CUSTOMER INFO</p>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{selectedOrder.name || 'Unknown'}</p>
                <p style={{ margin: '0 0 0.25rem 0' }}>{selectedOrder.email}</p>
                {selectedOrder.usn && <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>USN: {selectedOrder.usn}</p>}
                {selectedOrder.phone && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--admin-text-muted)' }}>Phone: {selectedOrder.phone}</p>}
              </div>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ORDER INFO</p>
                <p style={{ margin: '0 0 0.25rem 0' }}>Type: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{selectedOrder.type.replace('_', ' ')}</span></p>
                {selectedOrder.orderNumber && <p style={{ margin: '0 0 0.25rem 0' }}>Order #: <strong>{selectedOrder.orderNumber}</strong></p>}
                <p style={{ margin: '0 0 0.25rem 0' }}>Payment: <span style={{ textTransform: 'capitalize' }}>{selectedOrder.paymentStatus || 'N/A'}</span></p>
                {selectedOrder.created_at && <p style={{ margin: 0, color: 'var(--admin-text-muted)' }}>Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>}
              </div>
            </div>

            {/* Delivery Info */}
            {selectedOrder.is_delivery && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>📦 DELIVERY ORDER</p>
                {selectedOrder.delivery_address && <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}><strong>Address:</strong> {selectedOrder.delivery_address}</p>}
                {selectedOrder.delivery_charge != null && <p style={{ margin: 0, fontSize: '0.9rem', color: '#ef4444', fontWeight: 700 }}>Delivery Charge: +{formatPrice(selectedOrder.delivery_charge)}</p>}
              </div>
            )}

            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>Items ({selectedOrder.items.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px dashed var(--admin-border)', borderRadius: '8px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--admin-bg)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)' }}>
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{item.name || 'Unknown Product'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                      Variant: {item.variant || 'Standard'} | Event: {item.tabKey || 'N/A'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{formatPrice(item.price)}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>Qty: {item.quantity || 1}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total with delivery */}
            {selectedOrder.is_delivery && selectedOrder.delivery_charge != null && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: '2rem', alignItems: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>+{formatPrice(selectedOrder.delivery_charge)} delivery</span>
              </div>
            )}

            <div className="admin-edit-actions">
              <button className="btn btn--ghost" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

