import { describe, it, expect } from 'vitest';
import { app } from '../src/server';
import type { PracticeJournal } from '@dashboard/shared-types';

describe('Practice Journals API Tests', () => {
  let journalId: string;
  const dummySubjectId = 'sub-456';

  it('POST /api/practice-journals should create a new journal entry', async () => {
    const res = await app.request('/api/practice-journals', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: dummySubjectId,
        date: '2024-03-10',
        content: 'Hoy practicamos escalas de Do mayor en el piano.'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as PracticeJournal;
    expect(body.content).toContain('escalas de Do mayor');
    expect(body.subject_id).toBe(dummySubjectId);
    journalId = body.id;
  });

  it('GET /api/practice-journals should return all journals', async () => {
    const res = await app.request('/api/practice-journals');
    expect(res.status).toBe(200);
    const body = await res.json() as PracticeJournal[];
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/practice-journals?subject_id=... should filter journals', async () => {
    const res = await app.request(`/api/practice-journals?subject_id=${dummySubjectId}`);
    expect(res.status).toBe(200);
    const body = await res.json() as PracticeJournal[];
    expect(body.every(j => j.subject_id === dummySubjectId)).toBe(true);
  });

  it('PUT /api/practice-journals/:id should update content', async () => {
    const res = await app.request(`/api/practice-journals/${journalId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: 'Contenido actualizado: Escalas y arpegios.' }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as PracticeJournal;
    expect(body.content).toBe('Contenido actualizado: Escalas y arpegios.');
  });

  it('DELETE /api/practice-journals/:id should delete the entry', async () => {
    const res = await app.request(`/api/practice-journals/${journalId}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    const checkRes = await app.request(`/api/practice-journals/${journalId}`);
    expect(checkRes.status).toBe(404);
  });
});
