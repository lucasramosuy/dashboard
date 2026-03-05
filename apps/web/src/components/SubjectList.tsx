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

const btnOutline =
  "px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border bg-transparent text-theme-text hover:bg-theme-bg hover:border-theme-accent cursor-pointer transition-all duration-150";

export const SubjectList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
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
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-16 text-theme-text-muted text-sm"
        aria-busy="true"
        aria-label="Cargando UC"
      ></div>
    );
  }

  return (
    <>
      <div className="bg-theme-card-bg border border-theme-border rounded-xl p-6 shadow-sm">
        <header className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h1 className="m-0 text-theme-text">Unidades Curriculares</h1>
          <button
            onClick={() => {
              setEditingSubject(undefined);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-lg font-semibold border border-transparent bg-theme-primary text-theme-bg hover:bg-theme-accent hover:-translate-y-px hover:shadow-md cursor-pointer transition-all duration-150"
            aria-label="Nueva UC"
          >
            + Nueva
          </button>
        </header>

        {subjects.length === 0 ? (
          <p className="text-theme-text-muted">No hay UC registradas aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[400px]" aria-label="Lista de UC">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Nombre
                  </th>
                  <th className="text-left px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Clases Totales
                  </th>
                  <th className="text-right px-3 py-2 border-b-2 border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-theme-bg transition-colors">
                    <td className="px-3 py-3 border-b border-theme-border">
                      <a
                        href={`/subjects/${s.slug || s.id}`}
                        className="text-theme-primary font-semibold no-underline hover:underline"
                      >
                        {s.name}
                      </a>
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border text-theme-text">
                      {s.total_classes}
                    </td>
                    <td className="px-3 py-3 border-b border-theme-border">
                      <div className="flex justify-end items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setEditingSubject(s);
                            setModalOpen(true);
                          }}
                          className={btnOutline}
                          aria-label={`Editar UC ${s.name}`}
                        >
                          Editar
                        </button>
                        {deletingId === s.id ? (
                          <>
                            <span className="text-xs text-theme-danger">¿Confirmar?</span>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className={`${btnOutline} text-theme-danger`}
                              aria-label="Confirmar eliminación"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className={btnOutline}
                              aria-label="Cancelar eliminación"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingId(s.id)}
                            className={`${btnOutline} text-theme-danger`}
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
