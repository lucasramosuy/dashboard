import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Subject, Task, Absence } from '@dashboard/shared-types';

export const AnalyticsDashboard: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (token) {
      try {
        const [subjData, taskData] = await Promise.all([
          api.getSubjects(token),
          api.getTasks(token)
        ]);
        setSubjects(subjData);
        setTasks(taskData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/login';
  }, [user, authLoading]);

  useEffect(() => { fetchData(); }, [token]);

  if (authLoading || loading) return <div className="oat-spinner">Generando analíticas...</div>;

  // Datos para Pie Chart (Cumplimiento de Tareas)
  const taskStatusData = [
    { name: 'Completadas', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'Pendientes', value: tasks.filter(t => t.status === 'pending').length, color: '#f59e0b' },
    { name: 'Atrasadas', value: tasks.filter(t => t.status === 'overdue').length, color: '#ef4444' }
  ];

  // Datos para Bar Chart (Asistencia por Materia - Semáforo)
  const attendanceData = subjects.map(s => ({
    name: s.name,
    total: s.total_classes,
    asistencia: 100 // Por ahora mock, se conectará con /absences en futuro
  }));

  return (
    <div className="oat-analytics-view">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0 }}>Analíticas Académicas</h1>
        <p style={{ color: '#666' }}>Resumen visual de tu progreso y asistencia.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Gráfico 1: Cumplimiento de Tareas */}
        <section className="oat-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>Distribución de Tareas</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {taskStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Gráfico 2: Asistencia por Materia (Semáforo) */}
        <section className="oat-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>Asistencia Semáforo (%)</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="asistencia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '1rem' }}>
            Un porcentaje inferior al 75% indica riesgo de quedar libre.
          </p>
        </section>
      </div>
      
      <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
        <button onClick={() => window.location.href = '/'} className="oat-btn oat-btn-outline">Volver al Dashboard</button>
      </div>
    </div>
  );
};
