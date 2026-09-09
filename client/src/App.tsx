import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ArticleProvider } from './context/ArticleContext';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ArticleProvider>
        <ErrorBoundary><AppShell /></ErrorBoundary>
      </ArticleProvider>
    </AuthProvider>
  );
};

export default App;
