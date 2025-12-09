export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskCategory = "clinical" | "admin" | "financial" | "contact" | "preparation" | "other";

export interface Task {
  id: number;
  task: string;
  title?: string; // Alias para task
  description?: string | null;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  due_date?: string | null;
  patient_id?: number | null;
  psychologist_id: number;
  order?: number;
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name: string;
  } | null;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
}




