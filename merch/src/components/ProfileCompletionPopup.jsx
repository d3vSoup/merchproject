// merch/src/components/ProfileCompletionPopup.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export default function ProfileCompletionPopup({ onOpenProfile }) {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) {
      setShow(false);
      return;
    }

    // Check if user has already dismissed this popup
    const dismissedKey = `profile_popup_dismissed_${user.email}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === "true";
    
    // Use server-provided profilePercent (authoritative, works across devices)
    const profilePercent = user.profilePercent || 50;
    
    // Only show for users with incomplete profiles who haven't dismissed it
    if (profilePercent < 100 && !wasDismissed) {
      // Small delay to make it feel natural
      const timer = setTimeout(() => {
        setShow(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      // If profile is 100%, clear dismissal so popup can show again if profile is reverted
      if (profilePercent === 100) {
        localStorage.removeItem(dismissedKey);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    if (user?.email) {
      const dismissedKey = `profile_popup_dismissed_${user.email}`;
      localStorage.setItem(dismissedKey, "true");
    }
    setShow(false);
  };

  if (!show || !user) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        maxWidth: "380px",
        background: "linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 8px 32px rgba(255, 107, 53, 0.3)",
        zIndex: 10000,
        animation: "slideInRight 0.3s ease-out",
        border: "2px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: "18px", 
            fontWeight: 700, 
            color: "#fff",
            marginBottom: "8px"
          }}>
            Complete Your Profile
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: "14px", 
            color: "rgba(255, 255, 255, 0.95)",
            lineHeight: "1.5",
            marginBottom: "12px"
          }}>
            Your profile is <strong style={{ color: "#fff" }}>50% complete</strong>. Head over to <strong style={{ color: "#fff" }}>Edit Profile</strong> and save your changes to be able to order.
          </p>
          <button
            onClick={() => {
              if (onOpenProfile) {
                onOpenProfile();
                handleDismiss(); // Dismiss popup when opening profile
              }
            }}
            style={{
              background: "#fff",
              color: "#ff6b35",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              marginTop: "8px"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Edit Profile →
          </button>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            color: "#fff",
            fontSize: "20px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "12px",
            transition: "background 0.2s",
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      
      <div style={{ 
        marginTop: "12px", 
        paddingTop: "12px", 
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        display: "flex",
        gap: "8px"
      }}>
        <div style={{
          flex: 1,
          height: "6px",
          background: "rgba(255, 255, 255, 0.3)",
          borderRadius: "3px",
          overflow: "hidden"
        }}>
          <div style={{
            width: "50%",
            height: "100%",
            background: "#fff",
            borderRadius: "3px",
            transition: "width 0.3s ease"
          }} />
        </div>
        <span style={{ 
          fontSize: "12px", 
          color: "rgba(255, 255, 255, 0.9)",
          fontWeight: 600,
          marginLeft: "8px"
        }}>
          50%
        </span>
      </div>
    </div>
  );
}

