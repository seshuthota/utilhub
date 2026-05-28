'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA support.
 * Does not render any UI.
 */
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.info('SW registered:', registration.scope);
                    }
                })
                .catch((error) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('SW registration failed:', error);
                    }
                });
        }
    }, []);

    return null;
}
