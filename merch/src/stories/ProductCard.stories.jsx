// Storybook story for ProductCard (inline in EventPage — this demonstrates the CSS)
import React from "react";

const MOCK_PRODUCT = {
  id: "tee",
  name: "Classic Event Tee",
  description: "Premium cotton, limited edition design.",
  price: 599,
  previewLabel: "TEE",
  swatch: ["#ff6600", "#ff8c42"],
  sleeveOptions: ["Half Sleeve", "Full Sleeve"],
};

const formatPrice = (a) => `₹${a.toLocaleString("en-IN")}`;

function ProductCardDemo({ product = MOCK_PRODUCT, soldOut = false }) {
  return (
    <article className={`product-card ${soldOut ? "is-soldout" : ""}`}>
      <div
        className="product-card__preview"
        style={{ background: `linear-gradient(135deg, ${product.swatch[0]}, ${product.swatch[1]})` }}
      >
        <span>{product.previewLabel}</span>
      </div>
      <div className="product-card__meta">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-card__price-row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          <span className="product-card__badge">Utsav</span>
        </div>
      </div>
      <div className="product-card__controls">
        <div className="qty-control">
          <button className="qty-btn" disabled>-</button>
          <span className="qty-count">0</span>
          <button className="qty-btn">+</button>
        </div>
        <button className="btn btn--ghost">Add to cart</button>
      </div>
    </article>
  );
}

export default { title: "Components/ProductCard", component: ProductCardDemo };

export const Default = () => <ProductCardDemo />;
export const SoldOut = () => <ProductCardDemo soldOut />;
export const Grid = () => (
  <div className="product-grid" style={{ maxWidth: 800 }}>
    <ProductCardDemo />
    <ProductCardDemo product={{ ...MOCK_PRODUCT, name: "Oversized Hoodie", price: 1299, swatch: ["#3b82f6", "#60a5fa"] }} />
    <ProductCardDemo product={{ ...MOCK_PRODUCT, name: "Varsity Jacket", price: 1899, swatch: ["#8b5cf6", "#a78bfa"] }} />
  </div>
);
