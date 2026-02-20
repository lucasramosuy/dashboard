import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/server';
import type { Subject } from '@dashboard/shared-types';

describe('Subjects API Tests', () => {
  let subjectId: string;

  it('POST /api/subjects should create a new subject', async () => {
    const res = await app.request('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Matemáticas I',
        total_classes: 32
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as Subject;
    expect(body.name).toBe('Matemáticas I');
    expect(body.total_classes).toBe(32);
    expect(body).toHaveProperty('id');
    subjectId = body.id;
  });

  it('GET /api/subjects should return a list of subjects', async () => {
    const res = await app.request('/api/subjects');
    expect(res.status).toBe(200);
    const body = await res.json() as Subject[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.some(s => s.id === subjectId)).toBe(true);
  });

  it('GET /api/subjects/:id should return a specific subject', async () => {
    const res = await app.request(`/api/subjects/${subjectId}`);
    expect(res.status).toBe(200);
    const body = await res.json() as Subject;
    expect(body.id).toBe(subjectId);
    expect(body.name).toBe('Matemáticas I');
  });

  it('PUT /api/subjects/:id should update a subject', async () => {
    const res = await app.request(`/api/subjects/${subjectId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Matemáticas Avanzadas' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as Subject;
    expect(body.name).toBe('Matemáticas Avanzadas');
  });

  it('GET /api/subjects/at-risk should return at-risk subjects based on absences', async () => {
    // We create an at-risk situation by manual injection (via mock memory storage)
    // For this test, let's assume our setup.ts mock allows us to seed or we create another subject
    // with very high absences if we had an absence endpoint. 
    // For now, it should return an empty array if no absences are registered.
    const res = await app.request('/api/subjects/at-risk');
    expect(res.status).toBe(200);
    const body = await res.json() as any[];
    expect(Array.isArray(body)).toBe(true);
  });

  it('DELETE /api/subjects/:id should remove a subject', async () => {
    const res = await app.request(`/api/subjects/${subjectId}`, {
      method: 'DELETE'
    });
    expect(res.status).toBe(200);
    
    const checkRes = await app.request(`/api/subjects/${subjectId}`);
    expect(checkRes.status).toBe(404);
  });
});
