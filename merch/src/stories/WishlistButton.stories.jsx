// Storybook story for WishlistHeart
import React, { useState } from "react";

function WishlistButtonDemo() {
  const [active, setActive] = useState(false);

  return (
    <div style={{ position: "relative", width: 200, height: 200, background: "#f0f0f0", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button
        type="button"
        className={`wishlist-btn wishlist-btn--card ${active ? "is-active heart-pop" : ""}`}
        onClick={() => setActive((v) => !v)}
        aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={active}
      >
        <span className="heart-burst" aria-hidden="true" />
        {active ? "♥" : "♡"}
      </button>
    </div>
  );
}

export default { title: "Components/WishlistButton", component: WishlistButtonDemo };
export const Default = () => <WishlistButtonDemo />;
