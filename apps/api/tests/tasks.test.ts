import { describe, it, expect } from 'vitest';
import { app } from '../src/server';
import type { Task } from '@dashboard/shared-types';

describe('Tasks API Tests', () => {
  let taskId: string;
  const dummySubjectId = 'sub-123';

  it('POST /api/tasks should create a new task', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: dummySubjectId,
        title: 'Estudiar para parcial',
        due_date: '2024-03-15',
        description: 'Capítulos 1 al 5'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as Task;
    expect(body.title).toBe('Estudiar para parcial');
    expect(body.subject_id).toBe(dummySubjectId);
    expect(body.status).toBe('pending');
    taskId = body.id;
  });

  it('GET /api/tasks should return all tasks', async () => {
    const res = await app.request('/api/tasks');
    expect(res.status).toBe(200);
    const body = await res.json() as Task[];
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/tasks?subject_id=... should filter tasks', async () => {
    const res = await app.request(`/api/tasks?subject_id=${dummySubjectId}`);
    expect(res.status).toBe(200);
    const body = await res.json() as Task[];
    expect(body.every(t => t.subject_id === dummySubjectId)).toBe(true);
  });

  it('PUT /api/tasks/:id should update task status', async () => {
    const res = await app.request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as Task;
    expect(body.status).toBe('completed');
  });

  it('DELETE /api/tasks/:id should delete the task', async () => {
    const res = await app.request(`/api/tasks/${taskId}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/tasks/${taskId}`);
    expect(checkRes.status).toBe(404);
  });
});
