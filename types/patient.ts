export const PAYMENT_TYPES = [
  { value: "por_sessao", label: "Por Sessão" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number]["value"];

export interface Patient {
  id: number;
  psychologist_id: number;
  user_id: number | null;
  name: string;
  birthdate: string | null;
  age: number | null;
  phone: string;
  cpf: string | null;
  email: string;
  emergency_contact: string | null;
  address: string | null;
  insurance: string | null;
  price_session: number | null;
  payment_type: PaymentType;
  initial_notes: string | null;
  status: "active" | "inactive";
  last_session_date: string | null;
  next_session_date: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreatePatientData {
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  birthdate?: string;
  emergency_contact?: string;
  address?: string;
  insurance?: string;
  price_session?: number;
  payment_type?: PaymentType;
  initial_notes?: string;
  status?: "active" | "inactive";
}

export interface UpdatePatientData {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  emergency_contact?: string;
  address?: string;
  insurance?: string;
  price_session?: number;
  payment_type?: PaymentType;
  initial_notes?: string;
  status?: "active" | "inactive";
  last_session_date?: string;
  next_session_date?: string;
}

export interface PortalAccessCredentials {
  email: string;
  temporary_password: string;
  portal_url: string;
  message: string;
}

export interface PatientsResponse {
  success: boolean;
  patients: {
    data: Patient[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface PatientResponse {
  success: boolean;
  patient: Patient;
  message?: string;
}

export interface GrantAccessResponse {
  success: boolean;
  message: string;
  patient: Patient;
  credentials: PortalAccessCredentials;
}
