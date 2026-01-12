'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { FavoritesProvider } from '@/components/FavoritesProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from '@/components/ThemeToggle';
import styles from './ClientLayout.module.css';

export default function ClientLayout({ children }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <FavoritesProvider>
                    <ServiceWorkerRegistration />
                    <div className={styles.layout}>
                        <Sidebar />
                        <main className={styles.main}>
                            <div className={styles.themeToggle}>
                                <ThemeToggle />
                            </div>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </main>
                    </div>
                </FavoritesProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
