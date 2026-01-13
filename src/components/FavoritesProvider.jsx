'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FavoritesContext = createContext({
    favorites: [],
    recentTools: [],
    toggleFavorite: () => { },
    addRecent: () => { },
    isFavorite: () => false,
});

export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState([]);
    const [recentTools, setRecentTools] = useState([]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedFavorites = localStorage.getItem('utilhub-favorites');
        const savedRecent = localStorage.getItem('utilhub-recent');
        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        if (savedRecent) setRecentTools(JSON.parse(savedRecent));
    }, []);

    const toggleFavorite = useCallback((toolId) => {
        setFavorites(prev => {
            const newFavorites = prev.includes(toolId)
                ? prev.filter(id => id !== toolId)
                : [...prev, toolId];
            localStorage.setItem('utilhub-favorites', JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    const addRecent = useCallback((toolId) => {
        setRecentTools(prev => {
            const filtered = prev.filter(id => id !== toolId);
            const newRecent = [toolId, ...filtered].slice(0, 5); // Keep last 5
            localStorage.setItem('utilhub-recent', JSON.stringify(newRecent));
            return newRecent;
        });
    }, []);

    const clearData = useCallback(() => {
        setFavorites([]);
        setRecentTools([]);
        localStorage.removeItem('utilhub-favorites');
        localStorage.removeItem('utilhub-recent');
    }, []);

    const isFavorite = useCallback((toolId) => favorites.includes(toolId), [favorites]);

    return (
        <FavoritesContext.Provider value={{ favorites, recentTools, toggleFavorite, addRecent, isFavorite, clearData }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    return useContext(FavoritesContext);
}
