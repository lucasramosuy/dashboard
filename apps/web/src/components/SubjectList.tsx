import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./Modal";
import { SubjectForm } from "./SubjectForm";
import { Toast } from "./Toast";
import { useToast } from "../hooks/useToast";
import type { Subject } from "@dashboard/shared-types";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "../hooks/useDashboardQueries";

export const SubjectList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // React Query Hooks (Container-Presenter)
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined" && !authLoading && !user) {
      window.location.replace("/login");
    }
  }, [user, authLoading]);

  const handleSubmit = async (data: Partial<Subject>) => {
    if (editingSubject) {
      updateSubject.mutate(
        { id: editingSubject.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditingSubject(undefined);
            showToast("UC actualizada correctamente");
          },
          onError: (e: any) => showToast(e.message, "error"),
        },
      );
    } else {
      createSubject.mutate(data, {
        onSuccess: () => {
          setModalOpen(false);
          setEditingSubject(undefined);
          showToast("UC creada correctamente");
        },
        onError: (e: any) => showToast(e.message, "error"),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteSubject.mutate(id, {
      onSuccess: () => {
        setDeletingId(null);
        showToast("UC eliminada");
      },
      onError: (e: any) => showToast(e.message, "error"),
    });
  };

  if (authLoading || isLoading) {
    return <div className="oat-spinner-wrapper" aria-busy="true" aria-label="Cargando UC"></div>;
  }

  return (
    <>
      <div className="oat-card">
        <header className="subjects-header">
          <h1 style={{ margin: 0 }}>Unidades Curriculares</h1>
          <button
            onClick={() => {
              setEditingSubject(undefined);
              setModalOpen(true);
            }}
            className="oat-btn oat-btn-primary"
            aria-label="Nueva UC"
          >
            + Nueva
          </button>
        </header>

        {subjects.length === 0 ? (
          <p className="oat-text-secondary">No hay UC registradas aún.</p>
        ) : (
          <div className="table-responsive">
            <table className="subjects-table" aria-label="Lista de UC">
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
                      <a href={`/subjects/${s.slug || s.id}`} className="subjects-link">
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
                          aria-label={`Editar UC ${s.name}`}
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
                              aria-label="Confirmar eliminación"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="oat-btn oat-btn-outline"
                              style={{ fontSize: "0.75rem" }}
                              aria-label="Cancelar eliminación"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(s.id)}
                            className="oat-btn oat-btn-outline"
                            style={{ fontSize: "0.75rem", color: "var(--oat-danger)" }}
                            aria-label={`Eliminar UC ${s.name}`}
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
          title={editingSubject ? "Editar UC" : "Nueva UC"}
        >
          <SubjectForm
            initialData={editingSubject}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            loading={createSubject.isPending || updateSubject.isPending}
          />
        </Modal>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
