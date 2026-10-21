import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeSwitcher({ variant = 'dropdown' }) {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0];

  // Inline variant for Mobile Menu or Footer
  if (variant === 'inline') {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-stone-400">
          <Palette className="w-3.5 h-3.5 text-amber-500" />
          <span>Atelier Theme</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                    : 'border-stone-700/60 bg-stone-900/60 hover:border-stone-500'
                }`}
                aria-label={`Select ${t.name}`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border shadow-xs"
                    style={{ backgroundColor: t.bgPreview, borderColor: t.borderPreview }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: t.accentPreview }}
                  />
                </div>
                <span className={`text-[11px] ${isSelected ? 'font-bold text-white' : 'text-stone-300'}`}>
                  {t.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Header Dropdown Variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-stone-300/80 hover:border-stone-400 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm text-stone-800 dark:text-stone-200 transition-all text-xs font-medium shadow-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        aria-label="Theme selector"
        title="Switch Visual Theme"
      >
        {/* Active Theme Mini Swatch */}
        <div className="flex items-center -space-x-1">
          <span
            className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-xs"
            style={{ backgroundColor: currentThemeObj.bgPreview }}
          />
          <span
            className="w-3.5 h-3.5 rounded-full border border-white"
            style={{ backgroundColor: currentThemeObj.accentPreview }}
          />
        </div>

        <span className="text-[11px] uppercase tracking-wider font-semibold hidden md:inline">
          {currentThemeObj.shortName}
        </span>
        <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-2xl p-2 z-50 animate-fade-in text-xs">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-400 font-bold border-b border-stone-100 dark:border-stone-800/80 mb-1 flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-amber-500" />
            <span>Select Aesthetic Theme</span>
          </div>

          <div className="space-y-1">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 text-stone-950 dark:text-white font-semibold'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Visual Swatch Pill */}
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 shadow-xs"
                        style={{ backgroundColor: t.bgPreview }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white dark:border-stone-900 shadow-xs"
                        style={{ backgroundColor: t.accentPreview }}
                      />
                    </div>

                    <div className="text-left">
                      <span className="block text-xs font-semibold leading-tight">{t.name}</span>
                      <span className="block text-[10px] text-stone-400 font-normal leading-tight">
                        {t.description}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-500 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
