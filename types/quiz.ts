export interface Quiz {
  id: number
  title: string
  description?: string
  type: 'anxiety' | 'sleep' | 'mood' | 'self_esteem' | 'custom'
  status: 'active' | 'inactive' | 'draft'
  psychologist_id: number
  duration_minutes: number
  settings?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Relations
  psychologist?: User
  questions?: QuizQuestion[]
  attempts?: QuizAttempt[]
  
  // Computed fields for frontend
  latest_attempt?: QuizAttempt
  is_completed?: boolean
  can_retake?: boolean
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  question_text: string
  question_type: 'multiple_choice' | 'scale' | 'text'
  options?: QuizOption[]
  order: number
  required: boolean
  validation_rules?: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  quiz?: Quiz
  responses?: QuizResponse[]
}

export interface QuizOption {
  value: string
  label: string
}

export interface QuizAttempt {
  id: number
  quiz_id: number
  patient_id: number
  status: 'in_progress' | 'completed' | 'abandoned'
  score?: number
  score_interpretation?: ScoreInterpretation
  ai_feedback?: string | null
  started_at?: string
  completed_at?: string
  time_spent_seconds?: number
  created_at: string
  updated_at: string
  
  // Relations
  quiz?: Quiz
  patient?: User
  responses?: QuizResponse[]
  
  // Computed fields
  time_spent_minutes?: number
}

export interface QuizResponse {
  id: number
  attempt_id: number
  question_id: number
  answer_value?: string
  answer_text?: string
  answer_data?: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  attempt?: QuizAttempt
  question?: QuizQuestion
}

export interface ScoreInterpretation {
  level: string
  color: string
  description: string
}

// Request/Response interfaces
export interface CreateQuizData {
  title: string
  description?: string
  type: 'anxiety' | 'sleep' | 'mood' | 'self_esteem' | 'custom'
  duration_minutes?: number
  status?: 'active' | 'inactive' | 'draft'
  settings?: Record<string, any>
  questions: CreateQuizQuestionData[]
}

export interface CreateQuizQuestionData {
  question_text: string
  question_type: 'multiple_choice' | 'scale' | 'text'
  options?: QuizOption[]
  order: number
  required?: boolean
  validation_rules?: Record<string, any>
}

export interface UpdateQuizData extends Partial<CreateQuizData> {}

export interface SubmitQuizResponseData {
  responses: QuizResponseData[]
  time_spent_seconds?: number
}

export interface QuizResponseData {
  question_id: number
  answer_value?: string
  answer_text?: string
  answer_data?: Record<string, any>
}

// API Response interfaces
export interface QuizResponse {
  success: boolean
  quiz?: Quiz
  message?: string
  errors?: Record<string, string[]>
}

export interface QuizzesResponse {
  success: boolean
  data?: Quiz[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message?: string
}

export interface QuizAttemptsResponse {
  success: boolean
  data?: QuizAttempt[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message?: string
}

export interface SubmitQuizResponse {
  success: boolean
  message?: string
  attempt?: QuizAttempt
  score?: number
  interpretation?: ScoreInterpretation
  errors?: Record<string, string[]>
}

// Frontend specific interfaces
export interface QuizFormData {
  title: string
  description: string
  type: 'anxiety' | 'sleep' | 'mood' | 'self_esteem' | 'custom'
  duration_minutes: number
  questions: QuizQuestionFormData[]
}

export interface QuizQuestionFormData {
  question_text: string
  question_type: 'multiple_choice' | 'scale' | 'text'
  options: QuizOption[]
  order: number
  required: boolean
}

export interface QuizAnswer {
  questionId: number
  answerValue?: string
  answerText?: string
}

export interface QuizProgress {
  currentQuestion: number
  totalQuestions: number
  answers: Record<number, QuizAnswer>
  timeSpent: number
}

// User interface (basic)
export interface User {
  id: number
  name: string
  email: string
  role: 'psychologist' | 'patient'
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Patient Quiz Assignment interfaces
export interface PatientQuizAssignment {
  id: number
  patient_id: number
  quiz_id: number
  psychologist_id: number
  status: 'assigned' | 'in_progress' | 'completed' | 'expired'
  assigned_at: string
  due_date?: string
  notes?: string
  created_at: string
  updated_at: string
  
  // Relations
  patient?: User
  quiz?: Quiz
  psychologist?: User
  attempts?: QuizAttempt[]
  
  // Computed fields
  is_overdue?: boolean
  status_color?: string
  status_label?: string
}

export interface AssignQuizToPatientsData {
  patient_ids: number[]
  due_date?: string
  notes?: string
}

export interface AssignQuizToPatientsResponse {
  success: boolean
  message?: string
  assigned_count?: number
  already_assigned_count?: number
  errors?: Record<string, string[]>
}

export interface QuizAssignmentsResponse {
  success: boolean
  data?: PatientQuizAssignment[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message?: string
}

export interface UpdateAssignmentData {
  status?: 'assigned' | 'in_progress' | 'completed' | 'expired'
  due_date?: string
  notes?: string
}

export interface UpdateAssignmentResponse {
  success: boolean
  message?: string
  assignment?: PatientQuizAssignment
  errors?: Record<string, string[]>
}

// Extended Quiz interface with assignment info
export interface QuizWithAssignments extends Quiz {
  patient_assignments?: PatientQuizAssignment[]
  assigned_patients?: User[]
}
