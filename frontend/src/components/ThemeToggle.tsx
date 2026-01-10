import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-110 active:scale-95 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        <Sun className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-500 ${
          theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'
        }`} />
        <Moon className={`absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-500 ${
          theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-180 opacity-0'
        }`} />
      </div>
    </button>
  );
}