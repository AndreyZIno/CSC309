import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
    theme: string;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeToggle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<string>("light");

    useEffect(() => {
        // Initialize theme from localStorage or default to 'light'
        const storedTheme = localStorage.getItem("theme") || "light";
        setTheme(storedTheme);

        // Ensure the correct class is applied
        document.documentElement.classList.add(storedTheme);
        document.documentElement.classList.remove(storedTheme === "light" ? "dark" : "light");
    }, []);

    const toggleTheme = () => {
        // Toggle between 'light' and 'dark' themes
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);

        // Apply and remove classes accordingly
        document.documentElement.classList.add(newTheme);
        document.documentElement.classList.remove(theme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeToggle provider");
    }
    return context;
};
