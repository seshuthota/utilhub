
'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useFavorites } from '@/components/FavoritesProvider';
import styles from './ToolCard.module.css';

export default function ToolCard({ id, title, description, icon: Icon, href }) {
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
                <button
                    className={`${styles.favoriteBtn} ${favorite ? styles.active : ''}`}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation
                        toggleFavorite(id);
                    }}
                    aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
                </button>
            </div>

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </div>
    );
}
