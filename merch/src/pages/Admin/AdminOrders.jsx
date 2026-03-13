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
                      <div className="admin-order-items-popover">
                        <span className="admin-items-count">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                        {order.is_delivery && <span className="admin-delivery-tag">📦 Delivery</span>}
                      </div>
                    </td>
                    <td>
                      <span className="admin-order-price">
                        {order.type === 'resell_listing' ? (order.items[0]?.priceRange || 'TBD') : formatPrice(isNaN(total) ? 0 : total)}
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
                        <button className="admin-icon-btn admin-icon-btn--sm" title="View Details">
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
    </div>
  );
}

