'use client';

import ToolCard from '@/components/common/ToolCard';
import { tools } from '@/config/tools';
import styles from './page.module.css';

export default function Home() {
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

      <div className={styles.grid}>
        {tools.map(tool => (
          <ToolCard key={tool.id} {...tool} />
        ))}
      </div>
    </div>
  )
}
