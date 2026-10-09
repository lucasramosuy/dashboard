import { useEffect, useState } from "react";
import { url } from "../../lib/utils";

interface Activity { id: string; action: string; entity: string; label: string; created_at: string }
interface Summary { week_start: string; generated_at: string; activity_count: number; subjects: {
  id: string; name: string; level: string; reasons: string[]; attendance: number; average: number | null; pending: number;
}[] }
const verbs: Record<string, string> = { created: "Creaste", updated: "Editaste", deleted: "Borraste" };
const entities: Record<string, string> = { task: "tarea", subject: "UC", absence: "falta", journal: "práctica" };
const levels: Record<string, string> = { ok: "Al día", attention: "Atención", risk: "En riesgo" };
const time = (value: string) => new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const card = "rounded-2xl border border-theme-border bg-theme-surface p-5";

export function ActivityPanel() {
  const [period, setPeriod] = useState<"today" | "week">("week");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [more, setMore] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    Promise.all(["/api/activity?period=" + period, "/api/weekly-summary"].map(async (path) => {
      const r = await fetch(url(path), { credentials: "include", signal: controller.signal });
      if (!r.ok) throw new Error("Read failed");
      return r.json();
    })).then(([feed, weekly]) => {
      setActivity(feed.items); setMore(feed.has_more); setSummary(weekly.summary); setLoading(false);
    }).catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } });
    return () => controller.abort();
  }, [period, retry]);
  return <section className="mt-8 grid gap-5 lg:grid-cols-2" aria-label="Actividad y resumen semanal">
    <div className={card}>
      <h2 className="text-lg font-semibold mb-4">Actividad</h2>
      <div className="flex gap-2 mb-4" role="group" aria-label="Período de actividad">
        {(["today", "week"] as const).map((p) => <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)} className={`min-h-11 px-4 rounded-lg border border-theme-border ${period === p ? "bg-theme-text text-theme-bg" : ""}`}>{p === "today" ? "Hoy" : "Esta semana"}</button>)}
      </div>
      {loading ? <p role="status">Cargando actividad...</p> : error ? <div role="alert"><p>No se pudo cargar la actividad.</p><button type="button" className="min-h-11 underline" onClick={() => setRetry((n) => n + 1)}>Reintentar</button></div> : <>
        {!activity.length ? <p className="text-theme-text-muted">Sin actividad en este período. El registro comienza desde la actualización del feed.</p> : <ol className="space-y-4">{activity.map((item) => <li key={item.id} className="break-words"><p>{verbs[item.action]} {entities[item.entity]}: {item.label}</p><time className="text-xs text-theme-text-muted" dateTime={item.created_at}>{time(item.created_at)}</time></li>)}</ol>}
        {more && <p className="text-sm text-theme-text-muted mt-4">Se muestran las 50 actividades más recientes.</p>}
      </>}
    </div>
    <div className={card}>
      <h2 className="text-lg font-semibold mb-2">Resumen semanal</h2>
      <p className="text-sm text-theme-text-muted mb-4">Se genera solo los domingos a las 20:00 de Uruguay, dentro del panel.</p>
      {loading ? <p role="status">Cargando resumen...</p> : error ? <p>No se pudo cargar el resumen.</p> : !summary ? <p className="text-theme-text-muted">Todavía no hay resumen generado. Aparecerá tras el próximo domingo a las 20:00 una vez desplegado.</p> : <>
        <p className="text-sm mb-4">Semana del {summary.week_start} · Generado {time(summary.generated_at)} · {summary.activity_count} cambios registrados</p>
        {!summary.subjects.length ? <p>Sin UC cargadas al generar este resumen.</p> : <ul className="space-y-4">{summary.subjects.map((s) => <li key={s.id} className="break-words"><h3 className="font-semibold">{s.name} · {levels[s.level]}</h3><p className="text-sm">Asistencia {s.attendance}% · Promedio {s.average ?? "sin notas"} · {s.pending} pendientes</p>{s.reasons.map((reason, i) => <p className="text-sm text-theme-text-muted" key={i}>{reason}</p>)}</li>)}</ul>}
      </>}
    </div>
  </section>;
}
