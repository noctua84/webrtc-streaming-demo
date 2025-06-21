import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-gray-400 mb-6">
                            An unexpected error occurred. Please try reloading the page.
                        </p>
                        {this.state.error && (
                            <details className="text-left bg-gray-800 p-4 rounded-lg mb-6">
                                <summary className="cursor-pointer text-gray-300 mb-2">Error Details</summary>
                                <code className="text-red-400 text-sm">{this.state.error.message}</code>
                            </details>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reload Page</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}