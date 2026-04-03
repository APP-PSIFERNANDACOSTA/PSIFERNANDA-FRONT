export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface Session {
  id: number;
  patient_id: number;
  psychologist_id: number;
  session_date: string;
  duration: number | null;
  notes: string | null;
  status: SessionStatus;
  /** ID do evento no Google Calendar, quando sincronizado */
  google_event_id?: string | null;
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

/** Chip roxo (Grape) — igual para agendada e remarcada na agenda */
const SESSION_ACTIVE_CHIP =
  'bg-[#8E24AA] text-white border border-[#6a1b7a] shadow-sm'

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: SESSION_ACTIVE_CHIP,
  rescheduled: SESSION_ACTIVE_CHIP,
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-orange-50 text-orange-700 border-orange-200',
};

