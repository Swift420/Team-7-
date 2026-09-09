import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Converts render-time failures into a recoverable screen instead of a blank app. */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled frontend error", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-boundary-page" role="alert">
        <div className="error-boundary-card">
          <h1>Something went wrong</h1>
          <p>
            This part of the newsroom could not be displayed. Reload to try
            again.
          </p>
          <button type="button" onClick={this.handleReload}>
            Reload application
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details>
              <summary>Technical details</summary>
              <pre>{this.state.error.stack || this.state.error.message}</pre>
            </details>
          )}
        </div>
      </main>
    );
  }
}
