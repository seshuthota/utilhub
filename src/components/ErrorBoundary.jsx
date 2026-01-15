'use client';

import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
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
