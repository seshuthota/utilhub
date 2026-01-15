
'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';
import PrivacyBadge from './PrivacyBadge';
import styles from './ToolCard.module.css';

export default function ToolCard({
    id,
    title,
    description,
    icon: Icon,
    href,
    isClientSideOnly = true,
    hasAiFeatures = false
}) {
    const { isFavorite, toggleFavorite, addRecent } = useFavorites();
    const favorite = isFavorite(id);

    const handleClick = () => {
        addRecent(id);
    };

    return (
        <div className={styles.card}>
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
