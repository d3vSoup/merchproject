// src/pages/Resell/ResellSeller.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getUserIdByEmail, getUserResellItems, createResellItem, uploadResellImage } from "../../supabase/client";
import toast from "react-hot-toast";
import api from "../../api";

function SellerFeedbackItem({ fb, replyingTo, setReplyingTo, replyForm, setReplyForm, submitReply, submittingReply, user, depth = 0 }) {
  const isReply = !!fb.parent_id;
  const showReplyForm = replyingTo === fb.id;
  return (
    <div style={{
      padding: '12px',
      background: isReply ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.03)',
      borderRadius: '8px',
      borderLeft: isReply ? '3px solid rgba(255,102,0,0.45)' : 'none',
      paddingLeft: isReply ? '16px' : '12px',
    }}>
      {isReply && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '4px' }}>↳ Reply</span>}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
        <span style={{ fontWeight: 600 }}>{fb.buyer_name}</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{fb.buyer_usn}</span>
        {fb.rating != null && <span style={{ color: 'var(--accent)' }}>★ {fb.rating}</span>}
      </div>
      {fb.comments && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', lineHeight: 1.5 }}>{fb.comments}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
        {fb.created_at && (
          <time style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
        )}
        {user && (
          <button type="button" onClick={() => setReplyingTo(showReplyForm ? null : fb.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}>
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>
      {showReplyForm && user && (
        <form onSubmit={submitReply} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea value={replyForm.comments} onChange={(e) => setReplyForm({ comments: e.target.value })} placeholder="Write a reply..." rows={2} maxLength={500} required style={{ padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.9rem' }} />
          <button type="submit" className="btn btn--primary btn--sm" disabled={submittingReply}>{submittingReply ? 'Posting...' : 'Post reply'}</button>
        </form>
      )}
      {fb.replies?.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid rgba(0,0,0,0.1)', paddingLeft: '12px', marginLeft: '12px' }}>
          {fb.replies.map((r) => (
            <SellerFeedbackItem key={r.id} fb={r} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyForm={replyForm} setReplyForm={setReplyForm} submitReply={submitReply} submittingReply={submittingReply} user={user} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [editingItem, setEditingItem] = useState(null);
  const [itemFeedback, setItemFeedback] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ comments: '' });
  const [submittingReply, setSubmittingReply] = useState(false);

  function canEdit(item) {
    if (!item?.created_at || item.deleted_at) return false;
    const created = new Date(item.created_at);
    const hoursSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  }

  useEffect(() => {
    if (user?.email) {
      loadItems();
    }
  }, [user?.email]);

  async function loadFeedback(itemId) {
    if (!itemId) return;
    try {
      const res = await api.get(`/api/resell/items/${itemId}/feedback`);
      setItemFeedback(res.data?.feedback || []);
    } catch {
      setItemFeedback([]);
    }
  }

  useEffect(() => {
    if (selectedItem) {
      loadFeedback(selectedItem.id);
      setReplyingTo(null);
    } else {
      setItemFeedback([]);
      setReplyingTo(null);
    }
  }, [selectedItem?.id]);

  function buildFeedbackTree(list) {
    const byId = {};
    const roots = [];
    (list || []).forEach((f) => { byId[f.id] = { ...f, replies: [] }; });
    (list || []).forEach((f) => {
      const node = byId[f.id];
      if (f.parent_id && byId[f.parent_id]) byId[f.parent_id].replies.push(node);
      else roots.push(node);
    });
    roots.forEach((r) => r.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    return roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!selectedItem || !replyingTo || !replyForm.comments?.trim()) return;
    const name = (user?.name || user?.email?.split('@')[0] || 'Seller').trim();
    const usn = (user?.usn || 'seller').replace(/[^A-Za-z0-9]/g, '') || 'seller';
    if (!name) {
      toast.error('Please add your name in profile to reply');
      return;
    }
    setSubmittingReply(true);
    try {
      await api.post(`/api/resell/items/${selectedItem.id}/feedback`, {
        buyerName: name,
        buyerUsn: usn,
        comments: replyForm.comments.trim(),
        parentId: replyingTo,
      });
      toast.success('Reply posted!');
      setReplyingTo(null);
      setReplyForm({ comments: '' });
      loadFeedback(selectedItem.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  }

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

  function startEdit(item) {
    setEditingItem(item);
    setFormData({
      title: item.title || "",
      condition: item.condition || "new",
      year: item.year || "",
      description: item.description || "",
      priceRange: item.price_range || "",
      pictures: Array.isArray(item.pictures) ? [...item.pictures] : [],
    });
    setShowForm(true);
    setSelectedItem(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      title: "",
      condition: "new",
      year: "",
      description: "",
      priceRange: "",
      pictures: [],
    });
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

    const payload = {
      title: formData.title,
      condition: formData.condition,
      year: formData.year,
      description: formData.description,
      priceRange: formData.priceRange,
      pictures: formData.pictures,
    };

    try {
      if (editingItem) {
        const res = await api.patch(`/api/resell/items/${editingItem.id}`, payload);
        if (res.data?.item) {
          const wasApproved = (editingItem.moderation_status || 'approved') === 'approved';
          toast.success(wasApproved
            ? "Listing updated! It will go back to pending approval."
            : "Listing updated successfully.");
          cancelForm();
          await loadItems();
        } else {
          toast.error("Failed to update listing");
        }
      } else {
        const res = await api.post('/api/resell/create-item', payload);
        if (res.data?.item) {
          toast.success("Listing created! It will appear after admin approval.");
          cancelForm();
          await loadItems();
        } else {
          toast.error("Failed to create listing");
        }
      }
    } catch (err) {
      console.error(editingItem ? 'Failed to update resell item' : 'Failed to create resell item', err);
      const errorMsg = err.response?.data?.message || err.message || (editingItem ? 'Failed to update listing' : 'Failed to create listing');
      toast.error(errorMsg);
    }
  }

  return (
    <div className="resell-seller">
      <div className="seller-header">
        <h2>My Listings</h2>
        <button className="btn btn--primary" onClick={() => showForm ? cancelForm() : (setEditingItem(null), setFormData({ title: "", condition: "new", year: "", description: "", priceRange: "", pictures: [] }), setShowForm(true))}>
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
          {editingItem && (
            <p className="help-text" style={{ background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {(editingItem.moderation_status || 'approved') === 'approved'
                ? 'Editing an approved listing will send it back for admin review.'
                : 'You can edit within 24 hours of listing.'}
            </p>
          )}
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
                  <img src={url} alt={`Preview ${idx + 1}`} loading="lazy" />
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
            {editingItem ? "Update Listing" : "Create Listing"}
          </button>
        </form>
      )}

      <div className="seller-listings">
        {activeTab === 'active' ? (
          items.length === 0 ? (
            <p>No active listings yet. Create your first listing!</p>
          ) : (
            items.map((item) => {
              const isPending = (item.moderation_status || 'approved') === 'pending';
              return (
              <div 
                key={item.id} 
                className={`listing-card ${isPending ? 'listing-card--pending' : ''}`}
                onClick={() => setSelectedItem(item)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {isPending && (
                  <div className="listing-card__pending-badge">Pending review</div>
                )}
                <div className="listing-images">
                  {item.pictures && item.pictures.length > 0 && item.pictures.slice(0, 3).map((url, idx) => (
                    <img key={idx} src={url} alt={`${item.title} ${idx + 1}`} loading="lazy" />
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
                <div className="listing-card-actions">
                  {canEdit(item) && (
                    <button
                      type="button"
                      className="listing-card-action listing-card-action--edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(item);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="listing-card-action listing-card-action--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
            })
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
                      <img key={idx} src={url} alt={`${item.title} ${idx + 1}`} loading="lazy" />
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
              aria-label="Close"
            >
              ×
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingRight: '36px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{selectedItem.title}</h2>
              {canEdit(selectedItem) && (
                <button
                  className="btn btn--primary"
                  onClick={() => startEdit(selectedItem)}
                  style={{ flexShrink: 0 }}
                >
                  Edit
                </button>
              )}
            </div>
            
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

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <strong>Reviews</strong>
              {buildFeedbackTree(itemFeedback).length > 0 ? (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {buildFeedbackTree(itemFeedback).map((fb) => (
                    <SellerFeedbackItem
                      key={fb.id}
                      fb={fb}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyForm={replyForm}
                      setReplyForm={setReplyForm}
                      submitReply={submitReply}
                      submittingReply={submittingReply}
                      user={user}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

