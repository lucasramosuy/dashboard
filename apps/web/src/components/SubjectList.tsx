import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { SubjectForm } from "./SubjectForm";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import type { Subject } from "@dashboard/shared-types";

export const SubjectList: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const fetchSubjects = async () => {
    if (!token) return;
    try {
      const data = await api.getSubjects(token);
      setSubjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    if (token) fetchSubjects();
  }, [token]);

  const handleSubmit = async (data: Partial<Subject>) => {
    if (!token) return;
    setSubmitting(true);
    try {
      if (editingSubject) {
        await api.updateSubject(token, editingSubject.id, data);
      } else {
        await api.createSubject(token, data);
      }
      setModalOpen(false);
      setEditingSubject(undefined);
      await fetchSubjects();
      showToast(`Materia ${editingSubject ? "actualizada" : "creada"} correctamente`);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteSubject(token, id);
      setDeletingId(null);
      await fetchSubjects();
      showToast("Materia eliminada");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="oat-spinner-wrapper">
        <div className="oat-spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <>
      <div className="oat-card">
        <header className="subjects-header">
          <h1 style={{ margin: 0 }}>Materias</h1>
          <button
            onClick={() => {
              setEditingSubject(undefined);
              setModalOpen(true);
            }}
            className="oat-btn oat-btn-primary"
          >
            + Nueva
          </button>
        </header>

        {subjects.length === 0 ? (
          <p className="oat-text-secondary">No hay materias registradas aún.</p>
        ) : (
          <div className="table-responsive">
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Clases Totales</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="subjects-row">
                    <td>
                      <a href={`/subjects/${s.id}`} className="subjects-link">
                        {s.name}
                      </a>
                    </td>
                    <td>{s.total_classes}</td>
                    <td>
                      <div className="subjects-actions">
                        <button
                          onClick={() => {
                            setEditingSubject(s);
                            setModalOpen(true);
                          }}
                          className="oat-btn oat-btn-outline"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Editar
                        </button>
                        {deletingId === s.id ? (
                          <>
                            <span style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}>
                              ¿Confirmar?
                            </span>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="oat-btn oat-btn-outline"
                              style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="oat-btn oat-btn-outline"
                              style={{ fontSize: "0.75rem" }}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(s.id)}
                            className="oat-btn oat-btn-outline"
                            style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingSubject ? "Editar Materia" : "Nueva Materia"}
        >
          <SubjectForm
            initialData={editingSubject}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            loading={submitting}
          />
        </Modal>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
