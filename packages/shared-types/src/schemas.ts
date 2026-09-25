import { z } from "zod";

// Largos máximos: frenan que alguien llene la base con textos gigantes.
const NAME_MAX = 200;
const TITLE_MAX = 300;
const TEXT_MAX = 10_000;
const JOURNAL_MAX = 50_000;
const URL_MAX = 2048;
const SHORT_MAX = 100;

// --- SUBJECTS ---

export const createSubjectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(NAME_MAX),
  total_classes: z.coerce.number().int().min(0, "total_classes debe ser un número no negativo"),
  track: z.enum(["semestral", "anual"]).optional(),
  duration_weeks: z.coerce.number().int().min(1).optional(),
});

export const updateSubjectSchema = z
  .object({
    name: z.string().min(1, "El nombre no puede estar vacío").max(NAME_MAX).optional(),
    total_classes: z.coerce
      .number()
      .int()
      .min(0, "total_classes debe ser un número no negativo")
      .optional(),
    track: z.enum(["semestral", "anual"]).nullish(),
    duration_weeks: z.coerce.number().int().min(1).nullish(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

// --- TASKS ---

const taskStatusEnum = z.enum(["todo", "in-progress", "done"]);

export const createTaskSchema = z.object({
  subject_id: z.string().max(SHORT_MAX).optional().nullable(),
  title: z.string().min(1, "El título es requerido").max(TITLE_MAX),
  due_date: z.string().min(1, "due_date es requerido").max(SHORT_MAX),
  description: z.string().max(TEXT_MAX).optional(),
  status: taskStatusEnum.optional(),
  type: z.enum(["parcial", "examen", "trabajo", "otro"]).optional(),
  grade: z.coerce.number().min(0).max(12).optional(),
  file_url: z.string().max(URL_MAX).url().optional(),
  comments: z.string().max(TEXT_MAX).optional(),
  is_planner: z.boolean().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(TITLE_MAX).optional(),
    description: z.string().max(TEXT_MAX).optional(),
    due_date: z.string().max(SHORT_MAX).optional(),
    status: taskStatusEnum.optional(),
    type: z.enum(["parcial", "examen", "trabajo", "otro"]).nullish(),
    grade: z.coerce.number().min(0).max(12).nullish(),
    file_url: z.string().max(URL_MAX).url().nullish(),
    comments: z.string().max(TEXT_MAX).nullish(),
    is_planner: z.boolean().optional(),
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
  subject_id: z.string().min(1, "subject_id es requerido").max(SHORT_MAX),
  date: z.string().min(1, "La fecha es requerida").max(SHORT_MAX),
  type: absenceTypeEnum,
});

// --- PRACTICE JOURNALS ---

export const createJournalSchema = z.object({
  subject_id: z.string().min(1, "subject_id es requerido").max(SHORT_MAX),
  date: z.string().min(1, "La fecha es requerida").max(SHORT_MAX),
  content: z.string().min(1, "El contenido es requerido").max(JOURNAL_MAX),
});

export const updateJournalSchema = z.object({
  content: z.string().min(1, "El contenido es requerido").max(JOURNAL_MAX),
});

// --- AUTH ---

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(NAME_MAX),
  email: z.string().max(254).email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(128),
  inviteCode: z.string().min(1, "El código de invitación es requerido").max(SHORT_MAX),
});

// --- ICAL / INTEGRATIONS ---

export const updateIcalSchema = z.object({
  ical_url: z
    .string()
    .max(URL_MAX)
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
