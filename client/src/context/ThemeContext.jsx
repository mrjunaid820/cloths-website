/**
 * ==============================================================================
 * AURA ATELIER — Switchable Visual Themes Engine (Black, White, Blue)
 * ==============================================================================
 * Manages dynamic CSS design tokens and user visual preferences across the
 * entire boutique storefront, customer account suite, cart, and modals.
 * 
 * Themes:
 * 1. White Theme (Default): Clean ivory backgrounds, dark text, subtle borders.
 * 2. Black Theme: High-fashion midnight surfaces, gold luxury accents, dark mode.
 * 3. Blue Theme: Regal navy sapphire accents, crisp contrast, royal atelier feel.
 * 
 * Features:
 * - Immediate global theme re-rendering without reloading the page
 * - Synchronizes with CSS custom properties via `data-theme` attribute on `<html>`
 * - Persistent storage in browser localStorage with graceful first-time visitor fallback
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

/**
 * Definition of the three available luxury themes with color preview tokens.
 */
export const THEMES = [
  {
    id: 'white',
    name: 'White Theme',
    shortName: 'White',
    description: 'Minimal, clean ivory fashion aesthetic with dark readable text',
    bgPreview: '#ffffff',
    borderPreview: '#e5e7eb',
    accentPreview: '#18181b',
    iconColor: '#18181b'
  },
  {
    id: 'black',
    name: 'Black Theme',
    shortName: 'Black',
    description: 'Noir luxury haute couture with opulent gold and bronze accents',
    bgPreview: '#09090b',
    borderPreview: '#27272a',
    accentPreview: '#d4af37',
    iconColor: '#d4af37'
  },
  {
    id: 'blue',
    name: 'Blue Theme',
    shortName: 'Blue',
    description: 'Regal navy blue couture with sapphire accents and crisp contrast',
    bgPreview: '#f8fafc',
    borderPreview: '#cbd5e1',
    accentPreview: '#1e3a8a',
    iconColor: '#1e3a8a'
  }
];

/**
 * ThemeProvider component that wraps the application and syncs CSS custom properties.
 */
export function ThemeProvider({ children }) {
  // Initialize theme from localStorage preference, defaulting to White
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_atelier_theme');
      if (saved && ['white', 'black', 'blue'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for theme:', e);
    }
    return 'white'; // Default to White theme for first-time visitors
  });

  /**
   * Update current theme and persist preference to localStorage.
   * @param {string} newTheme - 'white' | 'black' | 'blue'
   */
  const setTheme = (newTheme) => {
    if (!['white', 'black', 'blue'].includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem('aura_atelier_theme', newTheme);
    } catch (e) {
      console.warn('Unable to save theme preference:', e);
    }
  };

  // Synchronize <html> root classes and data-theme attribute whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('theme-white', 'theme-black', 'theme-blue');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to consume theme state and switcher controls.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
