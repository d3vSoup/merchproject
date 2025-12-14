import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken } from "../api";

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
      const res = await api.get("/api/me");
      if (res?.data?.user) setUser(res.data.user);
    } catch (err) {
      // token invalid or expired: sign out locally
      console.warn("Failed to load /api/me", err?.response?.data || err.message || err);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // attempt to load user on mount if token present
    loadMe();
  }, [loadMe]);

  // Sign in using server-side Google exchange (optimized - don't wait for Supabase)
  async function signinWithGoogle(id_token) {
    try {
      const res = await api.post("/api/auth/google", { id_token }, { timeout: 5000 });
      const newToken = res.data.token;
      setToken(newToken);
    setUser(res.data.user);
      // Load Supabase user in background (non-blocking)
      if (res.data.user?.supabaseId) {
        // User already has supabaseId, we're good
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
