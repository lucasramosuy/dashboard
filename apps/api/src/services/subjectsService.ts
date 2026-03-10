/**
 * Servicio de reglas académicas CFE.
 *
 * Según el reglamento del Consejo de Formación en Educación:
 * - UC semestrales = 15 semanas → se sugiere 15 clases
 * - UC anuales = 30 semanas → se sugiere 30 clases
 */

export type Track = "semestral" | "anual";

const CFE_RULES: Record<Track, { weeks: number; suggestedClasses: number }> = {
  semestral: { weeks: 15, suggestedClasses: 15 },
  anual: { weeks: 30, suggestedClasses: 30 },
};

export const subjectsService = {
  /**
   * Retorna las semanas y clases sugeridas según el trayecto.
   */
  getSuggestedDuration(track: Track) {
    return CFE_RULES[track];
  },

  /**
   * Retorna todas las opciones de trayecto con sus valores sugeridos.
   */
  getAllTracks() {
    return Object.entries(CFE_RULES).map(([key, value]) => ({
      track: key as Track,
      ...value,
    }));
  },

  /**
   * Calcula el porcentaje de asistencia dada la cantidad total de clases
   * y el valor acumulado de inasistencias.
   */
  calculateAttendancePercentage(totalClasses: number, absenceValue: number): number {
    if (totalClasses <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round(((totalClasses - absenceValue) / totalClasses) * 100)));
  },

  /**
   * Determina si el alumno está en riesgo de quedar libre.
   * Umbral CFE: 75% de asistencia mínima.
   */
  isAtRisk(totalClasses: number, absenceValue: number): boolean {
    return this.calculateAttendancePercentage(totalClasses, absenceValue) < 75;
  },
};
