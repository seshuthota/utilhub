'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Star } from 'lucide-react';
import ToolCard from '@/components/common/ToolCard';
import { tools } from '@/config/tools';
import { useFavorites } from '@/components/FavoritesProvider';
import styles from './page.module.css';

const CATEGORY_ORDER = [
  'text',
  'data',
  'code',
  'networking',
  'security',
  'encoding',
  'design',
  'media',
  'time',
  'devops',
  'validation',
  'visualization',
  'utility',
];

const CATEGORY_LABELS = {
  text: 'Text',
  data: 'Data',
  code: 'Code',
  networking: 'Network',
  security: 'Security',
  encoding: 'Encoding',
  design: 'Design',
  media: 'Media',
  time: 'Time',
  devops: 'DevOps',
  validation: 'Validation',
  visualization: 'Visual',
  utility: 'Utility',
};

function labelFor(category) {
  return CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

export default function Home() {
  const { favorites, recentTools, addRecent } = useFavorites();
  const [activeCategory, setActiveCategory] = useState('all');

  const favoriteTools = tools.filter((tool) => favorites.includes(tool.id));

  const recentToolList = recentTools
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean);

  const categories = useMemo(() => {
    const unique = [...new Set(tools.map((tool) => tool.category).filter(Boolean))];
    return unique.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, []);

  const visibleTools =
    activeCategory === 'all'
      ? tools
      : tools.filter((tool) => tool.category === activeCategory);

  const showRail = favoriteTools.length > 0 || recentToolList.length > 0;

  return (
    <div className={styles.container}>
      {showRail && (
        <div className={styles.rail}>
          {recentToolList.length > 0 && (
            <section className={styles.railGroup} aria-label="Recently Used">
              <h2 className={styles.railLabel}>
                <Clock size={14} aria-hidden />
                Recently Used
              </h2>
              <div className={styles.chips}>
                {recentToolList.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href || '#'}
                      className={styles.chip}
                      onClick={() => addRecent?.(tool.id)}
                    >
                      {Icon ? <Icon size={15} aria-hidden /> : null}
                      <span>{tool.title}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {favoriteTools.length > 0 && (
            <section className={styles.railGroup} aria-label="Favorites">
              <h2 className={styles.railLabel}>
                <Star size={14} aria-hidden />
                Favorites
              </h2>
              <div className={styles.chips}>
                {favoriteTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href || '#'}
                      className={`${styles.chip} ${styles.chipFavorite}`}
                      onClick={() => addRecent?.(tool.id)}
                    >
                      {Icon ? <Icon size={15} aria-hidden /> : null}
                      <span>{tool.title}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <section className={styles.catalog} aria-label="All Tools">
        <div className={styles.catalogBar}>
          <div className={styles.catalogHeading}>
            <h2 className={styles.catalogTitle}>All Tools</h2>
            <span className={styles.count}>{visibleTools.length}</span>
          </div>
          <div className={styles.filters} role="tablist" aria-label="Filter by category">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`${styles.filter} ${activeCategory === 'all' ? styles.filterActive : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                className={`${styles.filter} ${activeCategory === category ? styles.filterActive : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {labelFor(category)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {visibleTools.map((tool) => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
