import React from "react";
import { Button } from "./Button";
import { readState, type ReadState } from "../../lib/query-state";

export function QueryState({
  queries,
  loading,
  children,
  title = "No se pudo cargar esta pantalla",
}: {
  queries: ReadState[];
  loading: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}) {
  const state = readState(queries);
  const retry = () => queries.filter((q) => q.isError).forEach((q) => void q.refetch());
  if (state === "loading") return <>{loading}</>;
  const notice = (state === "error" || state === "stale") && (
    <section
      role="alert"
      className="mb-6 rounded-xl border border-theme-border bg-theme-card-bg p-5 flex flex-wrap items-center gap-4"
    >
      <div className="min-w-0 flex-1">
        <h2 className="m-0 text-base font-semibold text-theme-text">
          {state === "stale" ? "No se pudo actualizar" : title}
        </h2>
        <p className="m-0 mt-2 text-sm text-theme-text-muted">
          {state === "stale"
            ? "Seguís viendo los últimos datos cargados. Pueden estar desactualizados."
            : "No pudimos leer los datos. Esto no significa que tu cuenta esté vacía."}
        </p>
      </div>
      <Button variant="secondary" onClick={retry} isLoading={queries.some((q) => q.isFetching)}>
        Reintentar
      </Button>
    </section>
  );
  return (
    <>
      {notice}
      {state !== "error" && children}
    </>
  );
}
