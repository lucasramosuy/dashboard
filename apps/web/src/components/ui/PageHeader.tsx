import React from "react";

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
  badge?: React.ReactNode;
  /** Etiqueta en DM Mono, p. ej. "02 / TAREAS". */
  eyebrow?: React.ReactNode;
}

/** Encabezado único para todas las pantallas: eyebrow, titular con palabra de acento y acciones. */
export const PageHeader: React.FC<Props> = ({ title, subtitle, actions, back, badge, eyebrow }) => (
  <header className="mb-8 sm:mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div className="min-w-0 flex-1">
      {back && <div className="mb-3">{back}</div>}
      {eyebrow && <p className="eyebrow m-0 mb-3">{eyebrow}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="m-0 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] text-theme-text">
          {title}
        </h1>
        {badge}
      </div>
      {subtitle && <p className="m-0 mt-3 text-sm sm:text-base text-theme-text-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
  </header>
);

export const cardCls = "bg-theme-card-bg border border-theme-border rounded-xl";

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ children, className = "", title, eyebrow, action }) => (
  <section className={`${cardCls} p-5 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow m-0 mb-1.5">{eyebrow}</p>}
          {title && <h2 className="m-0 text-base font-semibold text-theme-text">{title}</h2>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

/** Enlace secundario: texto con subrayado fino en el acento (nunca texto plano). */
export const TextLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a href={href} className="link-accent inline-flex items-center gap-1 text-sm font-medium">
    {children}
  </a>
);

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "danger" | "warning" | "success";
  /** Chip con punto en lugar de texto plano (p. ej. "2 vencidas"). */
  chip?: boolean;
  href?: string;
}> = ({ label, value, hint, tone = "default", chip, href }) => {
  const inner = (
    <>
      <span className="eyebrow block">{label}</span>
      <span className="mt-3 block text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-theme-text">
        {value}
      </span>
      {hint && (
        <span className="mt-3 block min-h-6">
          {chip && tone !== "default" ? (
            <Chip tone={tone}>{hint}</Chip>
          ) : (
            <span className="block text-xs sm:text-sm text-theme-text-muted truncate">{hint}</span>
          )}
        </span>
      )}
    </>
  );
  return href ? (
    <a
      href={href}
      className={`${cardCls} p-5 sm:p-6 block no-underline text-inherit transition-colors [@media(hover:hover)]:hover:border-theme-accent`}
    >
      {inner}
    </a>
  ) : (
    <div className={`${cardCls} p-5 sm:p-6`}>{inner}</div>
  );
};

const chipTone = {
  neutral: "bg-theme-soft text-theme-text-muted",
  accent: "bg-theme-info-light text-theme-accent",
  success: "bg-theme-success-light text-theme-success",
  warning: "bg-theme-warning-light text-theme-warning",
  danger: "bg-theme-danger-light text-theme-danger",
} as const;

/** Chip de estado: fondo tintado, punto y radio 8 (sin cápsulas). */
export const Chip: React.FC<{
  tone?: keyof typeof chipTone;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = "neutral", children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${chipTone[tone]} ${className}`}
  >
    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
    {children}
  </span>
);

/** Barra de progreso simple */
export const ProgressBar: React.FC<{ value: number; tone?: "ok" | "warning" | "danger"; label?: string }> = ({ value, tone = "ok", label }) => (
  <div className="h-1.5 w-full rounded-full bg-theme-border overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <div
      className={`h-full rounded-full ${tone === "danger" ? "bg-theme-danger" : tone === "warning" ? "bg-theme-warning" : "bg-theme-accent"}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
