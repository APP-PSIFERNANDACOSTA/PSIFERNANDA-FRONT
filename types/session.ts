export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface Session {
  id: number;
  patient_id: number;
  psychologist_id: number;
  session_date: string;
  duration: number | null;
  notes: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  status_label?: string;
}

export interface CreateSessionData {
  session_date: string;
  duration?: number | null;
  notes?: string | null;
  status?: SessionStatus;
}

export interface CreateMultipleSessionsData {
  sessions: CreateSessionData[];
}

export interface UpdateSessionData {
  session_date?: string;
  duration?: number | null;
  notes?: string | null;
  status?: SessionStatus;
}

export interface SessionsResponse {
  success: boolean;
  sessions: Session[];
  message?: string;
}

export interface SessionResponse {
  success: boolean;
  session: Session;
  message?: string;
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Agendada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'Falta',
  rescheduled: 'Remarcada',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-700 border-orange-200',
  rescheduled: 'bg-purple-50 text-purple-700 border-purple-200',
};

