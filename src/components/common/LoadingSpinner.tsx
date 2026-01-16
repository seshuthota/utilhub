'use client';

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    label?: string;
}

/**
 * A reusable loading spinner component with size variants.
 */
export default function LoadingSpinner({
    size = 'medium',
    label = 'Loading...'
}: LoadingSpinnerProps) {
    const sizeClasses: Record<string, string> = {
        small: styles.small,
        medium: styles.medium,
        large: styles.large,
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.spinner} ${sizeClasses[size] || styles.medium}`}></div>
            {label && <span className={styles.label}>{label}</span>}
        </div>
    );
}
