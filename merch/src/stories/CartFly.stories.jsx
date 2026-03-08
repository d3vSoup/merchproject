// Storybook story for CartFly animation
import React, { useRef } from "react";
import { triggerCartFly } from "../components/CartFly";

function CartFlyDemo() {
  const sourceRef = useRef(null);

  return (
    <div style={{ padding: 40 }}>
      <p style={{ marginBottom: 16, color: "var(--c-muted)" }}>
        Click the card to trigger a fly animation toward the cart button position.
      </p>

      {/* Simulated cart button in the corner */}
      <div style={{ position: "fixed", top: 16, right: 16 }}>
        <button className="icon-btn cart-btn">
          🛒 <span className="cart-badge">2</span>
        </button>
      </div>

      <div
        ref={sourceRef}
        onClick={() => triggerCartFly(sourceRef.current, "linear-gradient(135deg, #ff6600, #ff8c42)")}
        style={{
          width: 200,
          height: 200,
          borderRadius: 16,
          background: "linear-gradient(135deg, #ff6600, #ff8c42)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
        }}
      >
        Click me
      </div>
    </div>
  );
}

export default { title: "Components/CartFly", component: CartFlyDemo };
export const Default = () => <CartFlyDemo />;
