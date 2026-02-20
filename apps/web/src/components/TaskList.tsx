import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Modal } from './Modal';
import { TaskForm } from './TaskForm';
import { StatusBadge } from './StatusBadge';
import type { Task, Subject } from '@dashboard/shared-types';

export const TaskList: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (token) {
      try {
        const [taskData, subjectData] = await Promise.all([
          api.getTasks(token),
          api.getSubjects(token)
        ]);
        setTasks(taskData);
        setSubjects(subjectData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/login';
  }, [user, authLoading]);

  useEffect(() => { fetchData(); }, [token]);

  const handleSubmit = async (data: Partial<Task>) => {
    if (!token) return;
    setSubmitting(true);
    try {
      if (editingTask) {
        await api.updateTask(token, editingTask.id, data);
      } else {
        await api.createTask(token, data);
      }
      setModalOpen(false);
      setEditingTask(undefined);
      fetchData();
      alert(`Tarea ${editingTask ? 'actualizada' : 'creada'} correctamente`);
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('¿Estás seguro de eliminar esta tarea?')) return;
    try {
      await api.deleteTask(token, id);
      fetchData();
      alert('Tarea eliminada');
    } catch (e: any) { alert(e.message); }
  };

  if (authLoading || loading) return <div className="oat-spinner">Cargando tareas...</div>;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Mis Tareas</h1>
        <button onClick={() => { setEditingTask(undefined); setModalOpen(true); }} className="oat-btn oat-btn-primary">+ Nueva</button>
      </header>
      
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {tasks.map(t => (
          <article key={t.id} className="oat-card">
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <a href={`/tasks/${t.id}`} style={{ fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>{t.title}</a>
              <StatusBadge variant={t.status === 'completed' ? 'success' : t.status === 'overdue' ? 'danger' : 'warning'}>
                {t.status}
              </StatusBadge>
            </header>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Vence: {t.due_date}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditingTask(t); setModalOpen(true); }} className="oat-btn oat-btn-outline" style={{ fontSize: '0.75rem' }}>Editar</button>
              <button onClick={() => handleDelete(t.id)} className="oat-btn oat-btn-outline" style={{ fontSize: '0.75rem', color: 'red' }}>Borrar</button>
            </div>
          </article>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}>
        <TaskForm initialData={editingTask} subjects={subjects} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} loading={submitting} />
      </Modal>
    </div>
  );
};
