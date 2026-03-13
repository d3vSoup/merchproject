import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { SkeletonList } from "../../components/Skeleton";
import "./AdminDashboard.css";

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

function formatAuditAction(action) {
  if (!action) return 'Action';
  const labels = {
    approve_resell_item: 'Approved resell listing',
    reject_resell_item: 'Rejected resell listing',
    hide_resell_item: 'Hidden resell item',
    restore_resell_item: 'Restored resell item',
    update_product: 'Updated product',
    create_product: 'Created product',
    delete_product: 'Deleted product',
  };
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAuditValue(obj) {
  if (!obj || typeof obj !== 'object') return '-';
  const parts = Object.entries(obj).map(([k, v]) => {
    const key = k.replace(/_/g, ' ');
    if (v === null || v === undefined) return null;
    if (typeof v === 'boolean') return `${key}: ${v ? 'yes' : 'no'}`;
    return `${key}: ${v}`;
  }).filter(Boolean);
  return parts.join(' · ') || '-';
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    try {
      const [analyticsRes, auditRes] = await Promise.all([
        api.get("/api/admin/analytics", { params: { days } }),
        api.get("/api/admin/audit", { params: { limit: 20 } }),
      ]);
      setMetrics(analyticsRes.data?.metrics || null);
      setAuditLogs(auditRes.data?.logs || []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setMetrics(null);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-dashboard">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__skeleton">
          <SkeletonList rows={8} />
        </div>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
        <p>Real-time insights and system activity.</p>
      </div>

      <div className="admin-dashboard__period">
        <div className="admin-period-selector">
          <span className="material-symbols-outlined">calendar_today</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>Last 24 Hours</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
          </select>
        </div>
      </div>

      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="admin-metric-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <span className="material-symbols-outlined">visibility</span>
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric__label">Page Views</span>
            <span className="admin-metric__value">{metrics?.pageViews ?? 0}</span>
          </div>
        </div>
        
        <div className="admin-metric-card">
          <div className="admin-metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <span className="material-symbols-outlined">category</span>
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric__label">Product Browsed</span>
            <span className="admin-metric__value">{metrics?.productViews ?? 0}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <span className="material-symbols-outlined">add_shopping_cart</span>
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric__label">Cart Adds</span>
            <span className="admin-metric__value">{metrics?.cartAdds ?? 0}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric__label">Checkout Starts</span>
            <span className="admin-metric__value">{metrics?.checkoutStarts ?? 0}</span>
          </div>
        </div>

        <div className="admin-metric-card admin-metric-card--featured">
          <div className="admin-metric-icon">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric__label">Orders Placed</span>
            <span className="admin-metric__value">{metrics?.ordersPlaced ?? 0}</span>
          </div>
        </div>

        <div className="admin-metric-card admin-metric-card--featured">
          <div className="admin-metric-icon">
            <span className="material-symbols-outlined">currency_rupee</span>
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric__label">Total Revenue</span>
            <span className="admin-metric__value">{formatPrice(metrics?.revenue)}</span>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Recent Activity</h2>
          <Link to="/admin/audit" className="admin-link">View All</Link>
        </div>
        
        <div className="admin-audit-table-wrapper">
          <table className="admin-audit-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Admin</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-table-empty">No activity logs recorded.</td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const actionLabel = formatAuditAction(log.action);
                  const isPositive = /approve|restore|create/.test(log.action);
                  const isNegative = /reject|delete|hide/.test(log.action);
                  
                  return (
                    <tr key={log.id}>
                      <td>
                        <span className={`admin-status-pill ${isPositive ? 'status-success' : isNegative ? 'status-danger' : 'status-info'}`}>
                          {actionLabel}
                        </span>
                      </td>
                      <td>
                        <div className="admin-entity-info">
                          <span className="admin-entity-type">{log.entity_type}</span>
                          <span className="admin-entity-id">{log.entity_id}</span>
                        </div>
                      </td>
                      <td>{log.admin_email?.split('@')[0]}</td>
                      <td>{log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>
                        <button className="admin-icon-btn admin-icon-btn--sm" title="View Changes">
                          <span className="material-symbols-outlined">info</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
