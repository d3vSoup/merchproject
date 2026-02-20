// src/pages/Resell/ResellBuyer.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";
import api from "../../api";
import { SkeletonGrid } from "../../components/Skeleton";

export default function ResellBuyer() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [loadingSellerInfo, setLoadingSellerInfo] = useState(false);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  async function loadItems() {
    if (!user) return;
    setLoading(true);
    try {
      // Use backend endpoint to get all active items except user's own
      const res = await api.get('/api/resell/items/available');
      setItems(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load available items:', err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  async function handleContactSeller(item) {
    if (!user?.email) {
      toast.error("Please sign in to contact seller");
      return;
    }

    setLoadingSellerInfo(true);
    try {
      // Fetch seller info from backend
      const res = await api.get(`/api/resell/seller-info/${item.user_id}`);
      setSellerInfo(res.data?.seller || null);
      setShowSellerModal(true);
    } catch (err) {
      console.error('Failed to get seller info:', err);
      toast.error('Failed to get seller information');
    } finally {
      setLoadingSellerInfo(false);
    }
  }

  function handleItemClick(item) {
    setSelectedItem(item);
  }

  function closeDetailView() {
    setSelectedItem(null);
  }

  function closeSellerModal() {
    setShowSellerModal(false);
    setSellerInfo(null);
  }

  if (loading) {
    return <div style={{ padding: "24px 16px" }}><SkeletonGrid count={4} /></div>;
  }

  return (
    <div className="resell-buyer">
      <h2>Available Items</h2>
      {items.length === 0 ? (
        <p>No items available at the moment.</p>
      ) : (
        <div className="buyer-items-grid">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="buyer-item-card"
              onClick={() => handleItemClick(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="item-images">
                {item.pictures && item.pictures.length > 0 && item.pictures.slice(0, 1).map((url, idx) => (
                  <img key={idx} src={url} alt={item.title} loading="lazy" />
                ))}
              </div>
              <div className="item-info">
                <h3>{item.title}</h3>
                <p>Condition: {item.condition}</p>
                {item.year && <p>Year: {item.year}</p>}
                {item.price_range && <p className="price-range">{item.price_range}</p>}
                {item.description && (
                  <p className="item-description">
                    {item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description}
                  </p>
                )}
                <button
                  className="btn btn--primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactSeller(item);
                  }}
                  disabled={loadingSellerInfo}
                >
                  {loadingSellerInfo ? 'Loading...' : 'Contact Seller'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail View Modal */}
      {selectedItem && (
        <div 
          className="modal-overlay"
          onClick={closeDetailView}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={closeDetailView}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text)',
                padding: '4px 8px'
              }}
            >
              ×
            </button>
            
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>{selectedItem.title}</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>Condition:</strong> {selectedItem.condition}
            </div>
            
            {selectedItem.year && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Year of Purchase:</strong> {selectedItem.year}
              </div>
            )}
            
            {selectedItem.price_range && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Price Range:</strong> <span className="price-range">{selectedItem.price_range}</span>
              </div>
            )}
            
            {selectedItem.description && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '8px', lineHeight: '1.6' }}>{selectedItem.description}</p>
              </div>
            )}
            
            {selectedItem.pictures && selectedItem.pictures.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Images ({selectedItem.pictures.length}):</strong>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginTop: '12px'
                }}>
                  {selectedItem.pictures.map((url, idx) => (
                    <img 
                      key={idx} 
                      src={url} 
                      alt={`${selectedItem.title} - Image ${idx + 1}`}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <button
              className="btn btn--primary"
              onClick={() => {
                closeDetailView();
                handleContactSeller(selectedItem);
              }}
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loadingSellerInfo}
            >
              {loadingSellerInfo ? 'Loading...' : 'Contact Seller'}
            </button>
          </div>
        </div>
      )}

      {/* Seller Contact Info Modal */}
      {showSellerModal && (
        <div 
          className="modal-overlay"
          onClick={closeSellerModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            <button
              onClick={closeSellerModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text)',
                padding: '4px 8px'
              }}
            >
              ×
            </button>
            
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px',
              color: 'white'
            }}>
              👤
            </div>
            
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Seller Contact Info</h2>
            
            {sellerInfo ? (
              <div style={{ textAlign: 'left' }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>Name</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    {sellerInfo.name || 'Not provided'}
                  </div>
                </div>
                
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    <a href={`mailto:${sellerInfo.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      {sellerInfo.email || 'Not provided'}
                    </a>
                  </div>
                </div>
                
                {sellerInfo.phone && (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'rgba(0,0,0,0.05)', 
                    borderRadius: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>Phone</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                      <a href={`tel:${sellerInfo.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                        {sellerInfo.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                <p style={{ 
                  marginTop: '20px', 
                  fontSize: '0.9rem', 
                  color: 'var(--muted)',
                  textAlign: 'center'
                }}>
                  Contact the seller directly to discuss the item and arrange the transaction.
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Seller information not available</p>
            )}
            
            <button
              className="btn btn--ghost"
              onClick={closeSellerModal}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
