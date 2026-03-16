import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import { SkeletonList } from "../../components/Skeleton";
import { PRODUCT_CATALOG } from "../../data/products";
import "./OrderHistory.css";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "status--pending" },
  paid: { label: "Paid", className: "status--paid" },
  failed: { label: "Failed", className: "status--failed" },
  refunded: { label: "Refunded", className: "status--refunded" },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveProductImage(item) {
  const products = PRODUCT_CATALOG[item.tabKey];
  if (!products) return null;
  const product = products.find((p) => p.id === item.productId);
  if (!product) return null;
  if (product.imageUrl) return { type: "image", url: product.imageUrl };
  if (product.swatch)
    return {
      type: "swatch",
      gradient: `linear-gradient(135deg, ${product.swatch[0]}, ${product.swatch[1]})`,
      label: product.previewLabel || product.name,
    };
  return null;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    async function fetchOrders() {
      try {
        const res = await api.get("/api/orders");
        setOrders(res.data?.orders || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <section className="orders-section">
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <p className="orders-empty-text">Sign in to view your orders</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="orders-section">
        <div style={{ padding: "24px 0" }}><SkeletonList rows={4} /></div>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="orders-section">
        <div className="orders-header">
          <h1 className="orders-title">Your <br /><span className="orders-title__gradient">Orders</span></h1>
          <p className="orders-subtitle">Your order history will appear here</p>
        </div>
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <p className="orders-empty-text">No orders yet</p>
          <button
            className="btn btn--primary"
            onClick={() => navigate("/")}
          >
            Start Shopping
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-section">
      <div className="orders-header">
        <h1 className="orders-title">Your <br /><span className="orders-title__gradient">Orders</span></h1>
        <p className="orders-subtitle">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const status = STATUS_CONFIG[order.payment_status] || STATUS_CONFIG.pending;
          const isExpanded = expandedOrder === order.id;
          const items = Array.isArray(order.items) ? order.items : [];

          return (
            <div key={order.id} className="order-card">
              <button
                className="order-card-header"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                aria-expanded={isExpanded}
              >
                <div className="order-card-left">
                  <div className="order-number">{order.order_number || "—"}</div>
                  <div className="order-date">
                    {formatDate(order.created_at)} at {formatTime(order.created_at)}
                  </div>
                </div>
                <div className="order-card-right">
                  <span className={`order-status ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="order-amount">
                    {formatPrice(order.total_amount || 0)}
                  </span>
                  <span className={`order-chevron ${isExpanded ? "is-open" : ""}`}>
                    ›
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="order-card-body">
                  <div className="order-items-list">
                    {items.map((item, i) => {
                      const visual = resolveProductImage(item);
                      return (
                        <div key={i} className="order-item">
                          <div className="order-item-preview">
                            {visual?.type === "image" ? (
                              <img src={visual.url} alt={item.name} loading="lazy" />
                            ) : visual?.type === "swatch" ? (
                              <div
                                className="order-item-swatch"
                                style={{ background: visual.gradient }}
                              >
                                {visual.label}
                              </div>
                            ) : (
                              <div className="order-item-swatch order-item-swatch--empty">
                                {(item.name || "?").charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="order-item-details">
                            <div className="order-item-name">{item.name || "Product"}</div>
                            {item.variant && (
                              <div className="order-item-variant">{item.variant}</div>
                            )}
                            <div className="order-item-meta">
                              Qty: {item.quantity || 1} &times; {formatPrice(item.price || 0)}
                            </div>
                          </div>
                          <div className="order-item-subtotal">
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="order-card-footer">
                    <span>Total</span>
                    <span className="order-footer-total">
                      {formatPrice(order.total_amount || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
