'use client';

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

export default function AnalyticsGate() {
    return <Analytics beforeSend={scrubAnalyticsEvent} />;
}
