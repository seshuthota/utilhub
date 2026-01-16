'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
    theme: string;
    toggleTheme: () => void;
    setTheme: (theme: string) => void;
    availableThemes: { id: string; name: string; color: string }[];
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => { },
    setTheme: () => { },
    availableThemes: [],
});

export const THEMES = [
    { id: "dark", name: "Default Dark", color: "#0f0f0f" },
    { id: "light", name: "Light Mode", color: "#ffffff" },
    { id: "matrix", name: "The Matrix", color: "#000000" },
    { id: "cyberpunk", name: "Cyberpunk", color: "#020024" },
    { id: "dracula", name: "Dracula", color: "#282a36" },
];

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            const saved = localStorage.getItem("theme") || "dark";
            setTheme(saved);
            document.documentElement.setAttribute("data-theme", saved);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setThemeMode(newTheme);
    };

    const setThemeMode = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    if (!mounted) return null;

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme,
                setTheme: setThemeMode,
                availableThemes: THEMES,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
