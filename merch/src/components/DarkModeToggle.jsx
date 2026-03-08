import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function DarkModeToggle() {
  const { theme, cycleTheme, resolvedDark } = useTheme();

  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      type="button"
      className="dark-mode-toggle"
      onClick={cycleTheme}
      aria-label={`Theme: ${label}. Click to cycle.`}
      title={`Theme: ${label}`}
    >
      {resolvedDark ? (
        <span aria-hidden="true">🌙</span>
      ) : (
        <span aria-hidden="true">☀️</span>
      )}
    </button>
  );
}
