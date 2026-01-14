
'use client';

import { FileQuestion } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState({
    icon: Icon = FileQuestion,
    title = 'No data yet',
    description = 'Start by adding some content.'
}) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Icon size={48} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </div>
    );
}
