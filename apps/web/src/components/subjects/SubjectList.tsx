import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../ui/Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { SubjectForm } from "../subjects/SubjectForm";
import { Toast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { TableSkeleton } from "../ui/Skeleton";
import { BookOpen } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import type { Subject } from "@dashboard/shared-types";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "../../hooks/useDashboardQueries";

export const SubjectList: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

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
  const handleDelete = () => {
    if (!deletingId) return;
    deleteSubject.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null);
        showToast("UC eliminada");
      },
      onError: (e: any) => showToast(e.message, "error"),
    });
  };

  if (authLoading || isLoading) {
    return <TableSkeleton rows={4} cols={3} />;
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
          <EmptyState
            title="Aún no hay materias registradas"
            description="Las materias o Unidades Curriculares te permiten organizar tus notas y tareas vinculadas."
            actionLabel="+ Crear mi primera materia"
            onAction={() => {
              setEditingSubject(undefined);
              setModalOpen(true);
            }}
            icon={<BookOpen className="w-8 h-8 opacity-50" strokeWidth={1.5} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-400px" aria-label="Lista de UC">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSubject(s);
                            setModalOpen(true);
                          }}
                          aria-label={`Editar UC ${s.name}`}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingId(s.id)}
                          aria-label={`Eliminar UC ${s.name}`}
                        >
                          Eliminar
                        </Button>
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

      <ConfirmModal
        isOpen={!!deletingId}
        title="Eliminar Unidad Curricular"
        description={`¿Estás seguro de que deseas eliminar esta Unidad Curricular? Se eliminarán todas las tareas, planificaciones y ausencias asociadas a ella. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar UC"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteSubject.isPending}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
};
