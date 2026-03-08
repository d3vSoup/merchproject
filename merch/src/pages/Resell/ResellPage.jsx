// src/pages/Resell/ResellPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getUserIdByEmail, getUserByEmail } from "../../supabase/client";
import { SkeletonPage } from "../../components/Skeleton";
import ResellOnboarding from "./ResellOnboarding";
import ResellSeller from "./ResellSeller";
import ResellBuyer from "./ResellBuyer";

export default function ResellPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("buyer");
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  async function loadUserData() {
    if (!user?.email) return;
    setLoading(true);
    const userId = await getUserIdByEmail(user.email);
    if (!userId) {
      setLoading(false);
      return;
    }
    const data = await getUserByEmail(user.email);
    if (data) {
      setUserData(data);
      setNeedsOnboarding(!data.resell_unlocked);
    }
    setLoading(false);
  }

  function handleOnboardingComplete() {
    setNeedsOnboarding(false);
    loadUserData();
  }

  if (loading) {
    return <SkeletonPage type="grid" />;
  }

  if (!user) {
    return (
      <div className="resell-locked">
        <h2>Sign In Required</h2>
        <p>Please sign in to access the Revault platform.</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return <ResellOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="resell-page">
      <div className="resell-tabs">
        <button
          className={`resell-tab ${activeTab === "buyer" ? "is-active" : ""}`}
          onClick={() => setActiveTab("buyer")}
        >
          <span className="resell-tab__icon">🛍️</span>
          Browse
        </button>
        <button
          className={`resell-tab ${activeTab === "seller" ? "is-active" : ""}`}
          onClick={() => setActiveTab("seller")}
        >
          <span className="resell-tab__icon">📦</span>
          My Listings
        </button>
      </div>
      <div className="resell-content">
        {activeTab === "buyer" ? <ResellBuyer /> : <ResellSeller />}
      </div>
    </div>
  );
}
