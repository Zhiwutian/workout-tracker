import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/app/ErrorBoundary';
import { ToastProvider } from '@/components/app/ToastProvider';
import { AppStateProvider } from '@/state';
import { BrowserRouter } from 'react-router-dom';
import { setStoredToken } from '@/lib/auth-storage';
import './index.css';

/** OIDC split-deploy: server redirects with #oidc_token=… so we can auth without cross-site cookies. */
function bootstrapOidcFragment(): void {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw.startsWith('oidc_token=')) return;
  const params = new URLSearchParams(raw);
  const t = params.get('oidc_token');
  if (!t) return;
  setStoredToken(t);
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}`,
  );
}

bootstrapOidcFragment();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AppStateProvider>
            <App />
          </AppStateProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
