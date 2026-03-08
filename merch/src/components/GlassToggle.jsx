import React from "react";
import { useGlass } from "../context/GlassContext";

export default function GlassToggle() {
  const { glass, toggleGlass } = useGlass();

  return (
    <button
      type="button"
      className="glass-toggle"
      onClick={toggleGlass}
      aria-label={glass ? "Disable glass effect" : "Enable glass effect"}
      aria-pressed={glass}
      title={glass ? "Glass effect on" : "Glass effect off"}
    >
      <span aria-hidden="true">{glass ? "◇" : "◯"}</span>
    </button>
  );
}
