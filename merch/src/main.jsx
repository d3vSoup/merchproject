import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { GlassProvider } from "./context/GlassContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/design-tokens.css";
import "./index.css";
import "./App.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <GlassProvider>
          <App />
        </GlassProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
