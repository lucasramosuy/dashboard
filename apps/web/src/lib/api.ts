import type { User, Subject, Task, Absence, PracticeJournal } from '@dashboard/shared-types';

/**
 * Cliente de API para el dashboard académico.
 *
 * En desarrollo, PUBLIC_API_BASE será http://localhost:8787/api
 * En producción, el valor será /api (relativo al dominio de despliegue).
 */
const API_BASE = import.meta.env.PUBLIC_API_BASE || 'http://localhost:8787/api';

/**
 * Helper para convertir strings ISO a objetos Date en respuestas JSON
 */
function reviveDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }

  const revived: any = { ...obj };
  for (const key in revived) {
    const val = revived[key];
    // Detectar campos cronológicos por nombre o formato
    if (typeof val === 'string' && (key === 'date' || key === 'due_date' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val))) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        revived[key] = date;
      }
    } else if (typeof val === 'object') {
      revived[key] = reviveDates(val);
    }
  }
  return revived;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Error API (${response.status}): ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // No JSON body
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();
  return reviveDates(data) as T;
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ token: string; user: User }>(response);
  },

  async getMe(token: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<User>(response);
  },

  async getSubjects(token: string): Promise<Subject[]> {
    const response = await fetch(`${API_BASE}/subjects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<Subject[]>(response);
  },

  async createSubject(token: string, data: Partial<Subject>): Promise<Subject> {
    const response = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse<Subject>(response);
  },

  async updateSubject(token: string, id: string, data: Partial<Subject>): Promise<Subject> {
    const response = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse<Subject>(response);
  },

  async deleteSubject(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('No se pudo eliminar la materia');
  },

  async getAtRiskSubjects(token: string): Promise<Subject[]> {
    const response = await fetch(`${API_BASE}/subjects/at-risk`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<Subject[]>(response);
  },

  async getTasks(token: string, subjectId?: string): Promise<Task[]> {
    const url = subjectId ? `${API_BASE}/tasks?subject_id=${subjectId}` : `${API_BASE}/tasks`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<Task[]>(response);
  },

  async createTask(token: string, data: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(response);
  },

  async updateTask(token: string, id: string, data: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(response);
  },

  async deleteTask(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('No se pudo eliminar la tarea');
  },

  async getJournals(token: string): Promise<PracticeJournal[]> {
    const response = await fetch(`${API_BASE}/practice-journals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<PracticeJournal[]>(response);
  },

  async getJournalByDate(token: string, date: string): Promise<PracticeJournal | null> {
    const response = await fetch(`${API_BASE}/practice-journals?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const journals = await handleResponse<PracticeJournal[]>(response);
    return journals.length > 0 ? journals[0] : null;
  },

  async upsertJournal(token: string, data: Partial<PracticeJournal>): Promise<PracticeJournal> {
    const method = data.id ? 'PATCH' : 'POST';
    const url = data.id ? `${API_BASE}/practice-journals/${data.id}` : `${API_BASE}/practice-journals`;
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return handleResponse<PracticeJournal>(response);
  },

  async getSubject(token: string, id: string): Promise<Subject> {
    const response = await fetch(`${API_BASE}/subjects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<Subject>(response);
  },

  async getTask(token: string, id: string): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<Task>(response);
  },

  async getAbsences(token: string, subjectId: string): Promise<Absence[]> {
    const response = await fetch(`${API_BASE}/absences?subject_id=${subjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<Absence[]>(response);
  },

  async updateTaskStatus(token: string, taskId: string, status: Task['status']): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Task>(response);
  },
};
