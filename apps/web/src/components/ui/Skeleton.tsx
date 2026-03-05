import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text" | "bento";
}

export function Skeleton({ variant = "rectangular", className, ...props }: SkeletonProps) {
  const baseStyles = "animate-pulse bg-surface-tertiary dark:bg-surface-dark-tertiary";

  const variants = {
    rectangular: "rounded-card",
    circular: "rounded-full",
    text: "rounded h-4 w-full",
    bento: "rounded-bento",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      role="status"
      aria-label="Cargando contenido..."
      {...props}
    />
  );
}

// Subcomponentes específicos de módulo para simplificar el uso

export function MetricSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Skeleton variant="text" className="w-16 h-12 mb-2" />
      <Skeleton variant="text" className="w-24 h-3" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <Skeleton variant="text" className="w-1/2 h-5" />
      <Skeleton variant="circular" className="w-16 h-6 rounded-full" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-75 flex items-end justify-between pt-4 gap-2">
      {[40, 70, 45, 90, 65, 30].map((h, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          className="flex-1 rounded-sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ── Skeletons específicos de módulo ──

/** Simula una tabla con header y N filas */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
      {/* Header con título y botón */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton variant="text" className="w-48 h-7" />
        <Skeleton variant="rectangular" className="w-24 h-10 rounded-lg" />
      </div>
      {/* Cabecera de tabla */}
      <div className="flex gap-4 pb-3 border-b-2 border-theme-border mb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-3 flex-1" />
        ))}
      </div>
      {/* Filas */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-theme-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              variant="text"
              className={cn("h-4 flex-1", j === 0 && "max-w-200px")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Simula la página de detalle de una tarea */
export function DetailSkeleton() {
  return (
    <div className="max-w-800px mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-theme-border pb-4 gap-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
          <Skeleton variant="text" className="w-56 h-8" />
        </div>
        <Skeleton variant="rectangular" className="w-24 h-6 rounded-full" />
      </div>
      {/* Card con info */}
      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm mb-10">
        <div className="grid grid-cols-2 gap-8 mb-8 border-b border-theme-border pb-6">
          <div>
            <Skeleton variant="text" className="w-32 h-3 mb-3" />
            <Skeleton variant="text" className="w-40 h-6" />
          </div>
          <div>
            <Skeleton variant="text" className="w-20 h-3 mb-3" />
            <Skeleton variant="text" className="w-24 h-6" />
          </div>
        </div>
        <div>
          <Skeleton variant="text" className="w-28 h-3 mb-3" />
          <Skeleton variant="rectangular" className="w-full h-24 rounded-lg" />
        </div>
      </div>
      {/* Footer buttons */}
      <div className="flex gap-4 border-t border-theme-border pt-8">
        <Skeleton variant="rectangular" className="w-48 h-10 rounded-lg" />
        <Skeleton variant="rectangular" className="w-36 h-10 rounded-lg" />
      </div>
    </div>
  );
}

/** Simula la vista de detalle de una UC con métricas y tareas */
export function SubjectDetailSkeleton() {
  return (
    <div className="max-w-225 mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-theme-border pb-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
          <Skeleton variant="text" className="w-48 h-8" />
        </div>
        <Skeleton variant="rectangular" className="w-28 h-6 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métricas */}
        <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <Skeleton variant="text" className="w-28 h-6" />
            <Skeleton variant="rectangular" className="w-40 h-7 rounded-lg" />
          </div>
          <div className="text-center py-4">
            <Skeleton variant="text" className="w-20 h-14 mx-auto mb-2" />
            <Skeleton variant="text" className="w-32 h-4 mx-auto" />
          </div>
          <div className="border-t border-theme-border pt-4 space-y-3">
            <Skeleton variant="text" className="w-40 h-4" />
            <Skeleton variant="text" className="w-36 h-4" />
          </div>
        </div>
        {/* Lista de tareas */}
        <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
          <Skeleton variant="text" className="w-40 h-6 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between py-3 border-b border-theme-border last:border-0"
            >
              <Skeleton variant="text" className="w-1/2 h-4" />
              <Skeleton variant="rectangular" className="w-20 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Simula la grilla semanal del Planner */
export function PlannerSkeleton() {
  return (
    <div className="flex items-stretch gap-0" style={{ height: "calc(100vh - 120px)" }}>
      {/* Flecha izq */}
      <div className="w-9 flex items-center justify-center">
        <Skeleton variant="text" className="w-4 h-6" />
      </div>
      {/* Centro */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 py-2 mb-1">
          <Skeleton variant="rectangular" className="w-16 h-8 rounded-lg" />
        </div>
        {/* Grilla */}
        <div className="flex-1 grid grid-cols-7 border border-theme-border rounded-xl bg-theme-card-bg overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={cn("flex flex-col", i < 6 && "border-r border-theme-border")}>
              {/* Header del día */}
              <div className="p-3 border-b-2 border-theme-border text-center">
                <Skeleton variant="text" className="w-16 h-4 mx-auto mb-1" />
                <Skeleton variant="text" className="w-24 h-3 mx-auto" />
              </div>
              {/* Tareas */}
              <div className="flex-1 p-2 space-y-2">
                {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton variant="circular" className="w-4 h-4" />
                    <Skeleton variant="text" className="flex-1 h-3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Flecha der */}
      <div className="w-9 flex items-center justify-center">
        <Skeleton variant="text" className="w-4 h-6" />
      </div>
    </div>
  );
}

/** Simula la vista de analíticas con 2 gráficos */
export function AnalyticsSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <Skeleton variant="text" className="w-64 h-8 mb-2" />
        <Skeleton variant="text" className="w-80 h-4" />
      </div>
      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm"
          >
            <Skeleton variant="text" className="w-48 h-6 mx-auto mb-6" />
            <ChartSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
/** Simula el formulario de ajustes de perfil */
export function ProfileSkeleton() {
  return (
    <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <Skeleton variant="text" className="w-40 h-7 mb-2" />
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton variant="text" className="w-32 h-3 mb-2" />
          <Skeleton variant="rectangular" className="w-full h-10 rounded-lg" />
        </div>
        <div>
          <Skeleton variant="text" className="w-32 h-3 mb-2" />
          <Skeleton variant="rectangular" className="w-full h-10 rounded-lg" />
        </div>
        <Skeleton variant="rectangular" className="w-32 h-10 rounded-lg mt-2" />
      </div>
    </div>
  );
}
