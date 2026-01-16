'use client';

import { FileQuestion, LucideIcon } from 'lucide-react';
import styles from './EmptyState.module.css';
import { CSSProperties } from 'react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * Displays a placeholder state when no content is available.
 */
export default function EmptyState({
    icon: Icon = FileQuestion,
    title = 'No data yet',
    description = 'Start by adding some content.',
    className = '',
    style = {}
}: EmptyStateProps) {
    return (
        <div className={`${styles.container} ${className}`} style={style}>
            <div className={styles.iconWrapper}>
                <Icon size={48} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </div>
    );
}
