import apiClient from "@/lib/api-client"
import type {
  CreatePatientNotePayload,
  PatientNote,
  PatientNoteResponse,
  PatientNotesListMeta,
  PatientNotesListResponse,
} from "@/types/patient-note"

const DEFAULT_PER_PAGE = 15

class PatientNoteService {
  async list(
    patientId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<{ data: PatientNote[]; meta: PatientNotesListMeta }> {
    const page = params?.page ?? 1
    const per_page = params?.per_page ?? DEFAULT_PER_PAGE
    const res = await apiClient.get<PatientNotesListResponse>(`/patients/${patientId}/notes`, {
      params: { page, per_page },
    })
    return { data: res.data, meta: res.meta }
  }

  async get(patientId: number, noteId: number): Promise<PatientNote> {
    const res = await apiClient.get<PatientNoteResponse>(`/patients/${patientId}/notes/${noteId}`)
    return res.data
  }

  async create(patientId: number, payload: CreatePatientNotePayload): Promise<PatientNote> {
    const res = await apiClient.post<PatientNoteResponse>(`/patients/${patientId}/notes`, payload)
    return res.data
  }

  async update(
    patientId: number,
    noteId: number,
    payload: Partial<CreatePatientNotePayload>
  ): Promise<PatientNote> {
    const res = await apiClient.put<PatientNoteResponse>(
      `/patients/${patientId}/notes/${noteId}`,
      payload
    )
    return res.data
  }

  async delete(patientId: number, noteId: number): Promise<void> {
    await apiClient.delete(`/patients/${patientId}/notes/${noteId}`)
  }

  /** Portal do paciente: lista pós-terapias (estruturadas com sessão) */
  async listMyPortalPostTherapy(params?: {
    page?: number
    per_page?: number
  }): Promise<{ data: PatientNote[]; meta: PatientNotesListMeta }> {
    const page = params?.page ?? 1
    const per_page = params?.per_page ?? DEFAULT_PER_PAGE
    const res = await apiClient.get<PatientNotesListResponse>("/patient/post-therapy-notes", {
      params: { page, per_page },
    })
    return { data: res.data, meta: res.meta }
  }

  async getMyPortalPostTherapy(noteId: number): Promise<PatientNote> {
    const res = await apiClient.get<PatientNoteResponse>(`/patient/post-therapy-notes/${noteId}`)
    return res.data
  }
}

export const patientNoteService = new PatientNoteService()
export default patientNoteService
