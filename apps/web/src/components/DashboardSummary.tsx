import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import type { Subject, Task } from '@dashboard/shared-types';

export const DashboardSummary: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [atRisk, setAtRisk] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([
        api.getAtRiskSubjects(token),
        api.getTasks(token)
      ])
        .then(([riskData, taskData]) => {
          setAtRisk(riskData);
          setTasks(taskData);
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (authLoading || loading) return <div className="oat-spinner">Cargando...</div>;
  if (!user) return null;

  return (
    <div className="oat-dashboard-grid">
      <h1 style={{ gridColumn: '1/-1', marginBottom: '2rem' }}>Resumen Semanal</h1>
      
      <section className="oat-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1.5rem' }}>⚠️ Materias en Riesgo</h2>
        {atRisk.length === 0 ? (
          <p className="oat-text-secondary">¡Excelente! Todas tus materias están bajo control.</p>
        ) : (
          <ul className="oat-list" style={{ listStyle: 'none', padding: 0 }}>
            {atRisk.map(s => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                <span className="oat-text-bold">{s.name}</span>
                <StatusBadge variant="danger">Riesgo Alto</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="oat-card">
        <h2 style={{ marginBottom: '1.5rem' }}>📅 Próximas Tareas</h2>
        {tasks.length === 0 ? (
          <p className="oat-text-secondary">No tienes tareas para esta semana.</p>
        ) : (
          <ul className="oat-list" style={{ listStyle: 'none', padding: 0 }}>
            {tasks.slice(0, 5).map(t => (
              <li key={t.id} style={{ padding: '1rem 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong className="oat-text-primary">{t.title}</strong>
                  <StatusBadge variant={t.status === 'completed' ? 'success' : 'warning'}>
                    {t.status}
                  </StatusBadge>
                </div>
                <small className="oat-text-secondary">Vence: {t.due_date}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
