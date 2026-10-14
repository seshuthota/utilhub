"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { takeHandoff } from "@/utils/handoff";

export interface UrlStateOptions {
    /**
     * Never write this value to the URL (tokens, credentials, commands that may
     * carry auth headers). It still survives "Send to…" handoffs.
     */
    sensitive?: boolean;
    /** Values larger than this are kept in memory only, so URLs stay usable. */
    maxBytes?: number;
    /** Delay before the URL is updated while typing. */
    debounceMs?: number;
}

const DEFAULT_MAX_BYTES = 16 * 1024;
const DEFAULT_DEBOUNCE_MS = 300;

function readHashParams(): URLSearchParams {
    return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function writeHashParam(key: string, value: string | null) {
    const params = readHashParams();
    if (value === null) params.delete(key);
    else params.set(key, value);
    const hash = params.toString();
    const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(window.history.state, "", url);
    }
}

/** Remove a legacy `?key=` from the query string (old shared links) without navigating. */
function dropQueryParam(key: string) {
    const query = new URLSearchParams(window.location.search);
    if (!query.has(key)) return;
    query.delete(key);
    const search = query.toString();
    window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
}

/**
 * Tool state that survives refresh and can be shared by link — stored in the URL
 * fragment (`#key=value`), which browsers never send to a server, in referrers,
 * or to analytics. Updates use `history.replaceState` (no navigation, no server
 * round-trip) and are debounced.
 */
export function useUrlState(
    key: string,
    initialValue: string = "",
    options: UrlStateOptions = {},
): [string, (newValue: string) => void] {
    const { sensitive = false, maxBytes = DEFAULT_MAX_BYTES, debounceMs = DEFAULT_DEBOUNCE_MS } = options;
    // Server render and first client render both use initialValue (no hydration mismatch).
    const [value, setValue] = useState<string>(initialValue);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialRef = useRef(initialValue);

    const persist = useCallback(
        (next: string) => {
            if (sensitive) return;
            const tooBig = new TextEncoder().encode(next).length > maxBytes;
            writeHashParam(key, next === initialRef.current || !next || tooBig ? null : next);
        },
        [key, sensitive, maxBytes],
    );

    // Load: handoff from another tool > fragment > legacy query param (then removed).
    // Reading the URL after mount (not during render) keeps server and client renders identical.
    /* eslint-disable react-hooks/set-state-in-effect -- syncing from an external store (URL/sessionStorage) */
    useEffect(() => {
        const handed = takeHandoff(window.location.pathname, key);
        if (handed !== null) {
            setValue(handed);
            persist(handed);
            return;
        }
        if (sensitive) {
            // Old links may still carry secrets in the URL — scrub them, don't load them.
            dropQueryParam(key);
            writeHashParam(key, null);
            return;
        }
        const fromHash = readHashParams().get(key);
        if (fromHash !== null) {
            setValue(fromHash);
            return;
        }
        const legacy = new URLSearchParams(window.location.search).get(key);
        if (legacy !== null) {
            setValue(legacy);
            dropQueryParam(key);
            persist(legacy);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per key
    }, [key]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Back/forward or a pasted link with a new fragment.
    useEffect(() => {
        if (sensitive) return;
        const onHashChange = () => {
            const fromHash = readHashParams().get(key);
            setValue(fromHash ?? initialRef.current);
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [key, sensitive]);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const setSyncedValue = useCallback(
        (next: string) => {
            setValue(next);
            if (sensitive) return;
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => persist(next), debounceMs);
        },
        [persist, sensitive, debounceMs],
    );

    return [value, setSyncedValue];
}
