import React, { useState, useRef } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { EVENT_CARDS } from "../../data/eventCards";

export default function EventImagesManager({ eventImages = {}, eventCardLabels = {}, onSave, onSaveLabel }) {
  const [localImages, setLocalImages] = useState(() => {
    const map = {};
    EVENT_CARDS.forEach((ev) => {
      const productId = `event_images_${ev.key}`;
      map[ev.key] = eventImages[productId]?.images || [];
    });
    return map;
  });
  const [uploading, setUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [urlInputs, setUrlInputs] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});
  const fileInputRefs = useRef({});
  const [labelInputs, setLabelInputs] = useState(() => {
    const map = {};
    EVENT_CARDS.forEach((ev) => {
      map[ev.key] = eventCardLabels[ev.key] || ev.status;
    });
    return map;
  });

  React.useEffect(() => {
    const map = {};
    EVENT_CARDS.forEach((ev) => {
      map[ev.key] = eventCardLabels[ev.key] || ev.status;
    });
    setLabelInputs(map);
  }, [eventCardLabels]);

  React.useEffect(() => {
    const map = {};
    EVENT_CARDS.forEach((ev) => {
      const productId = `event_images_${ev.key}`;
      map[ev.key] = eventImages[productId]?.images || [];
    });
    setLocalImages(map);
  }, [eventImages]);

  const getCurrentUrl = (key) => {
    const arr = localImages[key] || [];
    return arr[0] || EVENT_CARDS.find((e) => e.key === key)?.fallbackUrl || "";
  };

  const getHistory = (key) => {
    const arr = localImages[key] || [];
    return arr.slice(1);
  };

  const handleUpload = async (eventKey, e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, WebP, etc.)");
      return;
    }
    setUploading((prev) => ({ ...prev, [eventKey]: true }));
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/admin/hero/upload", formData);
      const url = res.data?.url;
      if (url) {
        const current = localImages[eventKey] || [];
        const next = [url, ...current];
        setLocalImages((prev) => ({ ...prev, [eventKey]: next }));
        toast.success(`${EVENT_CARDS.find((e) => e.key === eventKey)?.label} image uploaded`);
        await persistEvent(eventKey, next);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [eventKey]: false }));
      if (fileInputRefs.current[eventKey]) fileInputRefs.current[eventKey].value = "";
    }
  };

  const handleAddUrl = (eventKey) => {
    const url = (urlInputs[eventKey] || "").trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL");
      return;
    }
    const current = localImages[eventKey] || [];
    const next = [url, ...current];
    setLocalImages((prev) => ({ ...prev, [eventKey]: next }));
    setUrlInputs((prev) => ({ ...prev, [eventKey]: "" }));
    persistEvent(eventKey, next);
    toast.success("URL added");
  };

  const handleDeleteCurrent = async (eventKey) => {
    const current = localImages[eventKey] || [];
    const next = current.slice(1);
    setLocalImages((prev) => ({ ...prev, [eventKey]: next }));
    try {
      await persistEvent(eventKey, next);
      toast.success("Current image removed");
    } catch {
      setLocalImages((prev) => ({ ...prev, [eventKey]: current }));
    }
  };

  const handleRestoreFromHistory = async (eventKey, url) => {
    const current = localImages[eventKey] || [];
    const filtered = current.filter((u) => u !== url);
    const next = [url, ...filtered];
    setLocalImages((prev) => ({ ...prev, [eventKey]: next }));
    try {
      await persistEvent(eventKey, next);
      toast.success("Image restored");
    } catch {
      setLocalImages((prev) => ({ ...prev, [eventKey]: current }));
    }
  };

  const persistEvent = async (eventKey, images) => {
    setSaving(true);
    try {
      await onSave(eventKey, images);
    } catch (err) {
      toast.error("Failed to save");
      setLocalImages((prev) => ({ ...prev, [eventKey]: eventImages[`event_images_${eventKey}`]?.images || [] }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-products-list event-images-admin">
      <h4>Event Images</h4>
      <p className="hero-images-desc">
        Images for the Event Exclusives cards on the homepage. Stored in the hero-images bucket. Upload, change, view history, or remove.
      </p>
      <div className="event-images-grid">
        {EVENT_CARDS.map((ev) => {
          const currentUrl = getCurrentUrl(ev.key);
          const history = getHistory(ev.key);
          const isUploading = uploading[ev.key];
          const urlInput = urlInputs[ev.key] || "";
          const showHistory = expandedHistory[ev.key];
          return (
            <div key={ev.key} className="event-image-card">
              <div className="event-image-header">
                <h5>{ev.label}</h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={labelInputs[ev.key] || ''}
                    onChange={(e) => setLabelInputs(prev => ({ ...prev, [ev.key]: e.target.value }))}
                    onBlur={() => {
                      const val = (labelInputs[ev.key] || '').trim();
                      if (val && val !== (eventCardLabels[ev.key] || ev.status) && onSaveLabel) {
                        onSaveLabel(ev.key, val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    className="event-label-input"
                    style={{ width: '120px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}
                  />
                </div>
              </div>
              <div className="event-image-preview-wrap">
                <img src={currentUrl} alt={ev.label} className="event-image-preview" />
                <button
                  type="button"
                  className="hero-image-delete"
                  onClick={() => handleDeleteCurrent(ev.key)}
                  title="Remove current image"
                  aria-label="Remove current image"
                  disabled={!localImages[ev.key]?.length}
                >
                  ×
                </button>
              </div>
              <div className="event-image-actions">
                <input
                  ref={(el) => (fileInputRefs.current[ev.key] = el)}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(ev.key, e)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => fileInputRefs.current[ev.key]?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
                <div className="hero-images-url-row">
                  <input
                    type="url"
                    className="hero-images-url-input"
                    placeholder="Or paste image URL"
                    value={urlInput}
                    onChange={(e) => setUrlInputs((prev) => ({ ...prev, [ev.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl(ev.key)}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleAddUrl(ev.key)}
                    disabled={!urlInput.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
              {history.length > 0 && (
                <div className="event-image-history">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setExpandedHistory((prev) => ({ ...prev, [ev.key]: !showHistory }))}
                  >
                    {showHistory ? "Hide" : "Show"} history ({history.length})
                  </button>
                  {showHistory && (
                    <div className="event-image-history-list">
                      {history.map((url, i) => (
                        <div key={`${url}-${i}`} className="event-image-history-item">
                          <img src={url} alt={`Past ${i + 1}`} />
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleRestoreFromHistory(ev.key, url)}
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
