export interface UserPublic {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  ical_url?: string | null;
  last_ical_sync?: Date | null;
}

export interface Subject {
  id: string;
  name: string;
  total_classes: number;
  user_id: string;
  track?: "semestral" | "anual" | null;
  duration_weeks?: number | null;
}

export interface Absence {
  id: string;
  subject_id: string;
  date: Date;
  type: "standard" | "justified";
  calculated_value: 1.0 | 0.5;
}

export interface Task {
  id: string;
  subject_id?: string | null;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  due_date: Date;
  source?: "manual" | "ical";
  type?: "parcial" | "examen" | "trabajo" | "otro" | null;
  grade?: number | null;
  file_url?: string | null;
  comments?: string | null;
}

export interface PracticeJournal {
  id: string;
  subject_id: string;
  date: Date;
  content: string;
}

export interface Invite {
  id: string;
  code: string;
  used: boolean;
  created_at: Date;
}

export interface IcalEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url?: string;
  start_date: Date;
}
