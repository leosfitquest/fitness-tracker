import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { GlobalTimerProvider } from './hooks/GlobalTimerContext'

// Ensure dark mode is always active
document.documentElement.classList.add('dark');

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <GlobalTimerProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </GlobalTimerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Register PWA Service Worker (auto-update)
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        // Auto-update — reload on next visit
        console.log('[PWA] New content available, will update on next reload.');
      },
      onOfflineReady() {
        console.log('[PWA] App is ready to work offline.');
      },
      onRegisteredSW(swUrl, r) {
        // Check for updates every 30 minutes
        if (r) {
          setInterval(() => {
            r.update();
          }, 30 * 60 * 1000);
        }
      }
    });
  }).catch((err) => {
    console.warn('[PWA] Service worker registration skipped:', err);
  });
}

// Flush pending step sync from previous session
const pendingSync = localStorage.getItem('step_pending_sync');
if (pendingSync) {
  localStorage.removeItem('step_pending_sync');
  try {
    const data = JSON.parse(pendingSync);
    // Will be handled by the step counter hook on mount
    console.log('[Steps] Pending sync data found:', data);
  } catch { /* ignore */ }
}
