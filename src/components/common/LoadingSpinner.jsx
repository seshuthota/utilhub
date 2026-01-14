
'use client';

import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ size = 'medium', label = 'Loading...' }) {
    const sizeClasses = {
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
