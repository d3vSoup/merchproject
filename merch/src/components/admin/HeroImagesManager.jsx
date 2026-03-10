import React, { useState, useRef } from "react";
import api from "../../api";
import toast from "react-hot-toast";

export default function HeroImagesManager({ images = [], onSave }) {
  const [localImages, setLocalImages] = useState([...images]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  // Sync with prop when it changes (e.g. after fetchOverrides)
  React.useEffect(() => {
    setLocalImages([...images]);
  }, [images]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, WebP, etc.)");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/admin/hero/upload", formData);
      const url = res.data?.url;
      if (url) {
        const next = [...localImages, url];
        setLocalImages(next);
        toast.success("Image uploaded");
        await persistToDb(next);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL");
      return;
    }
    const next = [...localImages, url];
    setLocalImages(next);
    setUrlInput("");
    persistToDb(next);
    toast.success("URL added");
  };

  const handleDelete = async (index) => {
    const next = localImages.filter((_, i) => i !== index);
    setLocalImages(next);
    try {
      await persistToDb(next);
      toast.success("Image removed");
    } catch {
      setLocalImages([...images]);
    }
  };

  const persistToDb = async (urls) => {
    setSaving(true);
    try {
      await onSave(urls);
    } catch (err) {
      toast.error("Failed to save");
      setLocalImages([...images]); // revert
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrder = async () => {
    await persistToDb(localImages);
    toast.success("Hero images saved");
  };

  return (
    <div className="admin-products-list">
      <h4>Manage Hero Images</h4>
      <div className="hero-images-panel">
        <p className="hero-images-desc">
          These images appear on the main landing page hero carousel. Use high-quality, vertically oriented images for best results.
        </p>

        {/* Image preview grid */}
        <div className="hero-images-grid">
          {localImages.map((url, index) => (
            <div key={`${url}-${index}`} className="hero-image-card">
              <img src={url} alt={`Hero ${index + 1}`} className="hero-image-preview" />
              <button
                type="button"
                className="hero-image-delete"
                onClick={() => handleDelete(index)}
                title="Remove image"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Upload + Add URL */}
        <div className="hero-images-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload from desktop"}
          </button>
          <div className="hero-images-url-row">
            <input
              type="url"
              className="hero-images-url-input"
              placeholder="Or paste image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
            >
              Add URL
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--primary hero-images-save"
          onClick={handleSaveOrder}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save hero images"}
        </button>
      </div>
    </div>
  );
}
