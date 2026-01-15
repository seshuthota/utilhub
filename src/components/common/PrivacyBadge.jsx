'use client';

import { Lock, Sparkles } from 'lucide-react';
import styles from './PrivacyBadge.module.css';

/**
 * PrivacyBadge - Displays privacy/AI status badges on tools
 * 
 * @param {Object} props
 * @param {'client-side' | 'ai-enabled'} props.variant - Badge type
 * @param {boolean} props.compact - Use compact (icon-only) mode
 */
export default function PrivacyBadge({ variant = 'client-side', compact = false }) {
    const isClientSide = variant === 'client-side';

    const config = {
        'client-side': {
            icon: Lock,
            label: 'Client-Side Only',
            tooltip: 'Your data never leaves your browser. All processing happens locally.',
            className: styles.clientSide
        },
        'ai-enabled': {
            icon: Sparkles,
            label: 'AI-Powered',
            tooltip: 'This tool uses AI features that send data to our AI provider when activated.',
            className: styles.aiEnabled
        }
    };

    const { icon: Icon, label, tooltip, className } = config[variant];

    return (
        <span
            className={`${styles.badge} ${className} ${compact ? styles.compact : ''}`}
            title={tooltip}
            role="status"
            aria-label={`${label}: ${tooltip}`}
        >
            <Icon size={compact ? 12 : 14} aria-hidden="true" />
            {!compact && <span className={styles.label}>{label}</span>}
        </span>
    );
}
