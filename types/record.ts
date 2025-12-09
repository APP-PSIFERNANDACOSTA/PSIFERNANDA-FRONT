export interface Record {
  id: number;
  patient_id: number;
  psychologist_id: number;
  session_id?: number | null;
  session_report_id?: number | null;
  session_date: string;
  session_number?: number | null;
  duration?: number | null;
  session_type: 'individual' | 'casal' | 'familia' | 'grupo';
  diagnosis?: string | null;
  complaints?: string | null;
  observations?: string | null;
  interventions?: string | null;
  evolution?: string | null;
  therapeutic_plan?: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  session?: {
    id: number;
    session_date: string;
    duration: number;
    status: string;
  } | null;
  session_report?: {
    id: number;
    title: string;
    content: string;
  } | null;
  session_reports?: Array<{
    id: number;
    title: string;
    content: string;
  }>;
}

export interface RecordResponse {
  success: boolean;
  data: Record;
}

export interface RecordsResponse {
  success: boolean;
  data: Record[];
}

export interface CreateRecordData {
  patient_id: number;
  session_id?: number | null;
  session_report_id?: number | null;
  session_report_ids?: number[];
  session_date: string;
  session_number?: number | null;
  duration?: number | null;
  session_type?: 'individual' | 'casal' | 'familia' | 'grupo';
  diagnosis?: string | null;
  complaints?: string | null;
  observations?: string | null;
  interventions?: string | null;
  evolution?: string | null;
  therapeutic_plan?: string | null;
}

export interface UpdateRecordData {
  session_id?: number | null;
  session_report_id?: number | null;
  session_report_ids?: number[];
  session_date?: string;
  session_number?: number | null;
  duration?: number | null;
  session_type?: 'individual' | 'casal' | 'familia' | 'grupo';
  diagnosis?: string | null;
  complaints?: string | null;
  observations?: string | null;
  interventions?: string | null;
  evolution?: string | null;
  therapeutic_plan?: string | null;
}
