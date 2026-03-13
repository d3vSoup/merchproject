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
          <span className="resell-tab__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </span>
          Browse
        </button>
        <button
          className={`resell-tab ${activeTab === "seller" ? "is-active" : ""}`}
          onClick={() => setActiveTab("seller")}
        >
          <span className="resell-tab__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </span>
          My Listings
        </button>
      </div>
      <div className="resell-content">
        {activeTab === "buyer" ? <ResellBuyer /> : <ResellSeller />}
      </div>
    </div>
  );
}
