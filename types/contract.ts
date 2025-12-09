export type ContractPaymentType = "por_sessao" | "quinzenal" | "mensal";
export type ContractStatus = "pending" | "signed" | "expired" | "inactive";

export interface Contract {
  id: number;
  psychologist_id: number;
  patient_id: number | null;
  token: string;
  payment_type: ContractPaymentType;
  price_session: string;
  payment_day: number | null;
  status: ContractStatus;
  expires_at: string;
  signed_at: string | null;
  signature_ip: string | null;
  contract_text: string;
  pdf_path: string | null;
  pdf_url?: string;
  patient?: Patient;
  created_at: string;
  updated_at: string;
}

export interface CreateContractData {
  payment_type: ContractPaymentType;
  price_session: number;
}

export interface SignContractData {
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_cpf: string;
  emergency_contact: string;
  payment_day?: number;
  accept_terms: boolean;
}

export interface ContractResponse {
  success: boolean;
  contract: Contract;
  link?: string;
  message?: string;
}

export interface ContractsResponse {
  success: boolean;
  contracts: Contract[];
}

// Import Patient type from existing patient types
import type { Patient } from "./patient";

export const CONTRACT_PAYMENT_TYPES = [
  { value: "por_sessao", label: "Por Sessão" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const;

export const CONTRACT_STATUS_LABELS = {
  pending: "Pendente",
  signed: "Assinado",
  expired: "Expirado",
  inactive: "Inativo",
} as const;

export const PAYMENT_DAY_OPTIONS = [
  { value: 5, label: "Dia 5" },
  { value: 10, label: "Dia 10" },
  { value: 15, label: "Dia 15" },
  { value: 20, label: "Dia 20" },
] as const;
