import React from "react";
import { useIcalEvents } from "../hooks/useDashboardQueries";
import { IcalEvent } from "@dashboard/shared-types";

const formatDate = (date: Date) => {
  const str = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const IcalEventList: React.FC = () => {
  const { data: events, isPending, error } = useIcalEvents();

  if (isPending) {
    return (
      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm mt-4">
        <p className="text-theme-text-muted">Cargando eventos sincronizados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-card-bg border border-theme-danger rounded-xl p-6 shadow-sm mt-4">
        <p className="text-theme-danger">Error al cargar eventos: {error.message}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-8 shadow-sm mt-4 text-center">
        <p className="text-theme-text-muted">
          No hay eventos sincronizados pendientes. Configura tu URL de Schoology y sincroniza para
          comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <h2 className="text-xl font-bold m-0 text-theme-text">Próximos eventos</h2>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {events.map((e: IcalEvent) => (
          <div
            key={e.id}
            className="bg-theme-card-bg border border-theme-border rounded-xl p-4 shadow-sm"
          >
            <h3 className="font-bold m-0 mb-2 text-lg text-theme-text">{e.title}</h3>
            {e.description && (
              <p className="text-theme-text-muted text-sm m-0 mb-4 whitespace-pre-wrap">
                {e.description.length > 200
                  ? `${e.description.substring(0, 200)}...`
                  : e.description}
              </p>
            )}
            <div className="flex flex-col gap-2 items-start">
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-theme-primary underline"
                >
                  Ver en plataforma ↗
                </a>
              )}
              <div className="inline-block bg-theme-bg px-2 py-1 rounded text-xs text-theme-primary border border-theme-border">
                📅{" "}
                {formatDate(e.start_date instanceof Date ? e.start_date : new Date(e.start_date))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
