"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const FavoritesContext = createContext({
  favorites: [],
  recentTools: [],
  toggleFavorite: () => {},
  addRecent: () => {},
  isFavorite: () => false,
});

/**
 * Context provider for managing user favorites and recent tool usage.
 * Persists data to localStorage.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [recentTools, setRecentTools] = useState([]);

  const [usageStats, setUsageStats] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("utilhub-favorites");
    const savedRecent = localStorage.getItem("utilhub-recent");
    const savedStats = localStorage.getItem("utilhub-stats");

    const timer = setTimeout(() => {
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedRecent) setRecentTools(JSON.parse(savedRecent));
      if (savedStats) setUsageStats(JSON.parse(savedStats));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleFavorite = useCallback((toolId) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      localStorage.setItem("utilhub-favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const addRecent = useCallback((toolId) => {
    // Update Recent
    setRecentTools((prev) => {
      const filtered = prev.filter((id) => id !== toolId);
      const newRecent = [toolId, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem("utilhub-recent", JSON.stringify(newRecent));
      return newRecent;
    });

    // Update Usage Stats
    setUsageStats((prev) => {
      const newStats = {
        ...prev,
        [toolId]: (prev[toolId] || 0) + 1,
      };
      localStorage.setItem("utilhub-stats", JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  const clearData = useCallback(() => {
    setFavorites([]);
    setRecentTools([]);
    localStorage.removeItem("utilhub-favorites");
    localStorage.removeItem("utilhub-recent");
  }, []);

  const isFavorite = useCallback(
    (toolId) => favorites.includes(toolId),
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
 * @returns {{ favorites: string[], recentTools: string[], usageStats: Object, toggleFavorite: (id: string) => void, addRecent: (id: string) => void, isFavorite: (id: string) => boolean, clearData: () => void }}
 */
export function useFavorites() {
  return useContext(FavoritesContext);
}
