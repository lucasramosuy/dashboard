import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="oat-btn oat-btn-outline"
      style={{ padding: '0.5rem 0.75rem', fontSize: '1rem', lineHeight: 1 }}
      aria-label="Cambiar tema"
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
