// merch/src/components/GoogleSignIn.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignIn({ onSuccess }) {
  const { signinWithGoogle } = useAuth();
  const containerRef = useRef();
  const [retryKey, setRetryKey] = useState(0); // Force re-render on retry
  const initializedRef = useRef(false);

  const renderButton = () => {
    if (!window.google?.accounts?.id || !containerRef.current) return;
    
    // Clear container first
    containerRef.current.innerHTML = '';
    
    // Render fresh button
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      width: 250,
    });
  };

  useEffect(() => {
    // load Google Identity Services script (only once)
    const existing = document.getElementById("google-identity");
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.id = "google-identity";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
      s.onload = init;
    } else if (window.google?.accounts?.id) {
      init();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
      init();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    function init() {
      if (!window.google?.accounts?.id) return;
      if (!CLIENT_ID) {
        console.error("VITE_GOOGLE_CLIENT_ID is not set.");
        return;
      }

      // Only initialize once
      if (initializedRef.current) {
        renderButton();
        return;
      }

      // initialize
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp) => {
          // resp.credential is the id_token
          try {
            const user = await signinWithGoogle(resp.credential);
            onSuccess?.(user);
          } catch (err) {
            console.error("Google sign-in failed", err);
            let errorMsg = err?.response?.data?.message || err.message || "Sign-in failed";
            const isTimeout = errorMsg.includes("timeout") || err.code === "ECONNABORTED";
            if (isTimeout) {
              errorMsg = "The server is waking up (can take up to a minute). Please wait 30 seconds and try again.";
            }
            
            // Check for origin_mismatch error (OAuth configuration issue)
            if (errorMsg.includes("origin_mismatch") || errorMsg.includes("OAuth 2.0 policy")) {
              alert(
                "OAuth Configuration Error:\n\n" +
                "The app needs to be configured in Google Cloud Console.\n\n" +
                "Please add these authorized JavaScript origins:\n" +
                "- https://bmscemerch.vercel.app\n" +
                "- https://merchproject.vercel.app\n" +
                "- http://localhost:5173\n\n" +
                "And authorized redirect URIs:\n" +
                "- https://bmscemerch.vercel.app\n" +
                "- http://localhost:5173"
              );
              return;
            }
            
            // Clear any cached credentials to allow account reselection
            try {
              window.google.accounts.id.disableAutoSelect();
              window.google.accounts.id.cancel();
            } catch (e) {
              console.warn("Could not clear Google session:", e);
            }
            
            // Show error and allow retry
            const retryPrompt = isTimeout ? "Would you like to try again?" : "Would you like to try signing in with a different account?";
            const shouldRetry = confirm(`${errorMsg}\n\n${retryPrompt}`);
            
            if (shouldRetry) {
              // Force button re-render by updating key
              setRetryKey(prev => prev + 1);
              // Re-render button after a short delay
              setTimeout(() => {
                renderButton();
              }, 200);
            }
          }
        },
        ux_mode: "popup",
        auto_select: false, // Always allow account selection
        cancel_on_tap_outside: true, // Allow canceling
        itp_support: true, // Intelligent Tracking Prevention support
      });

      initializedRef.current = true;
      renderButton();
    }
  }, [signinWithGoogle, onSuccess, retryKey]);

  return <div key={retryKey} ref={containerRef} />;
}
