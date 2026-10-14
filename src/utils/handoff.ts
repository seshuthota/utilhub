/**
 * Pass content from one tool to another ("Send to…", command palette) without
 * putting it in the URL. The value is parked in sessionStorage for the target
 * route and consumed once by that tool's `useUrlState(key)`.
 */

const HANDOFF_KEY = "utilhub_handoff";
const MAX_AGE_MS = 60_000;

interface Handoff {
    path: string;
    key: string;
    value: string;
    ts: number;
}

export function setHandoff(path: string, key: string, value: string): void {
    try {
        const entry: Handoff = { path, key, value, ts: Date.now() };
        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(entry));
    } catch {
        /* storage unavailable (private mode, quota) — the target opens empty */
    }
}

/** Return and clear the pending value for this route + key, if any. */
export function takeHandoff(path: string, key: string): string | null {
    try {
        const raw = sessionStorage.getItem(HANDOFF_KEY);
        if (!raw) return null;
        const entry = JSON.parse(raw) as Handoff;
        if (Date.now() - entry.ts > MAX_AGE_MS) {
            sessionStorage.removeItem(HANDOFF_KEY);
            return null;
        }
        if (entry.path !== path || entry.key !== key) return null;
        sessionStorage.removeItem(HANDOFF_KEY);
        return entry.value;
    } catch {
        return null;
    }
}
