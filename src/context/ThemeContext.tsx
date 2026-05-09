import React, { createContext, useContext } from 'react';

/**
 * Simplified ThemeContext — single theme only (light).
 * Dark/Light toggle has been removed.
 * The provider is kept to avoid breaking consumers that import useTheme.
 */

interface ThemeContextType {
    theme: 'light';
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Ensure the root always has 'light' class and no 'dark' class
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';

    return (
        <ThemeContext.Provider value={{ theme: 'light' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    return useContext(ThemeContext);
};
