import React from "react";
import "./Skeleton.css";

export function SkeletonLine({ width = "100%", height = "14px" }) {
  return <div className="skeleton-line" style={{ width, height }} />;
}

export function SkeletonCard({ index = 0 }) {
  return (
    <div
      className="skeleton-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="skeleton-card-image" />
      <div className="skeleton-card-body">
        <SkeletonLine width="70%" height="16px" />
        <SkeletonLine width="100%" />
        <div className="skeleton-card-price">
          <SkeletonLine width="80px" height="14px" />
          <SkeletonLine width="60px" height="22px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-list-row"
          style={{ animationDelay: `${i * 50}ms` }}
        >
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
    <div className="skeleton-page" aria-busy="true">
      <SkeletonLine width="200px" height="22px" />
      <div style={{ marginTop: 20 }}>
        {type === "grid" ? <SkeletonGrid /> : <SkeletonList />}
      </div>
    </div>
  );
}
