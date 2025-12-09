import apiClient from "@/lib/api-client";
import type { Exercise, ExercisesResponse, ExerciseSession, ExerciseAiResponse } from "@/types/exercise";

class ExerciseService {
  async getAll(params?: { is_active?: boolean; category?: string }): Promise<Exercise[]> {
    const client = apiClient.getAxiosInstance();
    const response = await client.get<ExercisesResponse>("/exercises", {
      params,
    });
    return response.data.exercises || [];
  }

  async create(data: Partial<Exercise>): Promise<Exercise> {
    const client = apiClient.getAxiosInstance();
    const response = await client.post<{ success: boolean; exercise: Exercise }>("/exercises", data);
    return response.data.exercise;
  }

  async generateWithAI(payload: {
    focus: string;
    type?: "timer" | "counter";
    duration_minutes?: number;
  }): Promise<Exercise | null> {
    const client = apiClient.getAxiosInstance();
    const response = await client.post<ExerciseAiResponse>("/exercises/generate-with-ai", payload);
    if (response.data.success && response.data.exercise) {
      return response.data.exercise;
    }
    return null;
  }

  async update(id: number, data: Partial<Exercise>): Promise<Exercise> {
    const client = apiClient.getAxiosInstance();
    const response = await client.put<{ success: boolean; exercise: Exercise }>(`/exercises/${id}`, data);
    return response.data.exercise;
  }

  async toggleActive(id: number): Promise<Exercise> {
    const client = apiClient.getAxiosInstance();
    const response = await client.post<{ success: boolean; exercise: Exercise }>(
      `/exercises/${id}/toggle-active`,
    );
    return response.data.exercise;
  }

  async delete(id: number): Promise<void> {
    const client = apiClient.getAxiosInstance();
    await client.delete(`/exercises/${id}`);
  }

  // Patient portal
  async getMyExercises(): Promise<Exercise[]> {
    const client = apiClient.getAxiosInstance();
    const response = await client.get<ExercisesResponse>("/patient/exercises");
    return response.data.exercises || [];
  }

  async startExercise(exerciseId: number): Promise<ExerciseSession> {
    const client = apiClient.getAxiosInstance();
    const response = await client.post<{ success: boolean; session: ExerciseSession }>(
      `/patient/exercises/${exerciseId}/start`,
    );
    return response.data.session;
  }

  async completeExercise(
    exerciseId: number,
    payload: {
      session_id?: number;
      duration_seconds_real?: number | null;
      reps_real?: number | null;
      notes?: string | null;
    },
  ): Promise<ExerciseSession> {
    const client = apiClient.getAxiosInstance();
    const response = await client.post<{ success: boolean; session: ExerciseSession }>(
      `/patient/exercises/${exerciseId}/complete`,
      payload,
    );
    return response.data.session;
  }
}

const exerciseService = new ExerciseService();
export default exerciseService;


