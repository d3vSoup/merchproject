/* src/pages/Admin/AdminThemeControl.jsx */
import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import "./AdminThemeControl.css";

export default function AdminThemeControl() {
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: "#6366f1",
    fontFamily: "'Inter', sans-serif",
    announcement: "",
    showAnnouncement: false,
    gradientStyle: "classic",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchThemeSettings();
  }, []);

  async function fetchThemeSettings() {
    setLoading(true);
    try {
      const res = await api.get('/api/catalog/overrides', { params: { tabKey: 'system' } });
      const overrides = res.data?.overrides || [];
      const themeOverride = overrides.find(o => o.product_id === 'global_theme');
      
      if (themeOverride && themeOverride.description) {
        try {
          const parsed = JSON.parse(themeOverride.description);
          setThemeSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Failed to parse theme settings", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch theme settings", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post('/api/admin/items/catalog', {
        tabKey: 'system',
        productId: 'global_theme',
        name: 'Global Theme Settings',
        description: JSON.stringify(themeSettings),
        hidden: false
      });
      toast.success("Theme settings updated successfully!");
    } catch (err) {
      console.error("Failed to save theme settings", err);
      toast.error("Failed to save theme settings");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setThemeSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) return <div className="admin-page-loading">Loading configuration...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Theme Control</h1>
        <p>Customize the look and feel of the entire ALMA store frontend.</p>
      </div>

      <div className="admin-theme-grid">
        <div className="admin-theme-card">
          <h3>
            <span className="material-symbols-outlined">palette</span>
            Brand & Colors
          </h3>
          
          <div className="theme-form-group">
            <label>Primary Brand Color</label>
            <div className="theme-color-picker">
              <input 
                type="color" 
                name="primaryColor" 
                value={themeSettings.primaryColor} 
                onChange={handleChange} 
              />
              <input 
                type="text" 
                name="primaryColor" 
                value={themeSettings.primaryColor} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="theme-form-group">
            <label>Visual Style / Gradient</label>
            <select 
              className="theme-select" 
              name="gradientStyle" 
              value={themeSettings.gradientStyle} 
              onChange={handleChange}
            >
              <option value="classic">Classic Minimal</option>
              <option value="vibrant">Vibrant & Modern</option>
              <option value="glass">Glassmorphism</option>
              <option value="dark">Sleek Cyber</option>
            </select>
          </div>

          <div className="theme-preview-box">
            <div 
              className="theme-preview-sample" 
              style={{ background: themeSettings.primaryColor }}
            >
              Preview Button
            </div>
          </div>
        </div>

        <div className="admin-theme-card">
          <h3>
            <span className="material-symbols-outlined">font_download</span>
            Typography
          </h3>
          
          <div className="theme-form-group">
            <label>Heading Font (Global)</label>
            <select 
              className="theme-select" 
              name="fontFamily" 
              value={themeSettings.fontFamily} 
              onChange={handleChange}
            >
              <option value="'Inter', sans-serif">Inter (Default)</option>
              <option value="'Space Grotesk', sans-serif">Space Grotesk (Modern)</option>
              <option value="'Montserrat', sans-serif">Montserrat (Elegant)</option>
              <option value="'Outfit', sans-serif">Outfit (Rounder)</option>
              <option value="'Bebas Neue', sans-serif">Bebas Neue (Impactful)</option>
            </select>
          </div>

          <div className="theme-preview-box" style={{ fontFamily: themeSettings.fontFamily }}>
            <h4 style={{ margin: 0 }}>The quick brown fox jumps over the lazy dog.</h4>
            <p style={{ margin: '5px 0 0', opacity: 0.7 }}>Frontend Heading Preview</p>
          </div>
        </div>

        <div className="admin-theme-card">
          <h3>
            <span className="material-symbols-outlined">campaign</span>
            Announcement Bar
          </h3>
          
          <div className="theme-form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                name="showAnnouncement" 
                checked={themeSettings.showAnnouncement} 
                onChange={handleChange} 
              />
              Show Announcement Banner on Home
            </label>
          </div>

          <div className="theme-form-group">
            <label>Banner Text</label>
            <input 
              type="text" 
              className="theme-select" 
              name="announcement" 
              value={themeSettings.announcement} 
              onChange={handleChange} 
              placeholder="e.g. Free shipping on orders over ₹1000!"
            />
          </div>
        </div>
      </div>

      <div className="admin-theme-actions">
        <button className="admin-btn" onClick={fetchThemeSettings}>Discard Changes</button>
        <button 
          className="admin-btn admin-btn--primary" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? "Saving..." : "Apply Global Theme"}
        </button>
      </div>
    </div>
  );
}
