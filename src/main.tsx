import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { GlobalTimerProvider } from './hooks/GlobalTimerContext'

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
