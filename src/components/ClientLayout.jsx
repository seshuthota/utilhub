'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { FavoritesProvider } from '@/components/FavoritesProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

import Header from "@/components/layout/Header";
import Background from '@/components/layout/Background';
import CommandPalette from '@/components/CommandPalette';
import styles from './ClientLayout.module.css';

export default function ClientLayout({ children }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <FavoritesProvider>
                    <ServiceWorkerRegistration />
                    <>
                        <Background />
                        <Header />
                        <CommandPalette />
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
