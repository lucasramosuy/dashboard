import { describe, it, expect, beforeAll } from 'bun:test';
import { app } from '../src/server';
import type { PracticeJournal, Subject } from '@dashboard/shared-types';

describe('Practice Journals API Tests', () => {
  let journalId: string;
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
      body: JSON.stringify({ name: 'Subject for Journals', total_classes: 5 }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const sub = await subRes.json() as Subject;
    subjectId = sub.id;
  });

  it('POST /api/practice-journals should create a new journal entry', async () => {
    const res = await app.request('/api/practice-journals', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: subjectId,
        date: new Date().toISOString(),
        content: 'Hoy practicamos escalas de Do mayor en el piano.'
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as PracticeJournal;
    expect(body.content).toContain('escalas de Do mayor');
    expect(body.subject_id).toBe(subjectId);
    journalId = body.id;
  });

  it('GET /api/practice-journals should return all journals of user', async () => {
    const res = await app.request('/api/practice-journals', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json() as PracticeJournal[];
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/practice-journals?subject_id=... should filter journals', async () => {
    const res = await app.request(`/api/practice-journals?subject_id=${subjectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json() as PracticeJournal[];
    expect(body.every(j => j.subject_id === subjectId)).toBe(true);
  });
});
