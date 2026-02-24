import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { SubjectForm } from "./SubjectForm";
import type { Subject } from "@dashboard/shared-types";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";

export const SubjectList: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(
    undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchSubjects = async () => {
    if (token) {
      try {
        const data = await api.getSubjects(token);
        setSubjects(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/login";
  }, [user, authLoading]);

  useEffect(() => {
    fetchSubjects();
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
      fetchSubjects();
      showToast(
        `Materia ${editingSubject ? "actualizada" : "creada"} correctamente`,
      );
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("¿Estás seguro de eliminar esta materia?")) return;
    try {
      await api.deleteSubject(token, id);
      fetchSubjects();
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
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h1 style={{ margin: 0 }}>Mis Materias</h1>
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

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Nombre</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>
                Clases Totales
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem" }}>
                  <a
                    href={`/subjects/${s.id}`}
                    style={{
                      color: "var(--oat-primary)",
                      fontWeight: "bold",
                      textDecoration: "none",
                    }}
                  >
                    {s.name}
                  </a>
                </td>
                <td style={{ padding: "0.5rem" }}>{s.total_classes}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>
                  <button
                    onClick={() => {
                      setEditingSubject(s);
                      setModalOpen(true);
                    }}
                    className="oat-btn oat-btn-outline"
                    style={{ fontSize: "0.75rem", marginRight: "0.5rem" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="oat-btn oat-btn-outline"
                    style={{ fontSize: "0.75rem", color: "red" }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};
