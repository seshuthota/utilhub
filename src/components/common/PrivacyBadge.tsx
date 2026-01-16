'use client';

import { Lock, Sparkles, LucideIcon } from 'lucide-react';
import styles from './PrivacyBadge.module.css';

type BadgeVariant = 'client-side' | 'ai-enabled';

interface PrivacyBadgeProps {
    variant?: BadgeVariant;
    compact?: boolean;
}

interface BadgeConfig {
    icon: LucideIcon;
    label: string;
    tooltip: string;
    className: string;
}

/**
 * PrivacyBadge - Displays privacy/AI status badges on tools
 */
export default function PrivacyBadge({ variant = 'client-side', compact = false }: PrivacyBadgeProps) {
    const config: Record<BadgeVariant, BadgeConfig> = {
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
