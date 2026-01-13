'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
    theme: 'dark',
    toggleTheme: () => { },
});

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
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
