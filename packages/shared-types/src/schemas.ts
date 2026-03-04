import { z } from "zod";

// --- SUBJECTS ---

export const createSubjectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  total_classes: z.coerce.number().int().min(0, "total_classes debe ser un número no negativo"),
});

export const updateSubjectSchema = z
  .object({
    name: z.string().min(1, "El nombre no puede estar vacío").optional(),
    total_classes: z.coerce
      .number()
      .int()
      .min(0, "total_classes debe ser un número no negativo")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

// --- TASKS ---

const taskStatusEnum = z.enum(["todo", "in-progress", "done"]);

export const createTaskSchema = z.object({
  subject_id: z.string().min(1, "subject_id es requerido"),
  title: z.string().min(1, "El título es requerido"),
  due_date: z.string().min(1, "due_date es requerido"),
  description: z.string().optional(),
  status: taskStatusEnum.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    due_date: z.string().optional(),
    status: taskStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
});

// --- ABSENCES ---

const absenceTypeEnum = z.enum(["standard", "justified"]);

export const createAbsenceSchema = z.object({
  subject_id: z.string().min(1, "subject_id es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  type: absenceTypeEnum,
});

// --- PRACTICE JOURNALS ---

export const createJournalSchema = z.object({
  subject_id: z.string().min(1, "subject_id es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  content: z.string().min(1, "El contenido es requerido"),
});

export const updateJournalSchema = z.object({
  content: z.string().min(1, "El contenido es requerido"),
});

// --- AUTH ---

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  inviteCode: z.string().min(1, "El código de invitación es requerido"),
});

// --- ICAL / INTEGRATIONS ---

export const updateIcalSchema = z.object({
  ical_url: z
    .string()
    .transform((val) => {
      const trimmed = val.trim();
      if (trimmed.startsWith("webcal://")) {
        return trimmed.replace("webcal://", "https://");
      }
      return trimmed;
    })
    .refine((val) => val === "" || val.startsWith("http"), {
      message: "Debe ser una URL válida (http/https/webcal)",
    })
    .optional(),
});
