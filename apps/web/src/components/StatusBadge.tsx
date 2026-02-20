import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

interface Props {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente reutilizable para badges de estado alineado con el sistema de diseño de Oat UI.
 */
export const StatusBadge: React.FC<Props> = ({ variant = 'info', children, className = '' }) => {
  return (
    <span className={`oat-badge oat-badge--${variant} ${className}`}>
      {children}
    </span>
  );
};
