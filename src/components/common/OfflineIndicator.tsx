'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import styles from './OfflineIndicator.module.css';

/**
 * A non-intrusive component that monitors network status and displays
 * an indicator when the user is offline.
 */
export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showStatus, setShowStatus] = useState(false);

    useEffect(() => {
        // Initial check
        setIsOnline(window.navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowStatus(true);
            // Hide "Online" message after a delay
            setTimeout(() => setShowStatus(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowStatus(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Only show if offline, or if we just came back online
    if (!showStatus && isOnline) return null;

    return (
        <div className={`${styles.indicator} ${isOnline ? styles.online : styles.offline}`}>
            {isOnline ? (
                <>
                    <Wifi size={14} aria-hidden="true" />
                    <span>Back Online</span>
                </>
            ) : (
                <>
                    <WifiOff size={14} aria-hidden="true" />
                    <span>Offline Mode</span>
                </>
            )}
        </div>
    );
}
