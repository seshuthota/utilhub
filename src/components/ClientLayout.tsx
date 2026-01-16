'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { FavoritesProvider } from '@/components/FavoritesProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

import Header from "@/components/layout/Header";
import Background from '@/components/layout/Background';

import ShortcutsHelpModal from '@/components/common/ShortcutsHelpModal';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useState, ReactNode } from 'react';
import styles from './ClientLayout.module.css';

interface ClientLayoutProps {
    children: ReactNode;
}

/**
 * Root layout component that wraps the application content.
 * Initializes all global providers (Theme, Toast, Favorites) and common UI elements (Header, Background, Modals).
 */
export default function ClientLayout({ children }: ClientLayoutProps) {
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Global listener for Shift+?
    useHotkeys('?', () => setShowShortcuts(prev => !prev), { shift: true });

    return (
        <ThemeProvider>
            <ToastProvider>
                <FavoritesProvider>
                    <ServiceWorkerRegistration />
                    <>
                        <Background />
                        <Header />
                        <ShortcutsHelpModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
                        <main className={styles.main}>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </main>
                    </>
                </FavoritesProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
