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
  const [wakingUp, setWakingUp] = useState(false);
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
    setWakingUp(false);
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
    let wakeupTimer;
    
    const init = () => {
      if (!window.google?.accounts?.id) return;
      if (!CLIENT_ID) {
        console.error("VITE_GOOGLE_CLIENT_ID is not set.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp) => {
          setError(null);
          setSigningIn(true);
          setWakingUp(false);
          
          // Show wakeup message if server takes too long (cold start)
          wakeupTimer = setTimeout(() => {
            setWakingUp(true);
          }, 3500);

          try {
            const user = await signinWithGoogle(resp.credential);
            clearTimeout(wakeupTimer);
            setSigningIn(false);
            setWakingUp(false);
            onSuccess?.(user);
          } catch (err) {
            clearTimeout(wakeupTimer);
            setSigningIn(false);
            setWakingUp(false);
            console.error("Google sign-in failed", err);
            let errorMsg = err?.response?.data?.message || err.message || "Sign-in failed";
            
            if (errorMsg.toLowerCase().includes("timeout") || err.code === "ECONNABORTED") {
              errorMsg = "Server is waking up. Please wait and try again in a moment.";
            }

            resetGoogleState();
            setError(errorMsg);
            initializedRef.current = false;
            setTimeout(() => setRetryKey(prev => prev + 1), 100);
          }
        },
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      initializedRef.current = true;
      renderButton();
    };

    // Script is now preloaded in index.html, so we just wait for it to be ready
    if (window.google?.accounts?.id) {
      init();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          init();
        }
      }, 50);
      return () => {
        clearInterval(checkInterval);
        clearTimeout(wakeupTimer);
      };
    }

    return () => clearTimeout(wakeupTimer);
  }, [signinWithGoogle, onSuccess, retryKey]);

  return (
    <div className="google-signin-wrapper">
      {signingIn && (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8, textAlign: 'center' }}>
          {wakingUp ? "🚀 Server is waking up (Render cold start)..." : "Signing in..."}
        </div>
      )}
      <div 
        key={retryKey} 
        ref={containerRef} 
        style={{ 
          opacity: signingIn ? 0.5 : 1, 
          pointerEvents: signingIn ? 'none' : 'auto',
          display: 'flex',
          justifyContent: 'center'
        }} 
      />
      {error && (
        <div className="signin-error" style={{ marginTop: 10 }}>
          <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 8px', textAlign: 'center' }}>{error}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className="btn btn--primary btn--sm"
              onClick={forceReinitialize}
              style={{ fontSize: '0.8rem' }}
            >
              Try Again
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
