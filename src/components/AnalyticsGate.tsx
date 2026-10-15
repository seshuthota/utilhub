'use client';

import { useSyncExternalStore } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";

export const ANALYTICS_OPT_OUT_KEY = "utilhub-analytics-optout";

export function isAnalyticsOptedOut(): boolean {
    try {
        if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return true;
        return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
    } catch {
        return false;
    }
}

/**
 * Page-view analytics without tool data: only the path is reported — the query
 * string and fragment (where tool state may live) are stripped from every event.
 * Respects the Settings opt-out and the browser's Global Privacy Control signal.
 */
export function scrubAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
    if (isAnalyticsOptedOut()) return null;
    try {
        const url = new URL(event.url);
        return { ...event, url: `${url.origin}${url.pathname}` };
    } catch {
        return null;
    }
}

const subscribe = () => () => {};

/**
 * The analytics script itself is only loaded in production builds for users who
 * haven't opted out (Settings or Global Privacy Control) — opting out means no
 * script at all, not just dropped events. A Settings change applies on next load.
 */
export default function AnalyticsGate() {
    const enabled = useSyncExternalStore(
        subscribe,
        () => process.env.NODE_ENV === "production" && !isAnalyticsOptedOut(),
        () => false,
    );
    return enabled ? <Analytics beforeSend={scrubAnalyticsEvent} /> : null;
}
