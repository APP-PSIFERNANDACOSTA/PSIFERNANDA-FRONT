export type ExerciseType = "timer" | "counter";

export interface Exercise {
  id: number;
  psychologist_id: number;
  title: string;
  description: string | null;
  category: string | null;
  type: ExerciseType;
  duration_seconds: number | null;
  target_reps: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSession {
  id: number;
  exercise_id: number;
  patient_id: number;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds_real: number | null;
  reps_real: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExercisesResponse {
  success: boolean;
  exercises: Exercise[];
}

export interface ExerciseAiResponse {
  success: boolean;
  exercise?: Exercise;
  message?: string;
}


