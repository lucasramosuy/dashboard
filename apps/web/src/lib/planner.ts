/** Prepara una fecha de agenda sin componer dos veces la hora. */
export function preparePlannerMove(id: string, dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("La fecha debe tener formato YYYY-MM-DD.");
  }
  const dueDate = new Date(`${dateKey}T12:00:00Z`);
  if (!Number.isFinite(dueDate.getTime()) || dueDate.toISOString().slice(0, 10) !== dateKey) {
    throw new Error("La fecha no existe.");
  }
  return { id, date: dateKey, dueDate };
}
