import React, { useState, useRef } from "react";
import api from "../../api";
import toast from "react-hot-toast";

export default function SizeChartManager({ imageUrl, onSave }) {
  const [localUrl, setLocalUrl] = useState(imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    setLocalUrl(imageUrl || "");
  }, [imageUrl]);

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
        setLocalUrl(url);
        toast.success("Size chart uploaded");
        await onSave([url]);
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
    setLocalUrl(url);
    setUrlInput("");
    onSave([url]);
    toast.success("URL added");
  };

  const handleRemove = async () => {
    setLocalUrl("");
    try {
      await onSave([]);
      toast.success("Size chart removed");
    } catch {
      setLocalUrl(imageUrl || "");
    }
  };

  return (
    <div className="admin-products-list size-chart-admin">
      <h4>Size Chart Image</h4>
      <p className="hero-images-desc">
        Upload or add a URL for the size chart image shown on the Size Chart page. Stored in the hero-images bucket.
      </p>
      <div className="size-chart-panel">
        {localUrl ? (
          <div className="size-chart-preview-wrap">
            <img src={localUrl} alt="Size chart" className="size-chart-preview" />
            <button
              type="button"
              className="hero-image-delete"
              onClick={handleRemove}
              title="Remove size chart"
              aria-label="Remove size chart"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="size-chart-empty">No size chart image. Upload or add a URL below.</div>
        )}
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
      </div>
    </div>
  );
}
