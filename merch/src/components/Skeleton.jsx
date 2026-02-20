import React from "react";
import "./Skeleton.css";

export function SkeletonLine({ width = "100%", height = "14px" }) {
  return <div className="skeleton-line" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-image" />
      <div className="skeleton-card-body">
        <SkeletonLine width="70%" height="16px" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="40%" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-list-row">
          <div className="skeleton-list-avatar" />
          <div className="skeleton-list-text">
            <SkeletonLine width="60%" height="14px" />
            <SkeletonLine width="90%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ type = "grid" }) {
  return (
    <div className="skeleton-page">
      <SkeletonLine width="200px" height="22px" />
      <div style={{ marginTop: 20 }}>
        {type === "grid" ? <SkeletonGrid /> : <SkeletonList />}
      </div>
    </div>
  );
}
