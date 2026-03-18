// src/pages/Resell/ResellSeller.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getUserIdByEmail, getUserResellItems, createResellItem, uploadResellImage } from "../../supabase/client";
import toast from "react-hot-toast";
import api from "../../api";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatCondition(c) {
  if (!c) return "";
  return c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, " ");
}

function SellerFeedbackItem({ fb, parentName, replyingTo, setReplyingTo, replyForm, setReplyForm, submitReply, submittingReply, user, depth = 0 }) {
  const isReply = !!fb.parent_id;
  const showReplyForm = replyingTo === fb.id;
  return (
    <div className="resell-feedback-item" style={{ padding: '10px 0 12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      {isReply && parentName && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '2px' }}>Replying to {parentName}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,102,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
          {getInitials(fb.buyer_name)}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fb.buyer_name}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {fb.buyer_usn}
          {fb.rating != null && <span style={{ color: '#f59e0b' }}> · ★ {fb.rating}</span>}
          {fb.created_at && <span> · {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        </span>
      </div>
      {fb.comments && <p style={{ margin: '0 0 6px', fontSize: '0.88rem', lineHeight: 1.5, paddingLeft: 36 }}>{fb.comments}</p>}
      {user && (
        <div style={{ paddingLeft: 36, marginTop: 4 }}>
          <button type="button" onClick={() => setReplyingTo(showReplyForm ? null : fb.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.78rem', padding: 0, fontWeight: 600 }}>
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        </div>
      )}
      {showReplyForm && user && (
        <form onSubmit={submitReply} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: 36 }}>
          <textarea value={replyForm.comments} onChange={(e) => setReplyForm({ comments: e.target.value })} placeholder="Write a reply..." rows={2} maxLength={500} required style={{ padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '0.88rem', fontFamily: 'inherit', background: '#fff' }} />
          <button type="submit" className="btn btn--primary btn--sm" disabled={submittingReply}>{submittingReply ? 'Posting...' : 'Post reply'}</button>
        </form>
      )}
      {fb.replies?.length > 0 && (
        <div className="resell-seller-feedback-replies" style={{ marginTop: '4px', marginLeft: '16px', paddingLeft: '14px', borderLeft: '2px solid rgba(0,0,0,0.06)' }}>
          {fb.replies.map((r) => (
            <SellerFeedbackItem key={r.id} fb={r} parentName={fb.buyer_name} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyForm={replyForm} setReplyForm={setReplyForm} submitReply={submitReply} submittingReply={submittingReply} user={user} depth={depth + 1} />
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
  const [activeTab, setActiveTab] = useState('active');
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
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFeedback, setItemFeedback] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ comments: '' });
  const [submittingReply, setSubmittingReply] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setLightboxImg(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function canEdit(item) {
    if (!item?.created_at || item.deleted_at) return false;
    const created = new Date(item.created_at);
    const hoursSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  }

  useEffect(() => {
    if (user?.email) loadItems();
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
      setSelectedImageIdx(0);
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
    if (resolved) setUserSupabaseId(resolved);
    return resolved;
  }

  async function loadItems() {
    if (!user?.email) return;
    try {
      const res = await api.get('/api/resell/items');
      setItems(res.data?.items || []);
      setPastItems(res.data?.pastItems || []);
    } catch (err) {
      console.error('Failed to load resell items:', err);
      toast.error('Failed to load your listings');
    }
  }

  async function handleDelete(itemId) {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/api/resell/items/${itemId}`);
      toast.success('Listing deleted successfully');
      loadItems();
    } catch (err) {
      console.error('Failed to delete listing:', err);
      toast.error(err.response?.data?.message || 'Failed to delete listing');
    }
  }

  async function handlePermanentDelete(itemId) {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/api/resell/items/${itemId}/permanent`);
      toast.success('Listing permanently deleted');
      loadItems();
    } catch (err) {
      console.error('Failed to permanently delete listing:', err);
      toast.error(err.response?.data?.message || 'Failed to permanently delete listing');
    }
  }

  async function handleRelist(itemId) {
    try {
      const res = await api.post(`/api/resell/items/${itemId}/relist`);
      if (res.data?.item) {
        toast.success('Item relisted successfully!');
        await loadItems();
        setActiveTab('active');
      } else {
        toast.error('Failed to relist item');
      }
    } catch (err) {
      console.error('Failed to relist item:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to relist item');
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files).slice(0, 10);
    if (files.length === 0) return;
    setUploading(true);
    toast.loading(`Uploading ${files.length} image(s)...`, { id: 'upload-progress' });
    const uploadPromises = files.map(async (file) => {
      try {
        const formDataObj = new FormData();
        formDataObj.append('image', file);
        const res = await api.post('/api/resell/upload-image', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data?.url || null;
      } catch (err) {
        console.error('Failed to upload image:', err);
        if ((err.response?.data?.message || err.message || '').includes('Bucket not found')) {
          toast.error('Storage bucket not found. Please create "resell-images" bucket in Supabase Dashboard → Storage.', { id: 'bucket-error' });
        }
        return null;
      }
    });
    const results = await Promise.all(uploadPromises);
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
    setFormData({ title: "", condition: "new", year: "", description: "", priceRange: "", pictures: [] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.email) { toast.error("Please sign in"); return; }
    if (!formData.title) { toast.error("Title is required"); return; }
    if (!formData.description || formData.description.trim().length < 100) {
      toast.error("Description must be at least 100 characters"); return;
    }
    if (formData.pictures.length < 6) { toast.error("Minimum 6 images required"); return; }

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
      toast.error(err.response?.data?.message || err.message || (editingItem ? 'Failed to update listing' : 'Failed to create listing'));
    }
  }

  const feedbackTree = buildFeedbackTree(itemFeedback);
  const modalImages = selectedItem?.pictures || [];
  const mainImage = modalImages[selectedImageIdx] || modalImages[0] || null;

  function getStatusBadge(item) {
    const isPending = (item.moderation_status || 'approved') === 'pending';
    const isExpired = item.expires_at && new Date(item.expires_at) < new Date();
    const isDeleted = item.deleted_at !== null;
    if (isDeleted) return { label: 'Deleted', cls: 'listing-status--deleted' };
    if (isPending) return { label: 'Pending Review', cls: 'listing-status--pending' };
    if (isExpired) return { label: 'Expired', cls: 'listing-status--expired' };
    return { label: 'Active', cls: 'listing-status--active' };
  }

  const displayItems = activeTab === 'active' ? items : pastItems;

  return (
    <div className="resell-seller">
      {/* Header */}
      <div className="seller-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 28, height: 1, background: 'var(--accent, #ec5b13)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--accent, #ec5b13)' }}>Your Marketplace</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, textTransform: 'uppercase' }}>
              My <span style={{ background: 'linear-gradient(to right, #1a1a1a, #6b7280)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Listings</span>
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
              {items.length} active · {pastItems.length} past
            </p>
          </div>
        <button
          className="btn btn--primary"
          onClick={() => showForm ? cancelForm() : (setEditingItem(null), setFormData({ title: "", condition: "new", year: "", description: "", priceRange: "", pictures: [] }), setShowForm(true))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {showForm ? "✕ Cancel" : "+ New Listing"}
        </button>
      </div>

      {/* Active / Past pills */}
      <div style={{ display: 'inline-flex', gap: 4, marginBottom: 24, background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 4 }}>
        <button
          className={`btn ${activeTab === 'active' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('active')}
          style={{ borderRadius: 10, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          Active ({items.length})
        </button>
        <button
          className={`btn ${activeTab === 'past' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('past')}
          style={{ borderRadius: 10, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          Past ({pastItems.length})
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="listing-form" style={{ background: '#fff', padding: 24, borderRadius: 16, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{editingItem ? "Edit Listing" : "Create New Listing"}</h3>
          {editingItem && (
            <p className="help-text" style={{ background: 'rgba(245,158,11,0.08)', padding: '12px 16px', borderRadius: '12px', marginBottom: 0, fontSize: '0.85rem', border: '1px solid rgba(245,158,11,0.15)' }}>
              {(editingItem.moderation_status || 'approved') === 'approved'
                ? '⚠️ Editing an approved listing will send it back for admin review.'
                : 'You can edit within 24 hours of listing.'}
            </p>
          )}
          <label style={{ fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
            Title <span style={{ color: '#dc2626', fontWeight: 400 }}>*</span>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required placeholder="e.g., Utsav Varsity Jacket" style={{ padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit' }} />
          </label>
          <label style={{ fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
            Condition <span style={{ color: '#dc2626', fontWeight: 400 }}>*</span>
            <select value={formData.condition} onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))} required style={{ padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit', background: '#fff' }}>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </label>
          <label style={{ fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
            Year of Purchase
            <input type="number" value={formData.year} onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))} placeholder="e.g., 2024" style={{ padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit' }} />
          </label>
          <label style={{ fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
            Description <span style={{ color: '#dc2626', fontWeight: 400 }}>*</span> (Min 100 chars)
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Describe the item in detail (minimum 100 characters)..." required minLength={100} style={{ padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }} />
            <p style={{ fontSize: '0.8rem', color: formData.description.length >= 100 ? '#22c55e' : 'var(--muted)', marginTop: 2, fontWeight: 600 }}>
              {formData.description.length}/100 characters
            </p>
          </label>
          <label style={{ fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
            Price Range
            <input type="text" value={formData.priceRange} onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))} placeholder="e.g., ₹500-700" style={{ padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit' }} />
          </label>
          <label style={{ fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
            Images (6-10 required) <span style={{ color: '#dc2626', fontWeight: 400 }}>*</span>
            <div style={{ border: '2px dashed rgba(0,0,0,0.08)', borderRadius: 14, padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.015)', cursor: 'pointer', position: 'relative' }}>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--muted)' }}>
                {uploading ? '⏳ Uploading...' : '📷 Click or drag images here'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>{formData.pictures.length}/10 images uploaded</p>
            </div>
            {formData.pictures.length > 0 && (
              <div className="image-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {formData.pictures.map((url, idx) => (
                  <div key={idx} className="preview-image" style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden' }}>
                    <img src={url} alt={`Preview ${idx + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pictures: prev.pictures.filter((_, i) => i !== idx) }))}
                      style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(220,38,38,0.9)', color: '#fff', border: 0, borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>
          <button type="submit" className="btn btn--primary" disabled={uploading} style={{ padding: '14px', fontSize: '1rem', borderRadius: 12 }}>
            {editingItem ? "Update Listing" : "Create Listing"}
          </button>
        </form>
      )}

      {/* Listings Grid */}
      <div className="seller-listings">
        {displayItems.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', background: 'rgba(0,0,0,0.015)', borderRadius: 20, border: '2px dashed rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, fontSize: '1rem' }}>
              {activeTab === 'active' ? 'No active listings yet. Create your first listing!' : 'No past listings.'}
            </p>
          </div>
        ) : (
          displayItems.map((item) => {
            const status = getStatusBadge(item);
            const isPast = activeTab === 'past';
            return (
              <div
                key={item.id}
                className={`listing-card ${status.cls === 'listing-status--pending' ? 'listing-card--pending' : ''}`}
                onClick={() => setSelectedItem(item)}
                style={{ cursor: 'pointer', position: 'relative', ...(isPast ? { opacity: 0.65, filter: 'grayscale(0.25)' } : {}) }}
              >
                {/* Status badge */}
                <div
                  className="listing-card__pending-badge"
                  style={{
                    background: status.cls === 'listing-status--active' ? 'rgba(34,197,94,0.9)' :
                      status.cls === 'listing-status--pending' ? 'rgba(245,158,11,0.95)' :
                      status.cls === 'listing-status--expired' ? 'rgba(245,158,11,0.8)' :
                      'rgba(220,38,38,0.85)',
                    position: 'absolute', top: 8, left: 8, zIndex: 2,
                    color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                    padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  {status.label}
                </div>

                {/* Images */}
                <div className="listing-images" style={{ height: 160 }}>
                  {item.pictures && item.pictures.length > 0 ? (
                    <img src={item.pictures[0]} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)', color: 'var(--muted)' }}>No image</div>
                  )}
                </div>

                {/* Info */}
                <div className="listing-info" style={{ padding: 16 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>{item.title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(0,0,0,0.04)', color: 'var(--text)' }}>
                      {formatCondition(item.condition)}
                    </span>
                    {item.year && (
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(0,0,0,0.04)', color: 'var(--muted)' }}>
                        {item.year}
                      </span>
                    )}
                  </div>
                  {item.price_range && (
                    <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>{item.price_range}</p>
                  )}
                  {item.expires_at && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '6px 0 0' }}>
                      {new Date(item.expires_at) < new Date() ? 'Expired' : 'Expires'}: {new Date(item.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                {activeTab === 'active' ? (
                  <div className="listing-card-actions" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 2 }}>
                    {canEdit(item) && (
                      <button
                        type="button"
                        className="listing-card-action listing-card-action--edit"
                        onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="listing-card-action listing-card-action--delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="listing-card-actions" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 2 }}>
                    <button
                      className="btn btn--primary"
                      onClick={(e) => { e.stopPropagation(); handleRelist(item.id); }}
                      style={{ padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8 }}
                    >
                      Relist
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePermanentDelete(item.id); }}
                      style={{ padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8, background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="resell-modal-overlay"
          onClick={() => setSelectedItem(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg, #fff)', borderRadius: 20, padding: 0, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 32px 64px rgba(0,0,0,0.2)', animation: 'revault-modal-enter 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            <button
              onClick={() => setSelectedItem(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', padding: 8, lineHeight: 1, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
              aria-label="Close"
            >
              ×
            </button>

            {/* Gallery */}
            <div>
              {mainImage ? (
                <>
                  <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '20px 20px 0 0', background: 'rgba(0,0,0,0.04)', cursor: 'zoom-in', position: 'relative' }}
                       onClick={() => setLightboxImg(mainImage)}>
                    <img src={mainImage} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {modalImages.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 24px', overflowX: 'auto' }}>
                      {modalImages.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedImageIdx(idx)}
                          style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: idx === selectedImageIdx ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <img src={url} alt={`${selectedItem.title} ${idx + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: '20px 20px 0 0', color: 'var(--muted)' }}>No images</div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, flex: 1, letterSpacing: '-0.02em' }}>{selectedItem.title}</h2>
                {canEdit(selectedItem) && (
                  <button className="btn btn--primary" onClick={() => startEdit(selectedItem)} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    Edit
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {(() => {
                  const s = getStatusBadge(selectedItem);
                  return (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '6px 14px',
                      borderRadius: 999, fontSize: '0.8rem', fontWeight: 700,
                      background: s.cls === 'listing-status--active' ? 'rgba(34,197,94,0.1)' :
                        s.cls === 'listing-status--pending' ? 'rgba(245,158,11,0.1)' :
                        s.cls === 'listing-status--expired' ? 'rgba(245,158,11,0.1)' :
                        'rgba(220,38,38,0.1)',
                      color: s.cls === 'listing-status--active' ? '#16a34a' :
                        s.cls === 'listing-status--pending' ? '#d97706' :
                        s.cls === 'listing-status--expired' ? '#d97706' :
                        '#dc2626'
                    }}>
                      {s.label}
                    </span>
                  );
                })()}
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600 }}>
                  {formatCondition(selectedItem.condition)}
                </span>
                {selectedItem.year && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600 }}>
                    📅 {selectedItem.year}
                  </span>
                )}
                {selectedItem.price_range && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: 'rgba(255,102,0,0.1)', borderRadius: 999, fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {selectedItem.price_range}
                  </span>
                )}
              </div>

              {selectedItem.description && (
                <div style={{ marginBottom: 20 }}>
                  <strong style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Description</strong>
                  <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.95rem' }}>{selectedItem.description}</p>
                </div>
              )}

              {/* Reviews */}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800 }}>Reviews</h4>
                {feedbackTree.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 320, overflowY: 'auto' }}>
                    {feedbackTree.map((fb) => (
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
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>No reviews yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}
        >
          <button
            onClick={() => setLightboxImg(null)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >×</button>
          <img
            src={lightboxImg}
            alt="Full preview"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
          />
        </div>
      )}
    </div>
  );
}
