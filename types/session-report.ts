export interface SessionReport {
  id: number
  session_id: number
  psychologist_id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  session?: {
    id: number
    patient_id: number
    session_date: string
  }
}


