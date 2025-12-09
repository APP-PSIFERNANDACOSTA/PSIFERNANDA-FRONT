export interface Resource {
  id: number;
  psychologist_id: number;
  title: string;
  description?: string;
  file_path?: string;
  video_url?: string;
  file_type: "pdf" | "video" | "ppt" | "doc" | "image" | "other";
  file_size?: number;
  mime_type?: string;
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
  file?: File;
  video_url?: string;
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

export interface UpdateResourceNoteData {
  note_text: string;
  page_number?: number;
  timestamp?: number;
}

// Constantes para categorias
export const RESOURCE_CATEGORIES = [
  { value: "livros", label: "Livros" },
  { value: "apresentacoes", label: "Apresentações" },
  { value: "artigos", label: "Artigos" },
  { value: "exercicios", label: "Exercícios" },
  { value: "videos", label: "Vídeos" },
  { value: "outros", label: "Outros" },
] as const;

// Constantes para tipos de arquivo
export const FILE_TYPES = [
  { value: "pdf", label: "PDF", icon: "FileText" },
  { value: "video", label: "Vídeo", icon: "Video" },
  { value: "ppt", label: "PowerPoint", icon: "Presentation" },
  { value: "doc", label: "Word", icon: "FileText" },
  { value: "image", label: "Imagem", icon: "Image" },
  { value: "other", label: "Outro", icon: "File" },
] as const;

// Constantes para tipos de compartilhamento
export const SHARING_TYPES = [
  { value: "public", label: "Público", description: "Todos os pacientes veem" },
  {
    value: "selective",
    label: "Seletivo",
    description: "Apenas pacientes selecionados",
  },
] as const;

// Tipos para filtros
export interface ResourceFilters {
  category?: string;
  sharing_type?: string;
  search?: string;
  tags?: string[];
}

export interface PatientResourceFilters {
  category?: string;
  search?: string;
  tags?: string[];
}

// Tipos para paginação
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

// Tipos para upload
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

// Tipos para visualização
export interface ViewerProps {
  resource: Resource;
  onProgressUpdate?: (progress: number) => void;
  onNoteCreate?: (note: CreateResourceNoteData) => void;
}

export interface PDFViewerProps extends ViewerProps {
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export interface VideoViewerProps extends ViewerProps {
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

// Tipos para componentes
export interface ResourceCardProps {
  resource: Resource;
  variant?: "dashboard" | "portal";
  onView?: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onShare?: (resource: Resource) => void;
  onDownload?: (resource: Resource) => void;
  onNotes?: (resource: Resource) => void;
}

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // em bytes
  multiple?: boolean;
  disabled?: boolean;
}

export interface CoverUploadProps {
  onCoverSelect: (file: File) => void;
  onRemove?: () => void;
  currentCover?: string;
  disabled?: boolean;
}

export interface ShareResourceModalProps {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sharingType: "public" | "selective", patientIds?: number[]) => void;
}

export interface ResourceNotesProps {
  resource: Resource;
  notes: ResourceNote[];
  onCreateNote: (note: CreateResourceNoteData) => void;
  onUpdateNote: (noteId: number, note: UpdateResourceNoteData) => void;
  onDeleteNote: (noteId: number) => void;
  currentPage?: number;
  currentTimestamp?: number;
}
