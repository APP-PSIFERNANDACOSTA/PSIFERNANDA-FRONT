export type MoodType = "great" | "good" | "neutral" | "sad" | "very-sad";

export interface DiaryEntry {
  id: number;
  patient_id: number;
  user_id: number;
  date: string;
  mood: MoodType;
  title: string | null;
  content: string;
  tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateDiaryEntryData {
  mood: MoodType;
  content: string;
  is_private?: boolean;
}

export interface UpdateDiaryEntryData {
  date?: string;
  mood?: MoodType;
  title?: string;
  content?: string;
  is_private?: boolean;
}

export interface DiaryResponse {
  success: boolean;
  message?: string;
  entry: DiaryEntry;
}

export interface DiaryEntriesResponse {
  success: boolean;
  entries: {
    data: DiaryEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  patient?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DiaryFilters {
  mood?: MoodType;
  date_from?: string;
  date_to?: string;
  search?: string;
  patient_id?: number;
  page?: number;
  per_page?: number;
}

export interface WeeklyAnalysis {
  summary: string;
  mood_distribution: Record<MoodType, number>;
  common_themes: string[];
  ai_generated: boolean;
}

export interface WeeklyAnalysisResponse {
  success: boolean;
  analysis: WeeklyAnalysis;
  period: {
    days: number;
    start_date: string;
    end_date: string;
    entries_count: number;
  };
  message?: string;
}

export const MOOD_OPTIONS = [
  {
    value: "great" as MoodType,
    label: "Ótimo",
    icon: "Sun",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
  },
  {
    value: "good" as MoodType,
    label: "Bem",
    icon: "Smile",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    value: "neutral" as MoodType,
    label: "Neutro",
    icon: "Meh",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    value: "sad" as MoodType,
    label: "Triste",
    icon: "Cloud",
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950",
  },
  {
    value: "very-sad" as MoodType,
    label: "Muito Triste",
    icon: "CloudRain",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
];
