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

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
    };

    return (
        <Link href={href} onClick={handleClick}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.icon}>
                        <Icon size={28} />
                    </div>
                    <button
                        className={`${styles.favoriteBtn} ${favorite ? styles.active : ''}`}
                        onClick={handleFavorite}
                        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
                    </button>
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
        </Link>
    );
}
