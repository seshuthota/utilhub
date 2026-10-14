'use client';

import { Lock, Sparkles, Globe, LucideIcon } from 'lucide-react';
import styles from './PrivacyBadge.module.css';

export type BadgeVariant = 'client-side' | 'ai-enabled' | 'network';

interface PrivacyBadgeProps {
    variant?: BadgeVariant;
    compact?: boolean;
}

interface BadgeConfig {
    icon: LucideIcon;
    label: string;
    tooltip: string;
    classKey: 'clientSide' | 'aiEnabled' | 'network';
}

const BADGE_CONFIG: Record<BadgeVariant, BadgeConfig> = {
    'client-side': {
        icon: Lock,
        label: 'Client-side only',
        tooltip: 'Client-side only — data never leaves your browser',
        classKey: 'clientSide',
    },
    'ai-enabled': {
        icon: Sparkles,
        label: 'Optional AI',
        tooltip: 'Optional AI features send the text you choose to Groq',
        classKey: 'aiEnabled',
    },
    network: {
        icon: Globe,
        label: 'Network',
        tooltip: 'Sends requests to the network you choose',
        classKey: 'network',
    },
};

/**
 * PrivacyBadge - Displays where a tool's data can go.
 * Use `getPrivacyVariants(tool)` from `@/config/toolMetadata` to pick variants.
 */
export default function PrivacyBadge({ variant = 'client-side', compact = false }: PrivacyBadgeProps) {
    const { icon: Icon, label, tooltip, classKey } = BADGE_CONFIG[variant];

    return (
        <span
            className={`${styles.badge} ${styles[classKey]} ${compact ? styles.compact : ''}`}
            title={tooltip}
            role="img"
            aria-label={tooltip}
        >
            <Icon size={compact ? 12 : 14} aria-hidden="true" />
            {!compact && <span className={styles.label}>{label}</span>}
        </span>
    );
}
