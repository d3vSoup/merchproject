import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <this.props.fallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }) {
  return (
    <div className="error-boundary" role="alert">
      <div className="error-boundary__content">
        <div className="error-boundary__icon" aria-hidden="true">
          ⚠
        </div>
        <h1 className="error-boundary__title">Something went wrong</h1>
        <p className="error-boundary__message">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="error-boundary__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onRetry}
            aria-label="Try again"
          >
            Try again
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => (window.location.href = "/")}
            aria-label="Go to home"
          >
            Go to home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children, fallback = ErrorFallback }) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
