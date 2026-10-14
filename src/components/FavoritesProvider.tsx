'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";

interface FavoritesContextType {
    favorites: string[];
    recentTools: string[];
    usageStats: Record<string, number>;
    toggleFavorite: (toolId: string) => void;
    addRecent: (toolId: string) => void;
    isFavorite: (toolId: string) => boolean;
    clearData: () => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    recentTools: [],
    usageStats: {},
    toggleFavorite: () => { },
    addRecent: () => { },
    isFavorite: () => false,
    clearData: () => { },
});

/**
 * Context provider for managing user favorites and recent tool usage.
 * Persists data to localStorage.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [recentTools, setRecentTools] = useState<string[]>([]);
    const [usageStats, setUsageStats] = useState<Record<string, number>>({});

    // Load from localStorage on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            // Read inside the callback so a recent recorded by a child on first
            // render (ToolRouteInfo) is not overwritten by a stale snapshot.
            const savedFavorites = localStorage.getItem("utilhub-favorites");
            const savedRecent = localStorage.getItem("utilhub-recent");
            const savedStats = localStorage.getItem("utilhub-stats");
            if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
            if (savedRecent) setRecentTools(JSON.parse(savedRecent));
            if (savedStats) setUsageStats(JSON.parse(savedStats));
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleFavorite = useCallback((toolId: string) => {
        setFavorites((prev) => {
            const newFavorites = prev.includes(toolId)
                ? prev.filter((id) => id !== toolId)
                : [...prev, toolId];
            localStorage.setItem("utilhub-favorites", JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const addRecent = useCallback((toolId: string) => {
        // Derive from localStorage (the source of truth) rather than state, so a
        // visit recorded before the initial load finishes doesn't clobber history.
        const readJson = <T,>(key: string, fallback: T): T => {
            try {
                const raw = localStorage.getItem(key);
                return raw ? (JSON.parse(raw) as T) : fallback;
            } catch {
                return fallback;
            }
        };

        const storedRecent = readJson<string[]>("utilhub-recent", []);
        const newRecent = [toolId, ...storedRecent.filter((id) => id !== toolId)].slice(0, 5); // Keep last 5
        localStorage.setItem("utilhub-recent", JSON.stringify(newRecent));
        setRecentTools(newRecent);

        const storedStats = readJson<Record<string, number>>("utilhub-stats", {});
        const newStats = { ...storedStats, [toolId]: (storedStats[toolId] || 0) + 1 };
        localStorage.setItem("utilhub-stats", JSON.stringify(newStats));
        setUsageStats(newStats);
    }, []);

    const clearData = useCallback(() => {
        setFavorites([]);
        setRecentTools([]);
        localStorage.removeItem("utilhub-favorites");
        localStorage.removeItem("utilhub-recent");
    }, []);

    const isFavorite = useCallback(
        (toolId: string) => favorites.includes(toolId),
        [favorites],
    );

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                recentTools,
                usageStats,
                toggleFavorite,
                addRecent,
                isFavorite,
                clearData,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

/**
 * Hook to access favorites and recent tools.
 */
export function useFavorites() {
    return useContext(FavoritesContext);
}
