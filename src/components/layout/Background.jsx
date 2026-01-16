'use client';

import styles from './Background.module.css';

/**
 * Application background component with gradient and dot pattern.
 * Purely decorative.
 */
export default function Background() {
    return (
        <div className={styles.background}>
            <div className={styles.gradient} />
            <div className={styles.dots} />
        </div>
    );
}
