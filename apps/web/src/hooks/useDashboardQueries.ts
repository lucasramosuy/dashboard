import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Subject, Task, PracticeJournal, Absence } from "@dashboard/shared-types";

// --- SUBJECTS ---

export const useSubjects = () => {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.getSubjects(),
  });
};

export const useAtRiskSubjects = () => {
  return useQuery({
    queryKey: ["subjects", "at-risk"],
    queryFn: () => api.getAtRiskSubjects(),
  });
};

export const useSubject = (id?: string) => {
  return useQuery({
    queryKey: ["subjects", id],
    queryFn: () => (id ? api.getSubject(id) : Promise.reject("No ID")),
    enabled: !!id,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Subject>) => api.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) =>
      api.updateSubject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subjects", id] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      // Invalidate related tasks/absences/journals as well, to be safe
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
};

// --- TASKS ---

export const useTasks = (subjectId?: string) => {
  return useQuery({
    queryKey: subjectId ? ["tasks", { subjectId }] : ["tasks"],
    queryFn: () => api.getTasks(subjectId),
  });
};

export const useTask = (id?: string) => {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => (id ? api.getTask(id) : Promise.reject("No ID")),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => api.updateTask(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
      api.updateTaskStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// --- PRACTICE JOURNALS ---

export const useJournals = () => {
  return useQuery({
    queryKey: ["journals"],
    queryFn: () => api.getJournals(),
  });
};

export const useJournalByDate = (date?: string) => {
  return useQuery({
    queryKey: ["journals", { date }],
    queryFn: () => (date ? api.getJournalByDate(date) : Promise.resolve(null)),
    enabled: !!date,
  });
};

export const useUpsertJournal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PracticeJournal>) => api.upsertJournal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
};

// --- ABSENCES ---

export const useAllAbsences = () => {
  return useQuery({
    queryKey: ["absences"],
    queryFn: () => api.getAllAbsences(),
  });
};

export const useAbsencesBySubject = (subjectId?: string) => {
  return useQuery({
    queryKey: ["absences", { subjectId }],
    queryFn: () => (subjectId ? api.getAbsences(subjectId) : Promise.reject("No Subject ID")),
    enabled: !!subjectId,
  });
};

export const useCreateAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Absence>) => api.createAbsence(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      if (data.subject_id) {
        queryClient.invalidateQueries({ queryKey: ["subjects", "at-risk"] });
      }
    },
  });
};

export const useDeleteAbsence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAbsence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      queryClient.invalidateQueries({ queryKey: ["subjects", "at-risk"] });
    },
  });
};
