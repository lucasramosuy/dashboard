import React, { useState } from 'react';
import type { Task, Subject } from '@dashboard/shared-types';

interface Props {
  initialData?: Task;
  subjects: Subject[];
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const TaskForm: React.FC<Props> = ({ initialData, subjects, onSubmit, onCancel, loading }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || subjects[0]?.id || '');
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<Task['status']>(initialData?.status || 'pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, subject_id: subjectId, due_date: dueDate, description, status });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="title">Título de la Tarea</label>
        <input id="title" type="text" className="oat-input" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="subject">Materia</label>
        <select id="subject" className="oat-input" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="due">Fecha de Entrega</label>
        <input id="due" type="date" className="oat-input" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="status">Estado</label>
        <select id="status" className="oat-input" value={status} onChange={e => setStatus(e.target.value as any)}>
          <option value="pending">Pendiente</option>
          <option value="completed">Completada</option>
          <option value="overdue">Atrasada</option>
        </select>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="desc">Descripción</label>
        <textarea id="desc" className="oat-input" value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: '80px' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button type="button" onClick={onCancel} className="oat-btn oat-btn-outline" disabled={loading}>Cancelar</button>
        <button type="submit" className="oat-btn oat-btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};
