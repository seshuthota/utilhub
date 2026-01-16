
'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';
import PrivacyBadge from './PrivacyBadge';
import styles from './ToolCard.module.css';

/**
 * ToolCard component displays a summary of a tool with navigation link and favorite toggle.
 *
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the tool
 * @param {string} props.title - Display title of the tool
 * @param {string} props.description - Short description of the tool
 * @param {import('lucide-react').LucideIcon} props.icon - Lucide icon component
 * @param {string} props.href - URL path to the tool page
 * @param {boolean} [props.isClientSideOnly=true] - Whether the tool runs entirely client-side
 * @param {boolean} [props.hasAiFeatures=false] - Whether the tool has AI capabilities
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline styles
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
}) {
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
