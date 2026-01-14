'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({

    theme: 'dark',
    toggleTheme: () => { },
    setTheme: (theme) => { },
    availableThemes: []
});

export const THEMES = [
    { id: 'dark', name: 'Default Dark', color: '#0f0f0f' },
    { id: 'light', name: 'Light Mode', color: '#ffffff' },
    { id: 'matrix', name: 'The Matrix', color: '#000000' },
    { id: 'cyberpunk', name: 'Cyberpunk', color: '#020024' },
    { id: 'dracula', name: 'Dracula', color: '#282a36' },
];

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme') || 'dark';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setThemeMode(newTheme);
    };

    const setThemeMode = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    }

    if (!mounted) return null;

    return (

        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeMode, availableThemes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
