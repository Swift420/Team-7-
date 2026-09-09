import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ArticleProvider } from './context/ArticleContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ArticleProvider>
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        </ArticleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
