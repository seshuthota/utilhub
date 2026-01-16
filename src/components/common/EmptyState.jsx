
'use client';

import { FileQuestion } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * Displays a placeholder state when no content is available.
 *
 * @param {Object} props
 * @param {import('lucide-react').LucideIcon} [props.icon] - Icon to display
 * @param {string} [props.title] - Main heading text
 * @param {string} [props.description] - Helper text below heading
 * @param {string} [props.className] - Additional classes
 * @param {Object} [props.style] - Inline styles
 */
export default function EmptyState({
    icon: Icon = FileQuestion,
    title = 'No data yet',
    description = 'Start by adding some content.',
    className = '',
    style = {}
}) {
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
