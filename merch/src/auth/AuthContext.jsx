import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken } from "../api";
import { withRetry } from "../utils/withRetry";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  // keep localStorage in sync
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    // apply token to axios / api helper
    if (typeof setAuthToken === "function") {
      setAuthToken(token);
    } else {
      if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      else delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load current user from backend if token exists
  const loadMe = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await withRetry(() => api.get("/api/me"), { maxRetries: 3, baseDelayMs: 2000 });
      if (res?.data?.user) setUser(res.data.user);
    } catch (err) {
      // Only sign out if server explicitly says 401 (token invalid/expired)
      // For network errors or 500s, keep the user signed in (fixes multi-device sign-in)
      const status = err?.response?.status;
      if (status === 401) {
        console.warn("Token invalid/expired, signing out");
        setUser(null);
        setToken(null);
      } else {
        console.warn("Failed to load /api/me (keeping session)", err?.response?.data || err.message || err);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // attempt to load user on mount if token present
    loadMe();
  }, [loadMe]);

  // Sign in using server-side Google exchange
  async function signinWithGoogle(id_token) {
    try {
      const res = await api.post("/api/auth/google", { id_token });
      const newToken = res.data.token;
      setToken(newToken);
      setUser(res.data.user);
      
      // Fetch full profile from Supabase to get saved data from other devices
      // This ensures name/usn/sem saved on device A appear on device B
      try {
        const meRes = await api.get("/api/me", {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        if (meRes?.data?.user) setUser(meRes.data.user);
      } catch (meErr) {
        console.warn('Could not fetch full profile after sign-in:', meErr.message);
      }
      
      return res.data.user;
    } catch (err) {
      console.error('Sign-in error:', err);
      throw err;
    }
  }

  async function updateProfile(patch) {
    const res = await api.post("/api/user/profile", patch);
    setUser(res.data.user);
    return res.data.user;
  }

  function signout() {
    setUser(null);
    setToken(null);
    if (typeof setAuthToken === "function") setAuthToken(null);
    else delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signinWithGoogle, updateProfile, signout, loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
