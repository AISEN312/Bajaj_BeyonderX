import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './icons/Icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Error boundary component to catch and handle React errors gracefully
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 dark:text-red-300 text-center mb-4">
            An error occurred while rendering this component. Please refresh the page to try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-xs text-red-700 dark:text-red-400">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}