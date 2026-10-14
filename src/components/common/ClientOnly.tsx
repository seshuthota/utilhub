'use client';

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/**
 * Renders children only in the browser. Tool pages were written for the client
 * (they touch window/localStorage/self while rendering or importing), so the
 * tools layout gates them here while the shell, title and badges still render
 * on the server. Remove per tool once it is SSR-safe.
 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
    const isClient = useSyncExternalStore(subscribe, () => true, () => false);
    return <>{isClient ? children : fallback}</>;
}
