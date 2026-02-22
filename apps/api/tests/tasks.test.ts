import { describe, it, expect, beforeAll } from 'bun:test';
import { app } from '../src/server';
import type { Task, Subject } from '@dashboard/shared-types';

describe('Tasks API Tests', () => {
  let taskId: string;
  let subjectId: string;
  let token: string;

  beforeAll(async () => {
    // Login to get token
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'demo@example.com', password: 'demo123' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const auth = await loginRes.json() as any;
    token = auth.token;

    // Create a real subject for the foreign key constraint
    const subRes = await app.request('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Subject for Tasks', total_classes: 10 }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const sub = await subRes.json() as Subject;
    subjectId = sub.id;
  });

  it('POST /api/tasks should create a new task', async () => {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: subjectId,
        title: 'Estudiar para parcial',
        due_date: '2024-03-15T10:00:00Z',
        description: 'Capítulos 1 al 5'
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as Task;
    expect(body.title).toBe('Estudiar para parcial');
    expect(body.subject_id).toBe(subjectId);
    expect(body.status).toBe('todo'); // Check default value from DB
    taskId = body.id;
  });

  it('GET /api/tasks should return all tasks of user', async () => {
    const res = await app.request('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Task[];
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/tasks?subject_id=... should filter tasks', async () => {
    const res = await app.request(`/api/tasks?subject_id=${subjectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Task[];
    expect(body.every(t => t.subject_id === subjectId)).toBe(true);
  });

  it('PATCH /api/tasks/:id/status should update task status', async () => {
    const res = await app.request(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'done' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as Task;
    expect(body.status).toBe('done');
  });

  it('DELETE /api/tasks/:id should delete the task', async () => {
    const res = await app.request(`/api/tasks/${taskId}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(checkRes.status).toBe(404);
  });
});
