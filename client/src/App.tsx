import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ArticleProvider } from "./context/ArticleContext";
import { AppShell } from "./components/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./App.css";

// Providers are mounted once at the root so article/auth state survives screen changes.
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ArticleProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </ArticleProvider>
    </AuthProvider>
  );
};

export default App;
