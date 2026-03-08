import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "merch-glass";

const GlassContext = createContext();

export function GlassProvider({ children }) {
  const [glass, setGlass] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (glass) {
      document.documentElement.classList.add("glass-mode");
    } else {
      document.documentElement.classList.remove("glass-mode");
    }
  }, [glass]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, glass ? "true" : "false");
  }, [glass]);

  const toggleGlass = () => setGlass((prev) => !prev);

  return (
    <GlassContext.Provider value={{ glass, toggleGlass }}>
      {children}
    </GlassContext.Provider>
  );
}

export const useGlass = () => useContext(GlassContext);
