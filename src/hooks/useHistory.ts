import { useState } from "react";

/**
 * Custom hook to manage history in localStorage
 * @param key - LocalStorage key
 * @param maxItems - Maximum number of items to keep
 */
function loadHistory<T>(key: string): T[] {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error(`Failed to load history for key "${key}":`, e);
        return [];
    }
}

export function useHistory<T = any>(key: string, maxItems: number = 20) {
    const [history, setHistory] = useState<T[]>(() => loadHistory(key));

    const addToHistory = (item: T) => {
        setHistory((prev) => {
            // Check for duplicates (optional, based on deep equality or simple JSON stringify)
            const newItemJson = JSON.stringify(item);
            const filtered = prev.filter((i) => JSON.stringify(i) !== newItemJson);

            const newHistory = [item, ...filtered].slice(0, maxItems);

            try {
                localStorage.setItem(key, JSON.stringify(newHistory));
            } catch (e) {
                console.error("Failed to save history:", e);
            }
            return newHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(key);
    };

    const removeFromHistory = (index: number) => {
        setHistory((prev) => {
            const newHistory = [...prev];
            newHistory.splice(index, 1);
            localStorage.setItem(key, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    return { history, addToHistory, clearHistory, removeFromHistory };
}
