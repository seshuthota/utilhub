'use client';

import Link from 'next/link';
import { Star, LucideIcon } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';
import PrivacyBadge from './PrivacyBadge';
import styles from './ToolCard.module.css';
import { CSSProperties } from 'react';

interface ToolCardProps {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    isClientSideOnly?: boolean;
    hasAiFeatures?: boolean;
    className?: string;
    style?: CSSProperties;
}

/**
 * ToolCard component displays a summary of a tool with navigation link and favorite toggle.
 */
export default function ToolCard({
    id,
    title,
    description,
    icon: Icon,
    href,
    isClientSideOnly = true,
    hasAiFeatures = false,
    className = '',
    style = {}
}: ToolCardProps) {
    const { isFavorite, toggleFavorite, addRecent } = useFavorites();
    const favorite = isFavorite(id);

    const handleClick = () => {
        addRecent(id);
    };

    return (
        <div className={`${styles.card} ${className}`} style={style}>
            {/* Overlay Link for navigation */}
            <Link
                href={href}
                className={styles.linkOverlay}
                onClick={handleClick}
                aria-label={`Open ${title}`}
            >
                <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                    Open {title}
                </span>
            </Link>

            <div className={styles.cardHeader}>
                <div className={styles.icon}>
                    <Icon size={28} />
                </div>
                <div className={styles.headerActions}>
                    {/* Privacy Badges */}
                    <div className={styles.badges}>
                        {isClientSideOnly && (
                            <PrivacyBadge variant="client-side" compact />
                        )}
                        {hasAiFeatures && (
                            <PrivacyBadge variant="ai-enabled" compact />
                        )}
                    </div>
                    <button
                        className={`${styles.favoriteBtn} ${favorite ? styles.active : ''}`}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent navigation
                            toggleFavorite(id);
                        }}
                        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={favorite}
                        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </div>
    );
}
