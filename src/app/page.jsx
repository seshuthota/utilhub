'use client';

import ToolCard from '@/components/common/ToolCard';
import { tools } from '@/config/tools';
import { useFavorites } from '@/components/FavoritesProvider';
import styles from './page.module.css';

export default function Home() {
  const { favorites, recentTools, usageStats } = useFavorites();

  const favoriteTools = tools.filter(tool => favorites.includes(tool.id));

  // Sort recent tools by recent array order
  const recentToolList = recentTools
    .map(id => tools.find(t => t.id === id))
    .filter(Boolean);

  // Calculate most used (exclude those already in favorites to avoid redundancy? maybe not)
  const mostUsed = Object.entries(usageStats || {})
    .sort(([, a], [, b]) => b - a) // Descending count
    .slice(0, 4) // Top 4
    .map(([id]) => tools.find(t => t.id === id))
    .filter(Boolean);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Your <span className={styles.heroHighlight}>Developer Toolkit.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Fast, privacy-focused, and offline-ready utilities for your daily workflow.
        </p>
      </div>

      {favoriteTools.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Favorites</h2>
          <div className={styles.grid}>
            {favoriteTools.map(tool => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </section>
      )}

      {mostUsed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Most Frequent</h2>
          <div className={styles.grid}>
            {mostUsed.map(tool => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </section>
      )}

      {recentToolList.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recently Used</h2>
          <div className={styles.grid}>
            {recentToolList.map(tool => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All Tools</h2>
        <div className={styles.grid}>
          {tools.map(tool => (
            <ToolCard key={tool.id} {...tool} />
          ))}
        </div>
      </section>
    </div>
  )
}
