// Error Boundary Component
// Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details to console for debugging
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            // Fallback UI when an error occurs
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                        <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
                        <p className="text-gray-600 mb-6">
                            We're sorry for the inconvenience. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Refresh Page
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mt-6 p-4 bg-red-50 rounded-lg text-left">
                                <p className="text-xs font-mono text-red-800 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
