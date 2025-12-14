// src/pages/Resell/ResellSeller.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getUserIdByEmail, getUserResellItems, createResellItem, uploadResellImage } from "../../supabase/client";
import toast from "react-hot-toast";
import api from "../../api";

export default function ResellSeller() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [pastItems, setPastItems] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    condition: "new",
    year: "",
    description: "",
    priceRange: "",
    pictures: [],
  });
  const [uploading, setUploading] = useState(false);
  const [userSupabaseId, setUserSupabaseId] = useState(user?.supabaseId || null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (user?.email) {
      loadItems();
    }
  }, [user?.email]);

  useEffect(() => {
    setUserSupabaseId(user?.supabaseId || null);
  }, [user?.supabaseId]);

  async function resolveSupabaseId() {
    if (userSupabaseId) return userSupabaseId;
    if (!user?.email) return null;
    let resolved = await getUserIdByEmail(user.email);
    if (!resolved) {
      try {
        const res = await api.get('/api/user/supabase-id');
        resolved = res.data?.supabaseId || null;
      } catch (err) {
        console.error('Failed to fetch Supabase ID from backend', err);
      }
    }
    if (resolved) {
      setUserSupabaseId(resolved);
    }
    return resolved;
  }

  async function loadItems() {
    if (!user?.email) return;
    try {
      // Use backend endpoint instead of direct Supabase client
      const res = await api.get('/api/resell/items');
      setItems(res.data?.items || []);
      setPastItems(res.data?.pastItems || []);
    } catch (err) {
      console.error('Failed to load resell items:', err);
      toast.error('Failed to load your listings');
    }
  }

  async function handleDelete(itemId) {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    try {
      await api.delete(`/api/resell/items/${itemId}`);
      toast.success('Listing deleted successfully');
      await loadItems();
    } catch (err) {
      console.error('Failed to delete listing:', err);
      toast.error(err.response?.data?.message || 'Failed to delete listing');
    }
  }

  async function handleRelist(itemId) {
    try {
      const res = await api.post(`/api/resell/items/${itemId}/relist`);
      if (res.data?.item) {
        toast.success('Item relisted successfully!');
        await loadItems(); // Reload to get updated lists
        setActiveTab('active'); // Switch to active tab to show the relisted item
      } else {
        toast.error('Failed to relist item');
      }
    } catch (err) {
      console.error('Failed to relist item:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to relist item';
      toast.error(errorMsg);
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files).slice(0, 10);
    if (files.length === 0) return;

    setUploading(true);
    toast.loading(`Uploading ${files.length} image(s)...`, { id: 'upload-progress' });

    // Upload all images in PARALLEL for much faster uploads
    const uploadPromises = files.map(async (file) => {
      try {
        const formDataObj = new FormData();
        formDataObj.append('image', file);

        const res = await api.post('/api/resell/upload-image', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return res.data?.url || null;
      } catch (err) {
        console.error('Failed to upload image:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
        if (errorMsg.includes('Bucket not found')) {
          toast.error('Storage bucket not found. Please create "resell-images" bucket in Supabase Dashboard → Storage.', { id: 'bucket-error' });
        }
        return null;
      }
    });

    // Wait for all uploads to complete simultaneously
    const results = await Promise.all(uploadPromises);
    
    // Filter out failed uploads (null values)
    const successfulUploads = results.filter(url => url !== null);
    const failedCount = results.length - successfulUploads.length;

    toast.dismiss('upload-progress');

    if (successfulUploads.length > 0) {
      setFormData(prev => ({ ...prev, pictures: [...prev.pictures, ...successfulUploads] }));
      toast.success(`Uploaded ${successfulUploads.length} image(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`, { duration: 2000 });
    } else {
      toast.error(`Failed to upload images. Please try again.`);
    }
    setUploading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.email) {
      toast.error("Please sign in");
      return;
    }

    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description || formData.description.trim().length < 100) {
      toast.error("Description must be at least 100 characters");
      return;
    }

    if (formData.pictures.length < 6) {
      toast.error("Minimum 6 images required");
      return;
    }

    // Use backend endpoint instead of direct Supabase client
    // Backend will handle user ID resolution
    try {
      const res = await api.post('/api/resell/create-item', {
        title: formData.title,
        condition: formData.condition,
        year: formData.year,
        description: formData.description,
        priceRange: formData.priceRange,
        pictures: formData.pictures,
      });

      if (res.data?.item) {
        toast.success("Item listed successfully!");
        setFormData({
          title: "",
          condition: "new",
          year: "",
          description: "",
          priceRange: "",
          pictures: [],
        });
        setShowForm(false);
        await loadItems();
      } else {
        toast.error("Failed to create listing");
      }
    } catch (err) {
      console.error('Failed to create resell item:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create listing';
      toast.error(errorMsg);
    }
  }

  return (
    <div className="resell-seller">
      <div className="seller-header">
        <h2>My Listings</h2>
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Listing"}
        </button>
      </div>

      {/* Tabs for Active and Past Listings */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
        <button
          className={`btn ${activeTab === 'active' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('active')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'active' ? '2px solid var(--accent)' : 'none' }}
        >
          Active ({items.length})
        </button>
        <button
          className={`btn ${activeTab === 'past' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('past')}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'past' ? '2px solid var(--accent)' : 'none' }}
        >
          Past Listings ({pastItems.length})
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="listing-form">
          <label>
            Title *
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, title: val }));
              }}
              required
              placeholder="e.g., Utsav Varsity Jacket"
            />
          </label>
          <label>
            Condition *
            <select
              value={formData.condition}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, condition: val }));
              }}
              required
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </label>
          <label>
            Year of Purchase
            <input
              type="number"
              value={formData.year}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, year: val }));
              }}
              placeholder="e.g., 2024"
            />
          </label>
          <label>
            Description * (Minimum 100 characters)
            <textarea
              value={formData.description}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, description: val }));
              }}
              rows={4}
              placeholder="Describe the item in detail (minimum 100 characters)..."
              required
              minLength={100}
            />
            <p className="help-text" style={{ fontSize: '0.85rem', color: formData.description.length >= 100 ? '#22c55e' : 'var(--muted)', marginTop: 4 }}>
              {formData.description.length}/100 characters
            </p>
          </label>
          <label>
            Price Range
            <input
              type="text"
              value={formData.priceRange}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, priceRange: val }));
              }}
              placeholder="e.g., ₹500-700"
            />
          </label>
          <label>
            Images (6-10 required) *
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <p style={{ color: 'var(--accent)', fontWeight: 500 }}>⏳ Uploading images...</p>}
            <div className="image-preview">
              {formData.pictures.map((url, idx) => (
                <div key={idx} className="preview-image">
                  <img src={url} alt={`Preview ${idx + 1}`} />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      pictures: prev.pictures.filter((_, i) => i !== idx)
                    }))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="help-text">{formData.pictures.length}/10 images</p>
          </label>
          <button type="submit" className="btn btn--primary" disabled={uploading}>
            Create Listing
          </button>
        </form>
      )}

      <div className="seller-listings">
        {activeTab === 'active' ? (
          items.length === 0 ? (
            <p>No active listings yet. Create your first listing!</p>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className="listing-card"
                onClick={() => setSelectedItem(item)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <div className="listing-images">
                  {item.pictures && item.pictures.length > 0 && item.pictures.slice(0, 3).map((url, idx) => (
                    <img key={idx} src={url} alt={`${item.title} ${idx + 1}`} />
                  ))}
                </div>
                <div className="listing-info">
                  <h3>{item.title}</h3>
                  <p>Status: {item.status}</p>
                  <p>Condition: {item.condition}</p>
                  {item.price_range && <p>Price: {item.price_range}</p>}
                  {item.expires_at && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      Expires: {new Date(item.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  className="btn btn--ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '0.85rem' }}
                >
                  Delete
                </button>
              </div>
            ))
          )
        ) : (
          pastItems.length === 0 ? (
            <p>No past listings.</p>
          ) : (
            pastItems.map((item) => {
              const isExpired = item.expires_at && new Date(item.expires_at) < new Date();
              const isDeleted = item.deleted_at !== null;
              
              return (
                <div 
                  key={item.id} 
                  className="listing-card"
                  onClick={() => setSelectedItem(item)}
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative',
                    opacity: 0.6,
                    filter: 'grayscale(0.3)'
                  }}
                >
                  <div className="listing-images">
                    {item.pictures && item.pictures.length > 0 && item.pictures.slice(0, 3).map((url, idx) => (
                      <img key={idx} src={url} alt={`${item.title} ${idx + 1}`} />
                    ))}
                  </div>
                  <div className="listing-info">
                    <h3>{item.title}</h3>
                    <p>Status: {isDeleted ? 'Deleted' : isExpired ? 'Expired' : item.status}</p>
                    <p>Condition: {item.condition}</p>
                    {item.price_range && <p>Price: {item.price_range}</p>}
                    {isExpired && item.expires_at && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Expired: {new Date(item.expires_at).toLocaleDateString()}
                      </p>
                    )}
                    {isDeleted && item.deleted_at && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Deleted: {new Date(item.deleted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    className="btn btn--primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRelist(item.id);
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 12px', fontSize: '0.85rem' }}
                  >
                    Relist
                  </button>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Detail View Modal */}
      {selectedItem && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
              onClick={() => setSelectedItem(null)}
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
              <strong>Status:</strong> {selectedItem.status}
            </div>
            
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
          </div>
        </div>
      )}
    </div>
  );
}

