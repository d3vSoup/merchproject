import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { SkeletonList } from "../../components/Skeleton";
import "./AdminDashboard.css";

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

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
            auditLogs.map((log) => (
              <div key={log.id} className="admin-audit-item">
                <span className="admin-audit__time">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                </span>
                <span className="admin-audit__action">{log.action}</span>
                <span className="admin-audit__entity">
                  {log.entity_type}: {log.entity_id || "-"}
                </span>
                {log.old_value && Object.keys(log.old_value).length > 0 && (
                  <span className="admin-audit__detail">
                    Before: {JSON.stringify(log.old_value)}
                  </span>
                )}
                {log.new_value && Object.keys(log.new_value).length > 0 && (
                  <span className="admin-audit__detail">
                    After: {JSON.stringify(log.new_value)}
                  </span>
                )}
                <span className="admin-audit__admin">{log.admin_email}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
