import type { Session } from "./session"

export type PatientNoteKind = "free_text" | "structured"

/** Campos do modelo estilo “Notas pós-terapia” */
export interface PostTherapyStructured {
  session_date_label: string
  session_time_label: string
  duration_label: string
  discussion_summary: string
  phrase_to_remember: string
  useful_resources: string
  coping_strategies: string
  daily_application: string
  extra_notes: string
  next_session_label: string
}

export const DEFAULT_POST_THERAPY_TEMPLATE_LABEL = "Notas pós-terapia"

export const POST_THERAPY_FIELD_LABELS: Record<keyof PostTherapyStructured, string> = {
  session_date_label: "Data",
  session_time_label: "Hora",
  duration_label: "Duração da sessão",
  discussion_summary: "Síntese da discussão",
  phrase_to_remember: "Frase a recordar",
  useful_resources: "Recursos úteis",
  coping_strategies: "Estratégias de enfrentamento",
  daily_application: "Como aplicar no dia a dia",
  extra_notes: "Outras anotações",
  next_session_label: "Próxima sessão",
}

/** Emoji por campo (visual no portal e no formulário do psicólogo) */
export const POST_THERAPY_FIELD_EMOJIS: Record<keyof PostTherapyStructured, string> = {
  session_date_label: "📅",
  session_time_label: "🕐",
  duration_label: "⏱️",
  discussion_summary: "💬",
  phrase_to_remember: "✨",
  useful_resources: "📚",
  coping_strategies: "🛡️",
  daily_application: "🌱",
  extra_notes: "📝",
  next_session_label: "📆",
}

export function formatPostTherapyFieldLabel(key: keyof PostTherapyStructured): string {
  const emoji = POST_THERAPY_FIELD_EMOJIS[key]
  const label = POST_THERAPY_FIELD_LABELS[key]
  return `${emoji} ${label}`
}

/** Data, hora e duração só fazem sentido com sessão vinculada */
export const SESSION_META_FIELD_KEYS = new Set<keyof PostTherapyStructured>([
  "session_date_label",
  "session_time_label",
  "duration_label",
])

export const STRUCTURED_FIELDS_ORDER = Object.keys(
  POST_THERAPY_FIELD_LABELS
) as (keyof PostTherapyStructured)[]

export function emptyPostTherapyBody(): PostTherapyStructured {
  return {
    session_date_label: "",
    session_time_label: "",
    duration_label: "",
    discussion_summary: "",
    phrase_to_remember: "",
    useful_resources: "",
    coping_strategies: "",
    daily_application: "",
    extra_notes: "",
    next_session_label: "",
  }
}

export interface PatientNote {
  id: number
  patient_id: number
  psychologist_id: number
  session_id: number | null
  title: string | null
  kind: PatientNoteKind
  template_label: string | null
  body_text: string | null
  body_structured: PostTherapyStructured | null
  created_at: string
  updated_at: string
  session?: Pick<Session, "id" | "patient_id" | "session_date" | "duration" | "status"> | null
}

export interface PatientNotesListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PatientNotesListResponse {
  success: boolean
  data: PatientNote[]
  meta: PatientNotesListMeta
}

export interface PatientNoteResponse {
  success: boolean
  message?: string
  data: PatientNote
}

export interface CreatePatientNotePayload {
  title?: string | null
  kind: PatientNoteKind
  template_label?: string | null
  session_id?: number | null
  body_text?: string | null
  body_structured?: PostTherapyStructured | null
}
