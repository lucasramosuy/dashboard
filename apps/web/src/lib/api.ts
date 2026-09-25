import type { Subject, Task, Absence, PracticeJournal, IcalEvent } from "@dashboard/shared-types";
import { authClient } from "./auth-client";
import { url } from "./utils";
import * as Sentry from "@sentry/astro";
import { captchaHeaders } from "./captcha";

/**
 * Cliente de API para el dashboard académico.
 *
 * La API vive en el mismo origen que la web, bajo /dashboard/api
 * (el Worker la despacha; ver src/worker.ts).
 */
const API_BASE = url("/api");

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  lastSeen: Date | null;
  hasPassword: boolean;
  legacyHash: boolean;
  admin: boolean;
  self: boolean;
};

export type AdminInvite = { id: string; code: string; createdAt: Date };

/**
 * Helper para convertir strings de fecha a objetos Date en respuestas JSON
 * Soporta formato ISO completo (2026-02-23T...) y formato corto (2026-02-23)
 */
function reviveDates(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }

  const revived: any = { ...obj };
  for (const key in revived) {
    const val = revived[key];

    // Regex inclusiva para YYYY-MM-DD (corto) o YYYY-MM-DDTHH... (ISO)
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(val)) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        revived[key] = date;
      }
    } else if (typeof val === "object") {
      revived[key] = reviveDates(val);
    }
  }
  return revived;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Sesión expirada: redirigir al login con contexto
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = url("/login?reason=session_expired");
      // TS-3: Typed as never — the redirect stops execution
      return new Promise<never>(() => {});
    }

    let errorMessage = `Error API (${response.status}): ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Si no se puede parsear el JSON de error, mantener el mensaje original
    }
    const error = new Error(errorMessage);
    Sentry.captureException(error, {
      extra: {
        status: response.status,
        url: response.url,
      },
    });
    throw error;
  }
  const data = await response.json();
  return reviveDates(data) as T;
}

/** Helper para llamadas fetch con credentials automáticas */
function apiFetch(url: string, init?: Record<string, any>): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: "include",
  });
}

export const api = {
  async login(email: string, password: string): Promise<void> {
    const { error } = await authClient.signIn.email({
      email,
      password,
      fetchOptions: { headers: captchaHeaders() },
    });
    if (error) {
      throw new Error(error.message || "Error al iniciar sesión");
    }
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
  }): Promise<void> {
    const response = await apiFetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...captchaHeaders() },
      body: JSON.stringify(data),
    });
    await handleResponse(response);
  },

  async getCfeRules(): Promise<{ track: string; weeks: number; suggestedClasses: number }[]> {
    const response = await apiFetch(`${API_BASE}/subjects/cfe-rules`);
    return handleResponse(response);
  },

  async getSubjects(): Promise<Subject[]> {
    const response = await apiFetch(`${API_BASE}/subjects`);
    return handleResponse<Subject[]>(response);
  },

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const response = await apiFetch(`${API_BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Subject>(response);
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const response = await apiFetch(`${API_BASE}/subjects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Subject>(response);
  },

  async deleteSubject(id: string): Promise<void> {
    const response = await apiFetch(`${API_BASE}/subjects/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("No se pudo eliminar la UC");
  },

  async getAtRiskSubjects(): Promise<Subject[]> {
    const response = await apiFetch(`${API_BASE}/subjects/at-risk`);
    return handleResponse<Subject[]>(response);
  },

  async getTasks(subjectId?: string, includePlanner = false): Promise<Task[]> {
    let url = `${API_BASE}/tasks`;
    const params: string[] = [];
    if (subjectId) params.push(`subject_id=${subjectId}`);
    if (includePlanner) params.push(`include_planner=true`);

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await apiFetch(url);
    return handleResponse<Task[]>(response);
  },

  async getWeeklyTasks(start: string, end: string): Promise<Record<string, Task[]>> {
    const response = await apiFetch(`${API_BASE}/tasks/weekly?start=${start}&end=${end}`);
    return handleResponse<Record<string, Task[]>>(response);
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const response = await apiFetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(response);
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await apiFetch(`${API_BASE}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(response);
  },

  async deleteTask(id: string): Promise<void> {
    const response = await apiFetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("No se pudo eliminar la tarea");
  },

  async getJournals(): Promise<PracticeJournal[]> {
    const response = await apiFetch(`${API_BASE}/practice-journals`);
    return handleResponse<PracticeJournal[]>(response);
  },

  async getJournalByDate(date: string): Promise<PracticeJournal | null> {
    // PERF-2: Use ?date= query param to fetch only the needed day
    const target = date.split("T")[0];
    const response = await apiFetch(`${API_BASE}/practice-journals?date=${target}`);
    const journals = await handleResponse<PracticeJournal[]>(response);
    return journals[0] ?? null;
  },

  async upsertJournal(data: Partial<PracticeJournal>): Promise<PracticeJournal> {
    const method = data.id ? "PUT" : "POST";
    const url = data.id
      ? `${API_BASE}/practice-journals/${data.id}`
      : `${API_BASE}/practice-journals`;
    const response = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<PracticeJournal>(response);
  },

  async getSubject(id: string): Promise<Subject> {
    const response = await apiFetch(`${API_BASE}/subjects/${id}`);
    return handleResponse<Subject>(response);
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiFetch(`${API_BASE}/tasks/${id}`);
    return handleResponse<Task>(response);
  },

  async getAbsences(subjectId: string): Promise<Absence[]> {
    const response = await apiFetch(`${API_BASE}/absences?subject_id=${subjectId}`);
    return handleResponse<Absence[]>(response);
  },

  async createAbsence(data: Partial<Absence>): Promise<Absence> {
    const response = await apiFetch(`${API_BASE}/absences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Absence>(response);
  },

  async deleteAbsence(id: string): Promise<void> {
    const response = await apiFetch(`${API_BASE}/absences/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("No se pudo eliminar la inasistencia");
  },

  async getAllAbsences(): Promise<Absence[]> {
    const response = await apiFetch(`${API_BASE}/absences`);
    return handleResponse<Absence[]>(response);
  },

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<Task> {
    const response = await apiFetch(`${API_BASE}/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Task>(response);
  },

  // --- ICAL INTEGRATION ---
  async updateIcalConfig(ical_url: string): Promise<void> {
    const response = await apiFetch(`${API_BASE}/ical/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ical_url }),
    });
    await handleResponse(response);
  },

  async syncIcal(): Promise<{ success: boolean; syncedCount: number }> {
    const response = await apiFetch(`${API_BASE}/ical/sync`, {
      method: "POST",
    });
    return handleResponse(response);
  },

  async getIcalEvents(): Promise<IcalEvent[]> {
    const response = await apiFetch(`${API_BASE}/ical/events`);
    return handleResponse<IcalEvent[]>(response);
  },

  // --- Admin (solo ADMIN_EMAILS) ---
  async adminMe(): Promise<{ admin: boolean }> {
    const response = await apiFetch(`${API_BASE}/admin/me`);
    return handleResponse(response);
  },

  async adminUsers(): Promise<AdminUser[]> {
    const response = await apiFetch(`${API_BASE}/admin/users`);
    return handleResponse<AdminUser[]>(response);
  },

  async adminResetPassword(userId: string): Promise<{ password: string }> {
    const response = await apiFetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
      method: "POST",
    });
    return handleResponse(response);
  },

  async adminInvites(): Promise<AdminInvite[]> {
    const response = await apiFetch(`${API_BASE}/admin/invites`);
    return handleResponse<AdminInvite[]>(response);
  },

  async adminCreateInvite(): Promise<AdminInvite> {
    const response = await apiFetch(`${API_BASE}/admin/invites`, { method: "POST" });
    return handleResponse<AdminInvite>(response);
  },

  async adminDeleteInvite(id: string): Promise<void> {
    const response = await apiFetch(`${API_BASE}/admin/invites/${id}`, { method: "DELETE" });
    await handleResponse(response);
  },
};
