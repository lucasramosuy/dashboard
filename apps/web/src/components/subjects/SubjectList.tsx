import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../ui/Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { SubjectForm } from "../subjects/SubjectForm";
import { Toast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { TableSkeleton } from "../ui/Skeleton";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader, cardCls, ProgressBar } from "../ui/PageHeader";
import { IconButton } from "../ui/IconButton";
import { attendanceInfo, remainingLabel, average } from "../../lib/format";
import { useToast } from "../../hooks/useToast";
import type { Subject } from "@dashboard/shared-types";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useAllAbsences,
  useTasks,
} from "../../hooks/useDashboardQueries";

const Mini: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg bg-theme-bg py-2">
    <span className="block text-base font-semibold text-theme-text">{value}</span>
    <span className="block text-2xs uppercase tracking-wide text-theme-text-muted">{label}</span>
  </div>
);

export const SubjectList: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { data: subjects = [], isLoading } = useSubjects();
  const { data: absences = [] } = useAllAbsences();
  const { data: tasks = [] } = useTasks();
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

  const openNew = () => {
    setEditingSubject(undefined);
    setModalOpen(true);
  };

  return (
    <>
      <div>
        <PageHeader
          title="Unidades Curriculares"
          subtitle={`${subjects.length} UC · mínimo 75% de asistencia (reglamento CFE)`}
          actions={
            <Button onClick={openNew} aria-label="Nueva UC">
              <Plus size={16} className="mr-1.5" /> Nueva UC
            </Button>
          }
        />
        {subjects.length === 0 ? (
          <div className={`${cardCls} p-6`}>
            <EmptyState
              title="Aún no hay materias registradas"
              description="Las materias o Unidades Curriculares te permiten organizar tus notas y tareas vinculadas."
              actionLabel="+ Crear mi primera materia"
              onAction={openNew}
              icon={<BookOpen className="w-8 h-8 opacity-50" strokeWidth={1.5} />}
            />
          </div>
        ) : (
          <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Lista de UC">
            {subjects.map((s) => {
              const absValue = absences.filter((a) => a.subject_id === s.id).reduce((sum, a) => sum + (a.calculated_value || 0), 0);
              const info = attendanceInfo(s.total_classes, absValue);
              const subjectTasks = tasks.filter((t) => t.subject_id === s.id);
              const pendingCount = subjectTasks.filter((t) => t.status !== "done").length;
              const avg = average(subjectTasks.map((t) => t.grade).filter((g): g is number => g != null));
              return (
                <li key={s.id} className={`${cardCls} p-5 flex flex-col gap-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a href={`/subjects/${s.slug || s.id}`} className="block text-lg font-semibold text-theme-text no-underline hover:underline truncate">
                        {s.name}
                      </a>
                      <span className="text-xs text-theme-text-muted">
                        {s.track ? (s.track === "anual" ? "Anual" : "Semestral") : "Sin régimen"} · {s.total_classes} clases
                      </span>
                    </div>
                    <div className="flex items-center gap-1 -mr-2 -mt-1">
                      <IconButton label={`Editar UC ${s.name}`} onClick={() => { setEditingSubject(s); setModalOpen(true); }}>
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton label={`Eliminar UC ${s.name}`} danger onClick={() => setDeletingId(s.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-theme-text-muted">Faltas {info.absences} de {info.maxAbsences}</span>
                      <span className={info.status === "danger" ? "text-theme-danger font-medium" : info.status === "warning" ? "text-theme-warning font-medium" : "text-theme-text-muted"}>
                        {remainingLabel(info)}
                      </span>
                    </div>
                    <ProgressBar
                      value={info.maxAbsences ? (info.absences / info.maxAbsences) * 100 : 0}
                      tone={info.status === "danger" ? "danger" : info.status === "warning" ? "warning" : "ok"}
                      label={`Faltas usadas en ${s.name}`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Mini label="Asistencia" value={`${info.percentage}%`} />
                    <Mini label="Promedio" value={avg ?? "—"} />
                    <Mini label="Pendientes" value={pendingCount} />
                  </div>
                </li>
              );
            })}
          </ul>
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
