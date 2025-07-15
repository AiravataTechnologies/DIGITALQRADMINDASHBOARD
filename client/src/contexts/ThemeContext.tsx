import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  theme: string;
  darkMode: boolean;
  setTheme: (theme: string) => void;
  setDarkMode: (darkMode: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const colorThemes = [
  { value: "blue", primary: "hsl(214, 85%, 50%)", secondary: "hsl(210, 40%, 96%)" },
  { value: "purple", primary: "hsl(270, 95%, 50%)", secondary: "hsl(270, 40%, 96%)" },
  { value: "green", primary: "hsl(120, 95%, 40%)", secondary: "hsl(120, 40%, 96%)" },
  { value: "teal", primary: "hsl(180, 95%, 40%)", secondary: "hsl(180, 40%, 96%)" },
  { value: "orange", primary: "hsl(30, 95%, 50%)", secondary: "hsl(30, 40%, 96%)" },
  { value: "red", primary: "hsl(0, 95%, 50%)", secondary: "hsl(0, 40%, 96%)" },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>("blue");
  const [darkMode, setDarkModeState] = useState<boolean>(false);

  const applyTheme = (themeName: string, isDark: boolean) => {
    const root = document.documentElement;
    const selectedTheme = colorThemes.find(t => t.value === themeName);
    
    if (selectedTheme) {
      // Apply global CSS custom properties for all pages
      root.style.setProperty('--primary', selectedTheme.primary);
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', selectedTheme.secondary);
      root.style.setProperty('--light-blue', selectedTheme.primary);
      root.style.setProperty('--light-blue-hover', selectedTheme.primary);
      root.style.setProperty('--light-blue-light', selectedTheme.secondary);
      root.style.setProperty('--ring', selectedTheme.primary);
      root.style.setProperty('--accent', selectedTheme.primary);
      root.style.setProperty('--accent-foreground', '#ffffff');
      
      // Add theme class to body for global styling
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.add(`theme-${themeName}`);
    }

    // Apply dark mode
    if (isDark) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    // Store in localStorage
    localStorage.setItem('admin-theme', themeName);
    localStorage.setItem('admin-dark-mode', isDark.toString());
  };

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    applyTheme(newTheme, darkMode);
  };

  const setDarkMode = (newDarkMode: boolean) => {
    setDarkModeState(newDarkMode);
    applyTheme(theme, newDarkMode);
  };

  // Initialize theme from localStorage and apply immediately
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') || 'blue';
    const savedDarkMode = localStorage.getItem('admin-dark-mode') === 'true';
    
    setThemeState(savedTheme);
    setDarkModeState(savedDarkMode);
    
    // Apply theme immediately on load
    applyTheme(savedTheme, savedDarkMode);
    
    // Also force apply to make sure it takes effect on all pages
    setTimeout(() => {
      applyTheme(savedTheme, savedDarkMode);
    }, 100);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, darkMode, setTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}