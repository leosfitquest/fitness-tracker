import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-red-900/50 rounded-xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong</h1>
            <p className="text-slate-300 mb-6">
              The application encountered a critical error and could not load.
            </p>
            
            {this.state.error && (
              <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60 mb-6 border border-slate-800">
                <p className="font-mono text-red-400 text-sm whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
