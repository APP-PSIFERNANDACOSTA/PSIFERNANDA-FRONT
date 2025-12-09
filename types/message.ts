export interface Message {
  id: number;
  psychologist_id: number;
  patient_id: number | null;
  title: string;
  body: string;
  sent_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name: string;
  } | null;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
}




