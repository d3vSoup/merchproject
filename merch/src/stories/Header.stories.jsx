// Storybook story for Header (topbar)
import React from "react";

function HeaderDemo() {
  return (
    <header className="topbar topbar--scrolled">
      <nav className="tabs-row desktop-tabs">
        {["Utsav", "Phaseshift", "Farouche", "Club & Dept", "Resell"].map((label, i) => (
          <div key={label} className="tab-wrapper">
            <span className={`tab ${i === 0 ? "tab--active" : ""}`}>{label}</span>
          </div>
        ))}
      </nav>
      <span className="brand">BMSCE Merchandise</span>
      <div className="top-actions">
        <button className="icon-btn" title="Search">🔍</button>
        <button className="icon-btn wishlist-header-btn">♥ <span className="wishlist-badge">3</span></button>
        <button className="icon-btn cart-btn">🛒 <span className="cart-badge">2</span></button>
        <div className="account">
          <button className="account-avatar account-avatar--letter">R</button>
        </div>
      </div>
    </header>
  );
}

export default { title: "Components/Header", component: HeaderDemo };
export const Default = () => <HeaderDemo />;
export const Scrolled = () => <HeaderDemo />;
