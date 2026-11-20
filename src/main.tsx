import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-4 text-[#111827]">
          <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-lg p-6 text-center space-y-3">
            <h1 className="text-lg font-bold">Shoppingey.com</h1>
            <p className="text-sm text-[#4B5563]">
              Something went wrong while loading this page. Please reload to try again.
            </p>
            <p className="text-xs font-mono text-[#6B7280] break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold text-[#131921] bg-[#F59E0B] hover:bg-[#D97706] rounded-md cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
