import React from "react";
import { cn } from "@/lib/utils";
import { cardCls } from "./PageHeader";
import "../planner/PlannerBoard.css";
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text" | "bento";
}
export function Skeleton({ variant = "rectangular", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse motion-reduce:animate-none bg-theme-soft max-w-full",
        variant === "circular" ? "rounded-full" : "rounded-lg",
        variant === "text" && "h-4 w-full",
        className,
      )}
      {...props}
    />
  );
}
function Loading({
  children,
  label = "Cargando contenido",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div aria-busy="true" className="min-w-0">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
function Header() {
  return (
    <div className="mb-8 sm:mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="w-24 h-3 mb-3" />
        <Skeleton className="w-72 h-10" />
        <Skeleton className="w-48 h-4 mt-3" />
      </div>
      <Skeleton className="w-28 h-11" />
    </div>
  );
}
function Metrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${cardCls} p-5 sm:p-6`}>
          <Skeleton className="w-20 h-3" />
          <Skeleton className="w-24 h-8 mt-3" />
          <Skeleton className="w-28 h-4 mt-3" />
        </div>
      ))}
    </div>
  );
}
function Rows({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="py-4 border-t border-theme-border first:border-0 flex items-center gap-4"
        >
          <Skeleton className="w-6 h-6 shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="w-48 h-4" />
            <Skeleton className="w-32 h-3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function MetricSkeleton() {
  return <Skeleton className="w-24 h-8" />;
}
export function ListItemSkeleton() {
  return <Rows count={1} />;
}
export function ChartSkeleton() {
  return <Skeleton className="w-full h-64" />;
}
export function DashboardSkeleton() {
  return (
    <Loading label="Cargando resumen">
      <Header />
      <Metrics />
      <div className="grid lg:grid-cols-[1.45fr_1fr] gap-4 sm:gap-6 items-start">
        <div className={`${cardCls} p-5 sm:p-6`}>
          <Skeleton className="w-40 h-5 mb-5" />
          <Rows count={4} />
        </div>
        <div className="space-y-4 sm:space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className={`${cardCls} p-5 sm:p-6`}>
              <Skeleton className="w-40 h-5 mb-5" />
              <Rows count={2} />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Loading>
      <Header />
      <div className={`${cardCls} p-5 sm:p-6`}>
        <div className="flex flex-wrap gap-3 mb-5">
          <Skeleton className="w-48 h-11" />
          <Skeleton className="w-28 h-11" />
        </div>
        <div className="md:hidden">
          <Rows count={rows} />
        </div>
        <div className="hidden md:block">
          {Array.from({ length: rows + 1 }, (_, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-theme-border last:border-0">
              {Array.from({ length: cols }, (_, j) => (
                <Skeleton key={j} className="h-4 flex-1 min-w-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}
export function DetailSkeleton() {
  return (
    <Loading>
      <Header />
      <div className={`${cardCls} p-5 sm:p-6 max-w-3xl`}>
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          {[0, 1].map((i) => (
            <div key={i}>
              <Skeleton className="w-28 h-3 mb-3" />
              <Skeleton className="w-40 h-6" />
            </div>
          ))}
        </div>
        <Skeleton className="w-full h-24" />
      </div>
      <Skeleton className="w-44 h-11 mt-6" />
    </Loading>
  );
}
export function SubjectDetailSkeleton() {
  return (
    <Loading>
      <Header />
      <Metrics />
      <div className="grid lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className={`${cardCls} p-5 sm:p-6`}>
            <Skeleton className="w-40 h-5 mb-4" />
            <Rows />
          </div>
        ))}
      </div>
    </Loading>
  );
}
export function PlannerSkeleton() {
  return (
    <Loading label="Cargando agenda">
      <div className="planner-root">
        <div className="planner-center">
          <Header />
          <div className="planner-grid">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="planner-col">
                <div className="planner-col__header">
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-20 h-3 mt-2" />
                </div>
                <div className="planner-col__tasks">
                  <Skeleton className="w-full h-11" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Loading>
  );
}
export function AnalyticsSkeleton() {
  return (
    <Loading>
      <Header />
      <Metrics />
      <div className="grid lg:grid-cols-2 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${cardCls} p-5 sm:p-6 ${i === 2 ? "lg:col-span-2" : ""}`}>
            <Skeleton className="w-44 h-5 mb-5" />
            <ChartSkeleton />
          </div>
        ))}
      </div>
    </Loading>
  );
}
export function JournalSkeleton() {
  return (
    <Loading label="Cargando prácticas">
      <Header />
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className={`${cardCls} p-5 sm:p-6`}>
          <Skeleton className="w-32 h-5 mb-5" />
          <Skeleton className="w-full h-11 mb-4" />
          <Skeleton className="w-full h-56" />
          <Skeleton className="w-36 h-11 mt-5" />
        </div>
        <div className={`${cardCls} p-5 sm:p-6`}>
          <Rows />
        </div>
      </div>
    </Loading>
  );
}
export function ProfileSkeleton() {
  return (
    <Loading>
      <Header />
      <div className={`${cardCls} p-5 sm:p-6 space-y-5`}>
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="w-32 h-3 mb-2" />
            <Skeleton className="w-full h-11" />
          </div>
        ))}
        <Skeleton className="w-36 h-11" />
      </div>
    </Loading>
  );
}
export function SchoologySkeleton() {
  return <ProfileSkeleton />;
}
export function FeedbackSkeleton() {
  return <JournalSkeleton />;
}
