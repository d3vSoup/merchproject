import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getCart, updateCartItem } from '../api/cart';
import { triggerCartUpdate } from '../hooks/useCartCount';
import toast from 'react-hot-toast';
import './ProductModal.css';

export default function ProductModal({ product, tabKey, onClose, isProductSoldOut = false }) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product?.sleeveOptions?.[0] || null);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  
  if (!product) return null;

  // Combine primary imageUrl with additional images array
  const allImages = [];
  if (product.imageUrl) allImages.push(product.imageUrl);
  if (product.images && Array.isArray(product.images)) {
    allImages.push(...product.images.filter(img => img && img !== product.imageUrl));
  }
  const images = allImages.length > 0 ? allImages : [];
  const hasMultipleImages = images.length > 1;

  // Load cart quantity on mount and when variant changes
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setQuantity(0);
        return;
      }
      try {
        const cart = await getCart();
        const cartItem = cart.find(
          item => item.tab_key === tabKey && 
                  item.product_id === product.id && 
                  (item.variant || null) === (selectedVariant || null)
        );
        setQuantity(cartItem?.quantity || 0);
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    }
    loadData();
  }, [user, product.id, tabKey, selectedVariant]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  const handleAdjustCart = async (delta) => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }
    
    const newQuantity = Math.max(0, quantity + delta);
    setLoading(true);
    
    try {
      await updateCartItem(tabKey, product.id, selectedVariant, newQuantity);
      setQuantity(newQuantity);
      triggerCartUpdate();
      if (delta > 0) {
        toast.success("Added to cart");
      } else if (newQuantity === 0) {
        toast.success("Removed from cart");
      }
    } catch (err) {
      console.error('Failed to update cart:', err);
      toast.error(err.message || 'Failed to update cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-layout">
          <div className="modal-images">
            {images.length > 0 ? (
              <>
                <img 
                  src={images[currentImageIndex]} 
                  alt={product.name} 
                  className="modal-main-image"
                  loading="lazy"
                />
                {hasMultipleImages && (
                  <>
                    <button className="image-nav prev" onClick={prevImage}>‹</button>
                    <button className="image-nav next" onClick={nextImage}>›</button>
                    <div className="image-indicators">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div 
                className="modal-main-image placeholder"
                style={{ 
                  background: product.swatch 
                    ? `linear-gradient(135deg, ${product.swatch[0]}, ${product.swatch[1]})`
                    : '#f0f0f0'
                }}
              >
                {product.previewLabel || product.name}
              </div>
            )}
          </div>

          <div className="modal-details">
            <h2 className="modal-title">{product.name}</h2>
            <div className="modal-price">{formatPrice(product.price)}</div>
            {product.description && (
              <p className="modal-description">{product.description}</p>
            )}
            
            {/* Variant Selection */}
            {product.sleeveOptions && product.sleeveOptions.length > 1 && (
              <div className="modal-variants">
                <label>Select Option:</label>
                <div className="variant-chips">
                  {product.sleeveOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`variant-chip ${selectedVariant === opt ? 'is-active' : ''}`}
                      onClick={() => setSelectedVariant(opt)}
                      disabled={isProductSoldOut || loading}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Controls and Actions */}
            <div className="modal-actions">
              <div className="modal-actions-qty-row">
                <div className="qty-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleAdjustCart(-1)}
                    disabled={quantity === 0 || isProductSoldOut || loading}
                  >
                    -
                  </button>
                  <span className="qty-count">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleAdjustCart(1)}
                    disabled={isProductSoldOut || loading}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="modal-actions-buttons">
                <button 
                  className="btn btn--primary" 
                  onClick={() => handleAdjustCart(1)}
                  disabled={isProductSoldOut || loading}
                >
                  {isProductSoldOut ? "Unavailable" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
