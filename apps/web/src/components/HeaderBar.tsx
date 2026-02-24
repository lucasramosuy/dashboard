import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export const HeaderBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {user && (
        <span style={{ fontSize: '0.875rem', color: 'var(--oat-text-muted)' }}>
          {user.name}
        </span>
      )}
      <ThemeToggle />
      {user && (
        <button onClick={logout} className="oat-btn oat-btn-outline"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
          Salir
        </button>
      )}
    </div>
  );
};
