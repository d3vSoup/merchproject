// merch/src/components/GoogleSignIn.jsx
import React, { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignIn({ onSuccess }) {
  const { signinWithGoogle } = useAuth();
  const containerRef = useRef();

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
    } else {
      init();
    }

    function init() {
      if (!window.google?.accounts?.id) return;
      if (!CLIENT_ID) {
        console.error("VITE_GOOGLE_CLIENT_ID is not set.");
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
            const errorMsg = err?.response?.data?.message || "Sign-in failed";
            if (errorMsg.includes("Use a BMSCE Google account")) {
              if (confirm(`${errorMsg}\n\nWould you like to sign in with a different account?`)) {
                // Prompt to select account again
                window.google.accounts.id.prompt();
              }
            } else {
              alert(errorMsg);
            }
          }
        },
        ux_mode: "popup",
        auto_select: false, // Allow account selection
      });

      // render the button
      if (containerRef.current) {
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
        });
      }
    }
  }, [signinWithGoogle, onSuccess]);

  return <div ref={containerRef} />;
}
