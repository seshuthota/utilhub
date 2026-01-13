'use client';

import { useState, useEffect } from 'react';
import { Monitor, Moon, Sun, Trash2, RotateCcw, Info, Github, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useFavorites } from '@/components/FavoritesProvider';
import { useToast } from '@/components/Toast';
import { setApiKey as setGroqApiKey, isConfigured as isAiConfigured } from '@/lib/ai';
import styles from './page.module.css';
import pkg from '../../../package.json';

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { clearData } = useFavorites();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all favorites and history? This cannot be undone.')) {
            clearData();
            showToast('All data cleared successfully.', 'success');
        }
    };

    if (!mounted) return null;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Settings</h1>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Monitor size={20} />
                    <span>Appearance</span>
                </h2>

                <div className={styles.card}>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            <span>Theme</span>
                            <p className={styles.description}>Select your preferred interface appearance.</p>
                        </div>
                        <div className={styles.themeToggle}>
                            <button
                                className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                                onClick={() => setTheme('light')}
                                aria-label="Light Mode"
                            >
                                <Sun size={18} />
                                <span>Light</span>
                            </button>
                            <button
                                className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                                onClick={() => setTheme('dark')}
                                aria-label="Dark Mode"
                            >
                                <Moon size={18} />
                                <span>Dark</span>
                            </button>
                            <button
                                className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                                onClick={() => setTheme('system')}
                                aria-label="System Theme"
                            >
                                <Monitor size={18} />
                                <span>System</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <RotateCcw size={20} />
                    <span>Data Management</span>
                </h2>

                <div className={styles.card}>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            <span>Reset Application</span>
                            <p className={styles.description}>Clear all favorites, history, and local preferences.</p>
                        </div>
                        <button className={styles.dangerBtn} onClick={handleClearData}>
                            <Trash2 size={16} />
                            <span>Clear Data</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Sparkles size={20} />
                    <span>AI Configuration</span>
                </h2>

                <div className={styles.card}>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            <span>Groq API Key</span>
                            <p className={styles.description}>Required for AI Assist features. Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>console.groq.com</a></p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="password"
                                placeholder={isAiConfigured() ? '••••••••••••••••' : 'Enter API key'}
                                defaultValue=""
                                onBlur={(e) => {
                                    if (e.target.value) {
                                        setGroqApiKey(e.target.value);
                                        showToast('API key saved!', 'success');
                                        e.target.value = '';
                                    }
                                }}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    color: 'var(--foreground)',
                                    width: '220px',
                                    fontSize: '0.9rem'
                                }}
                            />
                            {isAiConfigured() && (
                                <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>✓ Configured</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Info size={20} />
                    <span>About</span>
                </h2>

                <div className={styles.card}>
                    <div className={styles.row}>
                        <div className={styles.label}>
                            <span>Version</span>
                        </div>
                        <span className={styles.value}>v{pkg.version}</span>
                    </div>
                    <div className={`${styles.row} ${styles.linkRow}`}>
                        <a
                            href="https://github.com/seshuthota/utilhub"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                        >
                            <Github size={18} />
                            <span>GitHub Repository</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
