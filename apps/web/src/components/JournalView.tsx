import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { Subject, PracticeJournal } from '@dashboard/shared-types';

export const JournalView: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentDate, setCurrentDate] = useState(new Error().toISOString().split('T')[0]);
  const [journal, setJournal] = useState<Partial<PracticeJournal>>({ content: '', subject_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (token) {
      setLoading(true);
      try {
        const [subjData, journalData] = await Promise.all([
          api.getSubjects(token),
          api.getJournalByDate(token, currentDate)
        ]);
        setSubjects(subjData);
        if (journalData) {
          setJournal(journalData);
        } else {
          setJournal({ content: '', subject_id: subjData[0]?.id || '', date: currentDate });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/login';
  }, [user, authLoading]);

  useEffect(() => { fetchData(); }, [token, currentDate]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const saved = await api.upsertJournal(token, { ...journal, date: currentDate });
      setJournal(saved);
      alert('Journal guardado correctamente');
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="oat-spinner">Cargando journal...</div>;

  return (
    <div className="oat-journal-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Journal de Prácticas</h1>
        <input 
          type="date" 
          value={currentDate} 
          onChange={e => setCurrentDate(e.target.value)} 
          className="oat-input" 
          style={{ width: 'auto' }}
        />
      </header>

      <section className="oat-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="subject">Materia Asociada</label>
          <select 
            id="subject" 
            className="oat-input" 
            value={journal.subject_id} 
            onChange={e => setJournal({ ...journal, subject_id: e.target.value })}
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="content">Reflexión del Día (Markdown)</label>
          <textarea 
            id="content" 
            className="oat-input" 
            value={journal.content} 
            onChange={e => setJournal({ ...journal, content: e.target.value })}
            style={{ minHeight: '300px', fontFamily: 'monospace', lineHeight: '1.6' }}
            placeholder="Hoy en la práctica aprendí que..."
          />
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={handleSave} 
            className="oat-btn oat-btn-primary" 
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Reflexión'}
          </button>
        </footer>
      </section>
      
      <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <small style={{ color: '#888' }}>Tip: Podés usar **negrita**, *itálica* y listas con guiones.</small>
      </div>
    </div>
  );
};
