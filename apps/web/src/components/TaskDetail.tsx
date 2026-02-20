import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import type { Task } from '@dashboard/shared-types';

interface Props {
  id: string;
}

export const TaskDetail: React.FC<Props> = ({ id }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Protección de acceso: si no hay sesión, redirigir a login.
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (token && id) {
      setLoading(true);
      api.getTask(token, id)
        .then(setTask)
        .catch(err => {
          console.error(err);
          setError(err.message || 'No se pudo cargar la tarea.');
        })
        .finally(() => setLoading(false));
    }
  }, [token, id]);

  const advanceStatus = async () => {
    if (!token || !task) return;
    const next: Record<Task['status'], Task['status']> = {
      pending: 'completed',
      completed: 'pending',
      overdue: 'pending',
    };
    try {
      const updated = await api.updateTaskStatus(token, task.id, next[task.status]);
      setTask(updated);
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  if (authLoading || loading) return <div className="oat-spinner">Cargando tarea...</div>;
  if (error) return <div className="oat-text--danger">Error: {error}</div>;
  if (!task) return <div className="oat-text--secondary">Tarea no encontrada.</div>;

  return (
    <div className="oat-detail-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="oat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--oat-border-color)', paddingBottom: '1rem' }}>
        <h1 className="oat-title">{task.title}</h1>
        <StatusBadge variant={task.status === 'completed' ? 'success' : task.status === 'overdue' ? 'danger' : 'warning'}>
          {task.status.toUpperCase()}
        </StatusBadge>
      </header>

      <section className="oat-card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--oat-border-color)', paddingBottom: '1.5rem' }}>
          <div>
            <h4 className="oat-text--secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Fecha de Vencimiento</h4>
            <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{task.due_date || 'Sin fecha'}</p>
          </div>
          <div>
            <h4 className="oat-text--secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ID de Materia</h4>
            <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{task.subject_id}</p>
          </div>
        </div>

        <div>
          <h4 className="oat-text--secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Descripción / Notas</h4>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--oat-text-secondary)', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
            {task.description || 'Esta tarea no contiene una descripción detallada.'}
          </p>
        </div>
      </section>

      <footer style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--oat-border-color)', paddingTop: '2rem' }}>
        <button onClick={advanceStatus} className="oat-btn oat-btn-primary">
          Cambiar a {task.status === 'completed' ? 'Pendiente' : 'Completado'}
        </button>
        <button onClick={() => window.location.href = '/tasks'} className="oat-btn oat-btn-outline">← Volver a Tareas</button>
      </footer>
    </div>
  );
};
