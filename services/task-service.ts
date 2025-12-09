import apiClient from "@/lib/api-client";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskStats,
} from "@/types/task";

interface TasksResponse {
  success: boolean;
  tasks: Task[];
  stats: TaskStats;
}

interface TaskResponse {
  success: boolean;
  task: Task;
}

interface CreateTaskData {
  task?: string;
  title?: string; // Alias para task
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  due_date?: string;
  status?: TaskStatus;
  patient_id?: number | null;
}

interface UpdateTaskData {
  task?: string;
  title?: string; // Alias para task
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  due_date?: string;
  status?: TaskStatus;
  patient_id?: number | null;
}

class TaskService {
  async getAll(params?: {
    status?: TaskStatus | "all";
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<TasksResponse> {
    const response = await apiClient.get<TasksResponse>("/tasks", {
      params,
    });
    return response;
  }

  async getById(id: number): Promise<Task> {
    const response = await apiClient.get<TaskResponse>(`/tasks/${id}`);
    return response.task;
  }

  async create(data: CreateTaskData): Promise<Task> {
    const response = await apiClient.post<TaskResponse>("/tasks", data);
    return response.task;
  }

  async update(id: number, data: UpdateTaskData): Promise<Task> {
    const response = await apiClient.put<TaskResponse>(`/tasks/${id}`, data);
    return response.task;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  }

  async complete(id: number): Promise<Task> {
    const response = await apiClient.post<TaskResponse>(`/tasks/${id}/complete`);
    return response.task;
  }

  async reopen(id: number): Promise<Task> {
    const response = await apiClient.post<TaskResponse>(`/tasks/${id}/reopen`);
    return response.task;
  }

  async updateOrder(taskIds: number[]): Promise<void> {
    await apiClient.post("/tasks/update-order", { task_ids: taskIds });
  }
}

export default new TaskService();

