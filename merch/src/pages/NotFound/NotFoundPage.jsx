import React from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="not-found" role="main">
      <div className="not-found__content">
        <p className="not-found__code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn--primary not-found__cta">
          Back to home
        </Link>
      </div>
    </div>
  );
}
