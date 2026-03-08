// src/pages/Resell/ResellOnboarding.jsx
import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getUserIdByEmail, getResellProfile, createResellProfile } from "../../supabase/client";
import toast from "react-hot-toast";

export default function ResellOnboarding({ onComplete }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    sem: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.email) {
      toast.error("Please sign in");
      return;
    }

    if (!formData.name || !formData.branch || !formData.sem) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    const userId = await getUserIdByEmail(user.email);
    if (!userId) {
      toast.error("User not found");
      setLoading(false);
      return;
    }

    const profile = await createResellProfile(userId, formData);
    if (profile) {
      toast.success("Revault unlocked!");
      onComplete();
    } else {
      toast.error("Failed to create profile");
    }
    setLoading(false);
  }

  return (
    <div className="resell-onboarding">
      <div className="onboarding-content">
        <h2>Unlock Revault</h2>
        <p>Complete your profile to start buying and selling merchandise on Revault.</p>
        <form onSubmit={handleSubmit} className="onboarding-form">
          <label>
            Full Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </label>
          <label>
            Branch
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              required
              placeholder="e.g., CSE, ECE, ME"
            />
          </label>
          <label>
            Semester
            <input
              type="text"
              value={formData.sem}
              onChange={(e) => setFormData({ ...formData, sem: e.target.value })}
              required
              placeholder="e.g., 3, 5, 7"
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Processing..." : "Unlock Revault"}
          </button>
        </form>
      </div>
    </div>
  );
}

