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
    <section className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__nav">
          <Link to="/admin/orders" className="btn btn--secondary">
            Manage Orders
          </Link>
          <Link to="/admin/items" className="btn btn--secondary">
            Manage Items
          </Link>
        </div>
      </div>

      <div className="admin-dashboard__period">
        <label>
          Period:
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>Last 1 day</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      <div className="admin-dashboard__section">
        <h2>Site Analytics</h2>
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <span className="admin-metric__value">{metrics?.pageViews ?? 0}</span>
            <span className="admin-metric__label">Page Views</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric__value">{metrics?.productViews ?? 0}</span>
            <span className="admin-metric__label">Products Browsed</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric__value">{metrics?.cartAdds ?? 0}</span>
            <span className="admin-metric__label">Cart Adds</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric__value">{metrics?.checkoutStarts ?? 0}</span>
            <span className="admin-metric__label">Checkout Starts</span>
          </div>
          <div className="admin-metric-card admin-metric-card--highlight">
            <span className="admin-metric__value">{metrics?.ordersPlaced ?? 0}</span>
            <span className="admin-metric__label">Orders Placed</span>
          </div>
          <div className="admin-metric-card admin-metric-card--highlight">
            <span className="admin-metric__value">{formatPrice(metrics?.revenue)}</span>
            <span className="admin-metric__label">Revenue (paid)</span>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric__value">{metrics?.wishlistAdds ?? 0}</span>
            <span className="admin-metric__label">Wishlist Adds</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__section">
        <h2>Recent Admin Actions</h2>
        <div className="admin-audit-list">
          {auditLogs.length === 0 ? (
            <p className="admin-audit-empty">No audit entries yet</p>
          ) : (
            auditLogs.map((log) => {
              const actionLabel = formatAuditAction(log.action);
              const isPositive = /approve|restore|create/.test(log.action);
              const isNegative = /reject|delete|hide/.test(log.action);
              return (
                <div key={log.id} className={`admin-audit-card ${isPositive ? 'admin-audit-card--success' : ''} ${isNegative ? 'admin-audit-card--danger' : ''}`}>
                  <div className="admin-audit-card__header">
                    <span className="admin-audit-card__action">{actionLabel}</span>
                    <time className="admin-audit-card__time">
                      {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </time>
                  </div>
                  <div className="admin-audit-card__body">
                    <div className="admin-audit-card__meta">
                      <span className="admin-audit-card__entity">{log.entity_type}</span>
                      {log.entity_id && <span className="admin-audit-card__id">{log.entity_id}</span>}
                    </div>
                    {(log.old_value || log.new_value) && Object.keys(log.old_value || log.new_value || {}).length > 0 && (
                      <div className="admin-audit-card__changes">
                        {log.old_value && Object.keys(log.old_value).length > 0 && (
                          <div className="admin-audit-card__change">
                            <span className="admin-audit-card__change-label">Before</span>
                            <span className="admin-audit-card__change-value">{formatAuditValue(log.old_value)}</span>
                          </div>
                        )}
                        {log.new_value && Object.keys(log.new_value).length > 0 && (
                          <div className="admin-audit-card__change">
                            <span className="admin-audit-card__change-label">After</span>
                            <span className="admin-audit-card__change-value">{formatAuditValue(log.new_value)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="admin-audit-card__actor">{log.admin_email}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
