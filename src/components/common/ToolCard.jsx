'use client';

import Link from 'next/link';
import styles from './ToolCard.module.css';

export default function ToolCard({ title, description, icon: Icon, href }) {
    return (
        <Link href={href}>
            <div className={styles.card}>
                <div className={styles.icon}>
                    <Icon size={28} />
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
        </Link>
    );
}
