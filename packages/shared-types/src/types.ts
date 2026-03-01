export interface UserPublic {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
}

export interface Subject {
  id: string;
  name: string;
  total_classes: number;
  user_id: string;
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
  subject_id: string;
  title: string;
  description?: string;
  due_date: Date;
  status: "todo" | "in-progress" | "done";
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
