export interface User {
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
}

export interface Absence {
  id: string;
  subject_id: string;
  date: string;
  type: 'standard' | 'justified';
  calculated_value: 1.0 | 0.5;
}

export interface Task {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface PracticeJournal {
  id: string;
  subject_id: string;
  date: string;
  content: string;
}
