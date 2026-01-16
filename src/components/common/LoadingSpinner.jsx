
'use client';

import styles from './LoadingSpinner.module.css';

/**
 * A reusable loading spinner component with size variants.
 *
 * @param {Object} props
 * @param {'small' | 'medium' | 'large'} [props.size='medium'] - Size of the spinner
 * @param {string} [props.label='Loading...'] - Text label to display next to/below spinner
 */
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
