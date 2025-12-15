// merch/src/components/ProfileModal.jsx
import React, { useEffect, useState } from "react";
import api from "../api";              // axios instance (src/api.js)
import { useAuth } from "../auth/AuthContext";
import toast from "react-hot-toast";

export default function ProfileModal({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  const [usn, setUsn] = useState(user?.usn || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [name, setName] = useState(user?.name || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [sem, setSem] = useState(user?.sem || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUsn(user?.usn || "");
      setPhone(user?.phone || "");
      setName(user?.name || "");
      setBranch(user?.branch || "");
      setSem(user?.sem || "");
    }
  }, [open, user]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();

    // validation - USN, name, and semester are required for 100%
    if (!usn || !usn.trim()) {
      return alert("USN is required. Please enter your USN.");
    }
    if (!/^[A-Za-z0-9]+$/.test(usn.trim())) {
      return alert("Enter a valid USN (alphanumeric, no spaces).");
    }
    if (!name || !name.trim()) {
      return alert("Name is required. Please enter your name.");
    }
    if (!sem || !sem.trim()) {
      return alert("Semester/Year of Passing is required.");
    }

    setLoading(true);
    try {
      const updated = await updateProfile({ usn, phone, name, branch, sem, pfpUrl: null });
      setLoading(false);
      onClose?.(updated);
      toast.success("Profile updated successfully!");
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert(err?.response?.data?.message || "Profile update failed");
    }
  }

  return (
    <div 
      className="modal-backdrop" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal" 
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Edit Profile</h3>
          <button
            onClick={() => onClose()}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: 0, width: 30, height: 30 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6 }}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>USN</label>
            <input
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6 }}
              placeholder="e.g., 1BM20CS123"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>Branch</label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6 }}
              placeholder="e.g., CSE, ECE"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>Semester / Year of Passing</label>
            <input
              value={sem}
              onChange={(e) => setSem(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6 }}
              placeholder="e.g., 6, 7, 8 or 2025"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>Mobile Number (Optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6 }}
              placeholder="10-digit mobile number"
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn" type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => onClose()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// inline styles so the modal looks good without extra CSS (you can remove if you prefer)
const backdropStyle = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.25)",
  zIndex: 120,
};

const modalStyle = {
  width: 420,
  maxWidth: "92%",
  background: "#fff",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
};
