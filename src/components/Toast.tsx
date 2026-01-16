'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import styles from './Toast.module.css';

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    description?: string | null;
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info', description?: string | null) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

/**
 * Context provider for managing toast notifications.
 * Renders the toast container and notifications.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', description: string | null = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, description }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.container}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
                        <div>{toast.message}</div>
                        {toast.description && (
                            <div className={styles.description}>{toast.description}</div>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * Hook to access the toast notification system.
 */
export function useToast() {
    return useContext(ToastContext);
}
