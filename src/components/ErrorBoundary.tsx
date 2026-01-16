'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.container}>
                    <AlertTriangle size={48} className={styles.icon} aria-hidden="true" />
                    <h2 className={styles.title}>Something went wrong</h2>
                    <p className={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button onClick={this.handleReset} className={styles.button}>
                        <RefreshCcw size={16} aria-hidden="true" /> Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
