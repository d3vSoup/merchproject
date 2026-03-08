// src/components/PageTransition.jsx — CSS-only page transition wrapper
import React from "react";

export default function PageTransition({ children }) {
  return (
    <div className="page-enter" style={{ width: "100%" }}>
      {children}
    </div>
  );
}
