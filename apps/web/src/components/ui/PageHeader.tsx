import React from "react";

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
  badge?: React.ReactNode;
}

/** Encabezado único para todas las pantallas: mismo tamaño, margen y jerarquía. */
export const PageHeader: React.FC<Props> = ({ title, subtitle, actions, back, badge }) => (
  <header className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0 flex-1">
      {back && <div className="mb-2">{back}</div>}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold tracking-tight text-theme-text">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="m-0 mt-1 text-sm sm:text-base text-theme-text-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </header>
);

export const cardCls = "bg-theme-card-bg border border-theme-border rounded-xl shadow-sm";

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: React.ReactNode; action?: React.ReactNode }> = ({
  children,
  className = "",
  title,
  action,
}) => (
  <section className={`${cardCls} p-5 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-4">
        {title && <h2 className="m-0 text-base font-semibold text-theme-text">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "default" | "danger" | "warning" | "success"; href?: string }> = ({
  label,
  value,
  hint,
  tone = "default",
  href,
}) => {
  const toneCls =
    tone === "danger"
      ? "text-theme-danger"
      : tone === "warning"
        ? "text-theme-warning"
        : tone === "success"
          ? "text-theme-success"
          : "text-theme-text";
  const inner = (
    <>
      <span className="text-xs font-medium uppercase tracking-wide text-theme-text-muted">{label}</span>
      <span className={`mt-1 block text-2xl sm:text-3xl font-bold tracking-tight ${toneCls}`}>{value}</span>
      {hint && <span className="mt-1 block text-xs sm:text-sm text-theme-text-muted truncate">{hint}</span>}
    </>
  );
  return href ? (
    <a href={href} className={`${cardCls} p-4 sm:p-5 block no-underline text-inherit transition-shadow hover:shadow-md`}>
      {inner}
    </a>
  ) : (
    <div className={`${cardCls} p-4 sm:p-5`}>{inner}</div>
  );
};

/** Barra de progreso simple */
export const ProgressBar: React.FC<{ value: number; tone?: "ok" | "warning" | "danger"; label?: string }> = ({ value, tone = "ok", label }) => (
  <div className="h-2 w-full rounded-full bg-theme-border overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <div
      className={`h-full rounded-full ${tone === "danger" ? "bg-theme-danger" : tone === "warning" ? "bg-theme-warning" : "bg-theme-success"}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
