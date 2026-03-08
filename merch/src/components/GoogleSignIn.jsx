// merch/src/components/GoogleSignIn.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignIn({ onSuccess, onCancel }) {
  const { signinWithGoogle } = useAuth();
  const containerRef = useRef();
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const initializedRef = useRef(false);

  const resetGoogleState = () => {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.cancel();
      }
    } catch (e) {
      console.warn("Could not clear Google session:", e);
    }
  };

  const forceReinitialize = () => {
    setError(null);
    setSigningIn(false);
    resetGoogleState();
    initializedRef.current = false;
    setRetryKey(prev => prev + 1);
  };

  const renderButton = () => {
    if (!window.google?.accounts?.id || !containerRef.current) return;
    containerRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      width: 250,
    });
  };

  useEffect(() => {
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

      if (initializedRef.current) {
        renderButton();
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp) => {
          setError(null);
          setSigningIn(true);
          try {
            const user = await signinWithGoogle(resp.credential);
            setSigningIn(false);
            onSuccess?.(user);
          } catch (err) {
            setSigningIn(false);
            console.error("Google sign-in failed", err);
            let errorMsg = err?.response?.data?.message || err.message || "Sign-in failed";
            const isTimeout = errorMsg.includes("timeout") || err.code === "ECONNABORTED";
            if (isTimeout) {
              errorMsg = "Server is waking up. Please wait 30 seconds and try again.";
            }

            if (errorMsg.includes("origin_mismatch") || errorMsg.includes("OAuth 2.0 policy")) {
              setError("OAuth configuration error. Contact the admin.");
              return;
            }

            resetGoogleState();
            setError(errorMsg);
            initializedRef.current = false;

            setTimeout(() => {
              setRetryKey(prev => prev + 1);
            }, 100);
          }
        },
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      initializedRef.current = true;
      renderButton();
    }
  }, [signinWithGoogle, onSuccess, retryKey]);

  return (
    <div className="google-signin-wrapper">
      {signingIn && (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
          Signing in...
        </div>
      )}
      <div key={retryKey} ref={containerRef} style={{ opacity: signingIn ? 0.5 : 1, pointerEvents: signingIn ? 'none' : 'auto' }} />
      {error && (
        <div className="signin-error" style={{ marginTop: 10 }}>
          <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 8px' }}>{error}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn--primary btn--sm"
              onClick={forceReinitialize}
              style={{ fontSize: '0.8rem' }}
            >
              Try Different Account
            </button>
            {onCancel && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={onCancel}
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
