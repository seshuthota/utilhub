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
    // The inline script in app/layout.js already applied the saved theme before paint;
    // children always render (an empty server render hurt first paint and SEO).
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const applied = document.documentElement.getAttribute("data-theme");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with pre-paint theme script
        if (applied && applied !== "dark") setTheme(applied);
    }, []);

    const setThemeMode = (newTheme: string) => {
        setTheme(newTheme);
        try {
            localStorage.setItem("theme", newTheme);
        } catch { /* storage unavailable */ }
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    // Cycles through every theme (previously jumped back to dark from matrix/cyberpunk/dracula)
    const toggleTheme = () => {
        const index = THEMES.findIndex((t) => t.id === theme);
        setThemeMode(THEMES[(index + 1) % THEMES.length].id);
    };

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
