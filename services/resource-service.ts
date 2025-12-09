import apiClient from "../lib/api-client";

export interface Resource {
  id: number;
  psychologist_id: number;
  title: string;
  description?: string;
  file_path: string;
  file_type: "pdf" | "video" | "ppt" | "doc" | "image" | "other";
  file_size: number;
  mime_type: string;
  cover_image_path?: string;
  category:
    | "livros"
    | "apresentacoes"
    | "artigos"
    | "exercicios"
    | "videos"
    | "outros";
  tags: string[];
  sharing_type: "public" | "selective";
  created_at: string;
  updated_at: string;
  // Computed fields
  file_url?: string;
  cover_url?: string;
  formatted_file_size?: string;
  file_icon?: string;
  // Relationships
  shared_patients?: Array<{ id: number; name: string; email: string }>;
  notes_count?: number;
  progress_count?: number;
  progress?: ResourceProgress;
}

export interface ResourceNote {
  id: number;
  resource_id: number;
  patient_id: number;
  note_text: string;
  page_number?: number;
  timestamp?: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  formatted_timestamp?: string;
  context?: string;
}

export interface ResourceProgress {
  id: number;
  resource_id: number;
  patient_id: number;
  is_completed: boolean;
  last_accessed_at?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  status?: string;
  formatted_progress?: string;
  time_since_last_access?: string;
}

export interface ResourceShare {
  id: number;
  resource_id: number;
  patient_id: number;
  shared_at: string;
  expires_at?: string;
}

export interface CreateResourceData {
  file: File;
  cover_image?: File;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  sharing_type: "public" | "selective";
  patient_ids?: number[];
}

export interface UpdateResourceData {
  cover_image?: File;
  remove_cover?: boolean;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  sharing_type: "public" | "selective";
  patient_ids?: number[];
}

export interface CreateResourceNoteData {
  note_text: string;
  page_number?: number;
  timestamp?: number;
}

class ResourceService {
  // Métodos para psicólogos
  async getAll(params?: {
    category?: string;
    sharing_type?: string;
    search?: string;
    tags?: string[];
    page?: number;
  }): Promise<{ data: Resource[]; meta: any }> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get("/resources", { params });
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar recursos:", error);
      throw error;
    }
  }

  async getById(id: number): Promise<Resource> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/resources/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar recurso:", error);
      throw error;
    }
  }

  async create(
    data: CreateResourceData & { video_url?: string }
  ): Promise<Resource> {
    try {
      const formData = new FormData();

      // Se tiver arquivo, adiciona arquivo, senão adiciona video_url
      if (data.file) {
        formData.append("file", data.file);
      } else if (data.video_url && data.video_url.trim()) {
        formData.append("video_url", data.video_url);
      }

      if (data.cover_image) {
        formData.append("cover_image", data.cover_image);
      }

      formData.append("title", data.title);

      if (data.description && data.description.trim()) {
        formData.append("description", data.description);
      }

      formData.append("category", data.category);

      if (data.tags && data.tags.length > 0) {
        data.tags.forEach((tag) => formData.append("tags[]", tag));
      }

      formData.append("sharing_type", data.sharing_type);

      if (data.sharing_type === "selective" && data.patient_ids) {
        data.patient_ids.forEach((id) =>
          formData.append("patient_ids[]", id.toString())
        );
      }

      const response = await apiClient
        .getAxiosInstance()
        .post("/resources", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

      return response.data.data;
    } catch (error) {
      console.error("Erro ao criar recurso:", error);
      throw error;
    }
  }

  async update(id: number, data: UpdateResourceData): Promise<Resource> {
    try {
      const formData = new FormData();

      // Sempre enviar título (obrigatório) - garantir que não seja undefined
      const title = data.title?.trim() || "";
      formData.append("title", title);

      // Sempre enviar descrição (mesmo que vazia, o backend aceita nullable)
      const description = data.description || "";
      formData.append("description", description);

      // Sempre enviar categoria (obrigatório)
      const category = data.category || "outros";
      formData.append("category", category);

      // Sempre enviar sharing_type (obrigatório)
      const sharingType = data.sharing_type || "public";
      formData.append("sharing_type", sharingType);

      // Enviar tags (mesmo que vazio, o backend aceita nullable)
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        data.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            formData.append("tags[]", tag.trim());
          }
        });
      }

      // Enviar patient_ids apenas se for seletivo
      if (sharingType === "selective" && data.patient_ids && Array.isArray(data.patient_ids) && data.patient_ids.length > 0) {
        data.patient_ids.forEach((patientId) => {
          if (patientId) {
            formData.append("patient_ids[]", patientId.toString());
          }
        });
      }

      // Upload de capa (opcional)
      if (data.cover_image) {
        formData.append("cover_image", data.cover_image);
      }

      // Remover capa (opcional)
      if (data.remove_cover) {
        formData.append("remove_cover", "true");
      }

      // Debug: verificar o que está sendo enviado
      console.log("Dados sendo enviados:", {
        title,
        description,
        category,
        sharingType,
        tags: data.tags,
        patient_ids: data.patient_ids,
        has_cover_image: !!data.cover_image,
        remove_cover: data.remove_cover
      });

      // Debug: verificar o FormData
      console.log("FormData entries:");
      for (const pair of formData.entries()) {
        console.log(pair[0], ":", pair[1]);
      }

      // Usar POST com _method=PUT para garantir compatibilidade com Laravel
      // Isso é necessário porque alguns servidores não processam FormData corretamente em PUT
      formData.append("_method", "PUT");

      // Não definir Content-Type manualmente - deixar o Axios detectar automaticamente
      // Isso garante que o boundary seja adicionado corretamente
      const response = await apiClient
        .getAxiosInstance()
        .post(`/resources/${id}`, formData);

      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao atualizar recurso:", error);
      console.error("Resposta do erro:", error.response?.data);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.getAxiosInstance().delete(`/resources/${id}`);
    } catch (error) {
      console.error("Erro ao deletar recurso:", error);
      throw error;
    }
  }

  async uploadCover(
    id: number,
    coverFile: File
  ): Promise<{ cover_url: string }> {
    try {
      const formData = new FormData();
      formData.append("cover_image", coverFile);

      const response = await apiClient
        .getAxiosInstance()
        .post(`/resources/${id}/cover`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

      return response.data.data;
    } catch (error) {
      console.error("Erro ao fazer upload da capa:", error);
      throw error;
    }
  }

  async shareWithPatients(id: number, patientIds: number[]): Promise<void> {
    try {
      await apiClient.getAxiosInstance().post(`/resources/${id}/share`, {
        patient_ids: patientIds,
      });
    } catch (error) {
      console.error("Erro ao compartilhar recurso:", error);
      throw error;
    }
  }

  async unshareFromPatient(id: number, patientId: number): Promise<void> {
    try {
      await apiClient
        .getAxiosInstance()
        .delete(`/resources/${id}/share/${patientId}`);
    } catch (error) {
      console.error("Erro ao remover compartilhamento:", error);
      throw error;
    }
  }

  async getSharedPatients(
    id: number
  ): Promise<Array<{ id: number; name: string; email: string }>> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/resources/${id}/shared-patients`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar pacientes compartilhados:", error);
      throw error;
    }
  }

  // Métodos para pacientes
  async getMyResources(params?: {
    category?: string;
    search?: string;
    tags?: string[];
    page?: number;
  }): Promise<{ data: Resource[]; meta: any }> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get("/patient/resources", { params });
      return {
        data: response.data.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error("Erro ao buscar meus recursos:", error);
      throw error;
    }
  }

  async getResourceById(id: number): Promise<Resource> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/patient/resources/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar recurso:", error);
      throw error;
    }
  }

  async downloadResource(
    id: number
  ): Promise<{ download_url: string; filename: string; mime_type: string }> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/patient/resources/${id}/download`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao baixar recurso:", error);
      throw error;
    }
  }

  async getCoverUrl(
    id: number
  ): Promise<{ cover_url?: string; file_icon: string }> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/patient/resources/${id}/cover`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar capa:", error);
      throw error;
    }
  }

  async markAsCompleted(id: number): Promise<ResourceProgress> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .post(`/patient/resources/${id}/complete`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao marcar como concluído:", error);
      throw error;
    }
  }

  async updateProgress(
    id: number,
    progressPercentage: number
  ): Promise<ResourceProgress> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .post(`/patient/resources/${id}/progress`, {
          progress_percentage: progressPercentage,
        });
      return response.data.data;
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      throw error;
    }
  }

  async getNotes(id: number): Promise<ResourceNote[]> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/patient/resources/${id}/notes`);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar anotações:", error);
      throw error;
    }
  }

  async createNote(
    id: number,
    note: CreateResourceNoteData
  ): Promise<ResourceNote> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .post(`/patient/resources/${id}/notes`, note);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao criar anotação:", error);
      throw error;
    }
  }

  async updateNote(
    id: number,
    noteId: number,
    note: CreateResourceNoteData
  ): Promise<ResourceNote> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .put(`/patient/resources/${id}/notes/${noteId}`, note);
      return response.data.data;
    } catch (error) {
      console.error("Erro ao atualizar anotação:", error);
      throw error;
    }
  }

  async deleteNote(id: number, noteId: number): Promise<void> {
    try {
      await apiClient
        .getAxiosInstance()
        .delete(`/patient/resources/${id}/notes/${noteId}`);
    } catch (error) {
      console.error("Erro ao deletar anotação:", error);
      throw error;
    }
  }

  // Métodos utilitários
  getFileIcon(fileType: string): string {
    const icons = {
      pdf: "FileText",
      video: "Video",
      ppt: "Presentation",
      doc: "FileText",
      image: "Image",
      other: "File",
    };
    return icons[fileType as keyof typeof icons] || "File";
  }

  formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
}

const resourceService = new ResourceService();
export default resourceService;