'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Braces, GitGraph, Terminal, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Markdown Viewer', path: '/tools/markdown', icon: FileText },
  { name: 'JSON Formatter', path: '/tools/json', icon: Braces },
  { name: 'Mermaid Chart', path: '/tools/mermaid', icon: GitGraph },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Terminal size={24} />
        <span>UtilHub</span>
      </div>
      
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" className={styles.navItem}>
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
