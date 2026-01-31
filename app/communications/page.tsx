"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DashboardLayout } from "../../components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import {
  Bell,
  Mail,
  MessageSquare,
  CheckCircle2,
  Plus,
  Trash2,
  GripVertical,
  Users,
  User,
  Edit,
  Calendar,
  AlertCircle,
  Clock,
  Search,
  Filter,
  X,
  PlayCircle,
  RotateCcw,
  Settings,
  Save,
  Info,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import { Switch } from "../../components/ui/switch"
import { Separator } from "../../components/ui/separator"
import { useToast } from "../../hooks/use-toast"
import { usePushNotifications } from "../../hooks/use-push-notifications"
import messageService from "../../services/message-service"
import patientService from "../../services/patient-service"
import taskService from "../../services/task-service"
import notificationService from "../../services/notification-service"
import notificationTemplateService, {
  NotificationTemplate,
  SessionReminderRule,
} from "../../services/notification-template-service"
import type { Message } from "../../types/message"
import type { Patient } from "../../types/patient"
import type { Task, TaskStatus, TaskPriority, TaskCategory, TaskStats } from "../../types/task"
import type { Notification } from "../../types/notification"
import { showErrorToast, showSuccessToast } from "../../lib/toast-helpers"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

// Sortable Task Card Component
interface TaskCardProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onChangeStatus: (status: TaskStatus) => void
  getPriorityColor: (priority: TaskPriority) => string
  getCategoryLabel: (category: TaskCategory) => string
  isOverdue: boolean
  isDone?: boolean
}

function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onChangeStatus,
  getPriorityColor,
  getCategoryLabel,
  isOverdue,
  isDone = false,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task: task,
      status: task.status,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card p-3 transition-all hover:shadow-md ${
        isDone ? "opacity-60" : ""
      } ${isOverdue ? "border-red-300 dark:border-red-800" : ""} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="h-4 w-4 shrink-0 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium text-foreground ${isDone ? "line-through" : ""}`}>
              {task.title}
            </p>
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!isDone && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  {task.status === "todo" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onChangeStatus("in-progress")}
                      title="Marcar como em progresso"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {task.status === "in-progress" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onChangeStatus("done")}
                      title="Marcar como concluída"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              )}
              {isDone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onChangeStatus("todo")}
                  title="Reabrir tarefa"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {task.description && (
            <p className={`mt-1 text-xs text-muted-foreground line-clamp-2 ${isDone ? "line-through" : ""}`}>
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
            </span>
            <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">
              {getCategoryLabel(task.category)}
            </span>
            {task.patient && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {task.patient.name}
              </span>
            )}
            {isOverdue && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                Vencida
              </span>
            )}
            {task.due_date && !isOverdue && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Drop Zone Component for Columns
function DroppableColumn({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      status: id,
    },
  })

  return (
    <div
      ref={setNodeRef}
      data-column-id={id}
      className={`${className || ""} ${isOver ? "ring-2 ring-primary/50" : ""}`}
    >
      {children}
    </div>
  )
}

// Task Card for DragOverlay (non-sortable version)
function TaskCardOverlay({
  task,
  getPriorityColor,
  getCategoryLabel,
  isOverdue,
  isDone = false,
}: Omit<TaskCardProps, "onEdit" | "onDelete" | "onChangeStatus">) {
  return (
    <div
      className={`rounded-lg border-2 border-primary bg-card p-3 shadow-lg ${
        isDone ? "opacity-60" : ""
      } ${isOverdue ? "border-red-300 dark:border-red-800" : ""}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-foreground ${isDone ? "line-through" : ""}`}>
            {task.title}
          </p>
          {task.description && (
            <p className={`mt-1 text-xs text-muted-foreground line-clamp-2 ${isDone ? "line-through" : ""}`}>
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
            </span>
            <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">
              {getCategoryLabel(task.category)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}



export default function ComunicacoesPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const defaultTab =
    tabParam === "tasks"
      ? "tasks"
      : tabParam === "messages"
        ? "messages"
        : tabParam === "settings"
          ? "settings"
          : "notifications"
  const [messages, setMessages] = useState<Message[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSavingMessage, setIsSavingMessage] = useState(false)
  const [isMessagesDialogOpen, setIsMessagesDialogOpen] = useState(false)
  const [messageForm, setMessageForm] = useState({
    title: "",
    body: "",
    target: "all" as "all" | "patient",
    patient_id: 0,
  })

  // Push Notifications
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    error: pushError,
    subscribe,
    unsubscribe
  } = usePushNotifications()

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
    high_priority: 0,
  })
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "all">("all")
  const [taskSearch, setTaskSearch] = useState("")
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    category: "other" as TaskCategory,
    due_date: "",
    patient_id: null as number | null,
  })

  // Notification Templates and Rules state
  const [notifTemplates, setNotifTemplates] = useState<NotificationTemplate[]>([])
  const [sessionRules, setSessionRules] = useState<SessionReminderRule[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isLoadingRules, setIsLoadingRules] = useState(true)
  const [isSavingTemplates, setIsSavingTemplates] = useState(false)
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false)
  const [newRule, setNewRule] = useState<Partial<SessionReminderRule>>({
    channel: "push",
    offset_minutes: 60,
    title_template: "",
    body_template: "",
    enabled: true,
    window_minutes: 60,
  })

  useEffect(() => {
    loadMessages()
    loadPatients()
    loadTasks()
    loadNotifications()
    loadNotifTemplates()
    loadSessionRules()
  }, [taskFilter])

  // Recarregar notificações a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [])

  const loadMessages = async () => {
    setIsLoadingMessages(true)
    try {
      const data = await messageService.getAll()
      setMessages(data)
    } catch (error: any) {
      console.error("Erro ao carregar mensagens:", error)
      showErrorToast("Erro", "Não foi possível carregar as mensagens.")
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll({ per_page: 1000 })
      const list = response.patients?.data || (Array.isArray(response.patients) ? response.patients : [])
      setPatients(list)
    } catch (error) {
      console.error("Erro ao carregar pacientes para mensagens:", error)
    }
  }

  // Notifications functions
  const loadNotifications = async () => {
    setIsLoadingNotifications(true)
    try {
      const { notifications: loadedNotifications, unreadCount: count } = await notificationService.getAll()
      setNotifications(loadedNotifications)
      setUnreadCount(count)
    } catch (error: any) {
      console.error("Erro ao carregar notificações:", error)
      showErrorToast("Erro", "Não foi possível carregar as notificações.")
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      showSuccessToast("Notificações marcadas", "Todas as notificações foram marcadas como lidas.")
    } catch (error: any) {
      console.error("Erro ao marcar todas como lidas:", error)
      showErrorToast("Erro", "Não foi possível marcar todas como lidas.")
    }
  }

  // ===== Notification Templates & Session Rules Functions =====
  const loadNotifTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const data = await notificationTemplateService.getTemplates("push")
      setNotifTemplates(data)
    } catch (error: any) {
      console.error("Erro ao carregar templates:", error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const loadSessionRules = async () => {
    try {
      setIsLoadingRules(true)
      const data = await notificationTemplateService.getRules("push")
      setSessionRules(data)
    } catch (error: any) {
      console.error("Erro ao carregar regras:", error)
    } finally {
      setIsLoadingRules(false)
    }
  }

  const handleSaveTemplates = async () => {
    try {
      setIsSavingTemplates(true)
      const updated = await notificationTemplateService.updateTemplates(notifTemplates, "push")
      setNotifTemplates(updated)
      showSuccessToast("Sucesso!", "Templates de notificação salvos")
    } catch (error: any) {
      console.error("Erro ao salvar templates:", error)
      showErrorToast("Erro", "Não foi possível salvar os templates")
    } finally {
      setIsSavingTemplates(false)
    }
  }

  const handleSaveRules = async () => {
    try {
      setIsSavingRules(true)
      const updated = await notificationTemplateService.updateRules(sessionRules, "push")
      setSessionRules(updated)
      showSuccessToast("Sucesso!", "Regras de lembrete salvas")
    } catch (error: any) {
      console.error("Erro ao salvar regras:", error)
      showErrorToast("Erro", "Não foi possível salvar as regras")
    } finally {
      setIsSavingRules(false)
    }
  }

  const handleAddRule = async () => {
    if (!newRule.title_template?.trim()) {
      showErrorToast("Erro", "O título do lembrete é obrigatório")
      return
    }

    try {
      const updatedRules = [...sessionRules, newRule as SessionReminderRule]
      const saved = await notificationTemplateService.updateRules(updatedRules, "push")
      setSessionRules(saved)
      setIsAddRuleDialogOpen(false)
      setNewRule({
        channel: "push",
        offset_minutes: 60,
        title_template: "",
        body_template: "",
        enabled: true,
        window_minutes: 60,
      })
      showSuccessToast("Sucesso!", "Regra de lembrete adicionada")
    } catch (error: any) {
      console.error("Erro ao adicionar regra:", error)
      showErrorToast("Erro", "Não foi possível adicionar a regra")
    }
  }

  const formatOffsetMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} dia${days > 1 ? "s" : ""} antes`
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? "s" : ""} antes`
    } else {
      return `${minutes} minuto${minutes > 1 ? "s" : ""} antes`
    }
  }

  const templateTypeLabels: Record<string, string> = {
    message_new: "Nova Mensagem",
    quiz_assigned: "Quiz Atribuído",
    quiz_updated: "Quiz Atualizado",
    quiz_response: "Resposta de Quiz",
    diary_new: "Novo Diário",
    push_test: "Notificação de Teste",
  }

  const templateRecipient: Record<string, "patient" | "psychologist"> = {
    message_new: "patient",
    quiz_assigned: "patient",
    quiz_updated: "patient",
    quiz_response: "psychologist",
    diary_new: "psychologist",
    push_test: "psychologist",
  }

  const templatePlaceholders: Record<string, string[]> = {
    message_new: ["{message_title}"],
    quiz_assigned: ["{quiz_title}"],
    quiz_updated: ["{quiz_title}"],
    quiz_response: ["{patient_name}", "{quiz_title}"],
    diary_new: ["{patient_name}"],
    push_test: [],
  }

  const sessionPlaceholders = ["{date}", "{time}", "{datetime}"]
  // ===== End Notification Templates & Session Rules Functions =====

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return "Há algum tempo"
    }
  }

  const handleCreateMessage = async () => {
    if (!messageForm.title.trim() || !messageForm.body.trim()) {
      showErrorToast("Campos obrigatórios", "Preencha título e mensagem.")
      return
    }

    if (messageForm.target === "patient" && !messageForm.patient_id) {
      showErrorToast("Campos obrigatórios", "Selecione um paciente para enviar a mensagem.")
      return
    }

    setIsSavingMessage(true)
    try {
      const created = await messageService.create({
        title: messageForm.title.trim(),
        body: messageForm.body.trim(),
        patient_id: messageForm.target === "all" ? "all" : messageForm.patient_id,
      })
      setMessages((prev) => [created, ...prev])
      setIsMessagesDialogOpen(false)
      setMessageForm({ title: "", body: "", target: "all", patient_id: 0 })
      showSuccessToast("Mensagem enviada", "A mensagem foi criada e ficará visível no portal dos pacientes.")
    } catch (error: any) {
      console.error("Erro ao criar mensagem:", error)
      showErrorToast("Erro", error.response?.data?.message || "Não foi possível criar a mensagem.")
    } finally {
      setIsSavingMessage(false)
    }
  }

  // Tasks functions
  const loadTasks = async () => {
    setIsLoadingTasks(true)
    try {
      const params: any = {}
      if (taskFilter !== "all") {
        params.status = taskFilter
      }
      if (taskSearch.trim()) {
        params.search = taskSearch.trim()
      }
      const { tasks: loadedTasks, stats } = await taskService.getAll(params)
      setTasks(loadedTasks)
      setTaskStats(stats)
    } catch (error: any) {
      console.error("Erro ao carregar tarefas:", error)
      showErrorToast("Erro", "Não foi possível carregar as tarefas.")
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      showErrorToast("Campos obrigatórios", "O título da tarefa é obrigatório.")
      return
    }

    setIsSavingTask(true)
    try {
      const created = await taskService.create({
        title: taskForm.title.trim(),
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        category: taskForm.category,
        due_date: taskForm.due_date || undefined,
        patient_id: taskForm.patient_id || undefined,
      })
      setTasks((prev) => [created, ...prev])
      setIsTaskDialogOpen(false)
      resetTaskForm()
      await loadTasks()
      showSuccessToast("Tarefa criada", "A tarefa foi criada com sucesso.")
    } catch (error: any) {
      console.error("Erro ao criar tarefa:", error)
      showErrorToast("Erro", error.response?.data?.message || "Não foi possível criar a tarefa.")
    } finally {
      setIsSavingTask(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title.trim()) {
      showErrorToast("Campos obrigatórios", "O título da tarefa é obrigatório.")
      return
    }

    setIsSavingTask(true)
    try {
      const updated = await taskService.update(editingTask.id, {
        title: taskForm.title.trim(),
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        category: taskForm.category,
        due_date: taskForm.due_date || undefined,
        patient_id: taskForm.patient_id || undefined,
      })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setIsTaskDialogOpen(false)
      setEditingTask(null)
      resetTaskForm()
      await loadTasks()
      showSuccessToast("Tarefa atualizada", "A tarefa foi atualizada com sucesso.")
    } catch (error: any) {
      console.error("Erro ao atualizar tarefa:", error)
      showErrorToast("Erro", error.response?.data?.message || "Não foi possível atualizar a tarefa.")
    } finally {
      setIsSavingTask(false)
    }
  }

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return

    try {
      await taskService.delete(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      await loadTasks()
      showSuccessToast("Tarefa excluída", "A tarefa foi excluída com sucesso.")
    } catch (error: any) {
      console.error("Erro ao excluir tarefa:", error)
      showErrorToast("Erro", "Não foi possível excluir a tarefa.")
    }
  }

  const handleChangeTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    try {
      if (newStatus === "done") {
        await taskService.complete(task.id)
      } else {
        await taskService.update(task.id, { status: newStatus })
      }
      await loadTasks()
      showSuccessToast("Status atualizado", "O status da tarefa foi atualizado.")
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error)
      showErrorToast("Erro", "Não foi possível atualizar o status da tarefa.")
    }
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
      patient_id: task.patient_id,
    })
    setIsTaskDialogOpen(true)
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      category: "other",
      due_date: "",
      patient_id: null,
    })
    setEditingTask(null)
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "low":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getCategoryLabel = (category: TaskCategory) => {
    const labels: Record<TaskCategory, string> = {
      clinical: "Clínico",
      admin: "Administrativo",
      financial: "Financeiro",
      contact: "Contato",
      preparation: "Preparação",
      planning: "Planejamento",
      other: "Outros",
    }
    return labels[category]
  }

  const isTaskOverdue = (task: Task) => {
    if (!task.due_date || task.status === "done") return false
    return new Date(task.due_date) < new Date()
  }

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter !== "all" && task.status !== taskFilter) return false
    if (taskSearch.trim()) {
      const search = taskSearch.toLowerCase()
      return (
        task.title.toLowerCase().includes(search) ||
        (task.description && task.description.toLowerCase().includes(search))
      )
    }
    return true
  })

  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    done: filteredTasks.filter((t) => t.status === "done"),
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === Number(active.id))
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = Number(active.id)
    let newStatus: TaskStatus | null = null

    // Verificar se está sobre uma coluna (drop zone) - verificar pelo ID ou pelo data
    if (typeof over.id === "string" && ["todo", "in-progress", "done"].includes(over.id)) {
      newStatus = over.id as TaskStatus
    } else if (over.data?.current?.type === "column" && over.data.current.status) {
      // Se o data contém informação da coluna
      newStatus = over.data.current.status as TaskStatus
    } else {
      // Se não está sobre uma coluna, verificar se está sobre outra tarefa
      const overTask = tasks.find((t) => t.id === Number(over.id))
      if (overTask) {
        // Usar o status da tarefa sobre a qual foi solto
        newStatus = overTask.status
      } else {
        return
      }
    }

    // Verificar se a tarefa já está no status correto
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Atualizar status otimisticamente
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus! } : t
    )
    setTasks(updatedTasks)

    try {
      if (newStatus === "done") {
        await taskService.complete(taskId)
      } else {
        await taskService.update(taskId, { status: newStatus! })
      }
      await loadTasks()
      showSuccessToast("Tarefa movida", "A tarefa foi movida com sucesso.")
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error)
      // Reverter mudança em caso de erro
      setTasks(tasks)
      showErrorToast("Erro", "Não foi possível mover a tarefa.")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground text-balance">Comunicações & Tarefas</h1>
            <p className="mt-1 text-muted-foreground">Notificações, mensagens e gestão de tarefas</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              Notificações
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Central de Notificações</CardTitle>
                    {unreadCount > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {unreadCount} {unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}
                      </p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                      Marcar Todas como Lidas
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingNotifications ? (
                  <div className="flex h-40 items-center justify-center text-muted-foreground">
                    Carregando notificações...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
                    <div className="text-center">
                      <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        Nenhuma notificação no momento.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-accent/50 ${
                          notification.read
                            ? "border-border bg-card"
                            : "border-primary/30 bg-primary/5 dark:bg-primary/10"
                        }`}
                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            notification.type === "payment"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : notification.type === "appointment"
                                ? "bg-primary/20"
                                : notification.type === "reminder"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                                  : "bg-secondary/20"
                          }`}
                        >
                          {notification.type === "payment" ? (
                            <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : notification.type === "appointment" ? (
                            <Bell className="h-5 w-5 text-primary" />
                          ) : notification.type === "reminder" ? (
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{notification.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground break-words">
                                {notification.message}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatNotificationTime(notification.created_at)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1" title="Não lida" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações
                </CardTitle>
                <p className="text-sm text-muted-foreground">Gerencie como você recebe notificações</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-base font-semibold">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações no celular quando seus pacientes postarem diários ou responderem quizzes
                    </p>
                    {!isSupported && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {pushError || 'Push notifications não são suportadas neste navegador. Use Chrome, Firefox ou Safari em modo normal (não privado).'}
                      </p>
                    )}
                    {isSupported && permission === 'denied' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Permissão negada. Ative nas configurações do navegador
                      </p>
                    )}
                    {pushError && isSupported && permission !== 'denied' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {pushError}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={isSubscribed}
                    disabled={!isSupported || permission === 'denied' || isPushLoading}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const success = await subscribe()
                        if (success) {
                          toast({
                            title: "Notificações ativadas",
                            description: "Você receberá notificações quando seus pacientes postarem diários ou responderem quizzes.",
                          })
                        } else {
                          toast({
                            title: "Erro ao ativar notificações",
                            description: pushError || "Não foi possível ativar as notificações push.",
                            variant: "destructive"
                          })
                        }
                      } else {
                        await unsubscribe()
                        toast({
                          title: "Notificações desativadas",
                          description: "Você não receberá mais notificações push.",
                        })
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{taskStats.total}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">A Fazer</p>
                      <p className="text-2xl font-bold text-primary">{taskStats.todo}</p>
                    </div>
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Em Progresso</p>
                      <p className="text-2xl font-bold text-yellow-600">{taskStats.in_progress}</p>
                    </div>
                    <PlayCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vencidas</p>
                      <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={taskFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTaskFilter("all")}
                >
                  Todas ({taskStats.total})
                </Button>
                <Button
                  variant={taskFilter === "todo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTaskFilter("todo")}
                >
                  A Fazer ({taskStats.todo})
                </Button>
                <Button
                  variant={taskFilter === "in-progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTaskFilter("in-progress")}
                >
                  Em Progresso ({taskStats.in_progress})
                </Button>
                <Button
                  variant={taskFilter === "done" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTaskFilter("done")}
                >
                  Concluídas ({taskStats.done})
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={taskSearch}
                    onChange={(e) => {
                      setTaskSearch(e.target.value)
                      setTimeout(() => loadTasks(), 300)
                    }}
                    className="pl-9"
                  />
                  {taskSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                      onClick={() => {
                        setTaskSearch("")
                        loadTasks()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Dialog open={isTaskDialogOpen} onOpenChange={(open) => {
                  setIsTaskDialogOpen(open)
                  if (!open) {
                    resetTaskForm()
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingTask ? "Editar Tarefa" : "Criar Nova Tarefa"}</DialogTitle>
                      <DialogDescription>
                        {editingTask ? "Atualize os dados da tarefa" : "Adicione uma nova tarefa à sua lista"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-title">Título da Tarefa *</Label>
                        <Input
                          id="task-title"
                          placeholder="Ex: Atualizar prontuário"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-description">Descrição</Label>
                        <Textarea
                          id="task-description"
                          placeholder="Detalhes adicionais (opcional)"
                          rows={3}
                          value={taskForm.description}
                          onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="priority">Prioridade</Label>
                          <Select
                            value={taskForm.priority}
                            onValueChange={(value: TaskPriority) =>
                              setTaskForm((f) => ({ ...f, priority: value }))
                            }
                          >
                            <SelectTrigger id="priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="low">Baixa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Categoria</Label>
                          <Select
                            value={taskForm.category}
                            onValueChange={(value: TaskCategory) =>
                              setTaskForm((f) => ({ ...f, category: value }))
                            }
                          >
                            <SelectTrigger id="category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="clinical">Clínico</SelectItem>
                              <SelectItem value="admin">Administrativo</SelectItem>
                              <SelectItem value="financial">Financeiro</SelectItem>
                              <SelectItem value="contact">Contato</SelectItem>
                              <SelectItem value="preparation">Preparação</SelectItem>
                              <SelectItem value="planning">Planejamento</SelectItem>
                              <SelectItem value="other">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due-date">Data de Vencimento</Label>
                        <Input
                          id="due-date"
                          type="date"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-patient">Paciente (opcional)</Label>
                        <Select
                          value={taskForm.patient_id ? String(taskForm.patient_id) : undefined}
                          onValueChange={(value) =>
                            setTaskForm((f) => ({ ...f, patient_id: value ? Number(value) : null }))
                          }
                        >
                          <SelectTrigger id="task-patient">
                            <SelectValue placeholder="Nenhum paciente" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.length > 0 ? (
                              patients.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Nenhum paciente disponível
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsTaskDialogOpen(false)
                          resetTaskForm()
                        }}
                        disabled={isSavingTask}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={editingTask ? handleUpdateTask : handleCreateTask} disabled={isSavingTask}>
                        {isSavingTask ? "Salvando..." : editingTask ? "Atualizar" : "Criar Tarefa"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Kanban Board */}
            {isLoadingTasks ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Carregando tarefas...</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* To Do Column */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>A Fazer</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {tasksByStatus.todo.length}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <DroppableColumn id="todo">
                      <CardContent className="space-y-3 min-h-[200px]">
                        <SortableContext
                          id="todo"
                          items={tasksByStatus.todo.map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {tasksByStatus.todo.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                              Arraste tarefas aqui
                            </div>
                          ) : (
                            tasksByStatus.todo.map((task) => (
                              <SortableTaskCard
                                key={task.id}
                                task={task}
                                onEdit={() => openEditTask(task)}
                                onDelete={() => handleDeleteTask(task.id)}
                                onChangeStatus={(status) => handleChangeTaskStatus(task, status)}
                                getPriorityColor={getPriorityColor}
                                getCategoryLabel={getCategoryLabel}
                                isOverdue={isTaskOverdue(task)}
                              />
                            ))
                          )}
                        </SortableContext>
                      </CardContent>
                    </DroppableColumn>
                  </Card>

                  {/* In Progress Column */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>Em Progresso</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {tasksByStatus["in-progress"].length}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <DroppableColumn id="in-progress">
                      <CardContent className="space-y-3 min-h-[200px]">
                        <SortableContext
                          id="in-progress"
                          items={tasksByStatus["in-progress"].map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {tasksByStatus["in-progress"].length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                              Arraste tarefas aqui
                            </div>
                          ) : (
                            tasksByStatus["in-progress"].map((task) => (
                              <SortableTaskCard
                                key={task.id}
                                task={task}
                                onEdit={() => openEditTask(task)}
                                onDelete={() => handleDeleteTask(task.id)}
                                onChangeStatus={(status) => handleChangeTaskStatus(task, status)}
                                getPriorityColor={getPriorityColor}
                                getCategoryLabel={getCategoryLabel}
                                isOverdue={isTaskOverdue(task)}
                              />
                            ))
                          )}
                        </SortableContext>
                      </CardContent>
                    </DroppableColumn>
                  </Card>

                  {/* Done Column */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>Concluídas</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {tasksByStatus.done.length}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <DroppableColumn id="done">
                      <CardContent className="space-y-3 min-h-[200px]">
                        <SortableContext
                          id="done"
                          items={tasksByStatus.done.map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {tasksByStatus.done.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                              Arraste tarefas aqui
                            </div>
                          ) : (
                            tasksByStatus.done.map((task) => (
                              <SortableTaskCard
                                key={task.id}
                                task={task}
                                onEdit={() => openEditTask(task)}
                                onDelete={() => handleDeleteTask(task.id)}
                                onChangeStatus={(status) => handleChangeTaskStatus(task, status)}
                                getPriorityColor={getPriorityColor}
                                getCategoryLabel={getCategoryLabel}
                                isOverdue={false}
                                isDone
                              />
                            ))
                          )}
                        </SortableContext>
                      </CardContent>
                    </DroppableColumn>
                  </Card>
                </div>


                <DragOverlay>
                  {activeTask ? (
                    <TaskCardOverlay
                      task={activeTask}
                      getPriorityColor={getPriorityColor}
                      getCategoryLabel={getCategoryLabel}
                      isOverdue={isTaskOverdue(activeTask)}
                      isDone={activeTask.status === "done"}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Mensagens para Pacientes</CardTitle>
                  <Dialog open={isMessagesDialogOpen} onOpenChange={setIsMessagesDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Mensagem
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Criar Mensagem</DialogTitle>
                        <DialogDescription>
                          Envie uma mensagem geral para todos os pacientes ou uma mensagem específica.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="message-title">Título</Label>
                          <Input
                            id="message-title"
                            value={messageForm.title}
                            onChange={(e) => setMessageForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Ex.: Mensagem da semana sobre autocuidado"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message-target">Enviar para</Label>
                          <Select
                            value={messageForm.target}
                            onValueChange={(value: "all" | "patient") =>
                              setMessageForm((f) => ({ ...f, target: value }))
                            }
                          >
                            <SelectTrigger id="message-target">
                              <SelectValue placeholder="Selecione o público" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os pacientes</SelectItem>
                              <SelectItem value="patient">Paciente específico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {messageForm.target === "patient" && (
                          <div className="space-y-2">
                            <Label htmlFor="message-patient">Paciente</Label>
                            <Select
                              value={messageForm.patient_id ? String(messageForm.patient_id) : undefined}
                              onValueChange={(value) =>
                                setMessageForm((f) => ({ ...f, patient_id: Number(value) }))
                              }
                            >
                              <SelectTrigger id="message-patient">
                                <SelectValue placeholder="Selecione o paciente" />
                              </SelectTrigger>
                              <SelectContent>
                                {patients.length > 0 ? (
                                  patients.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                      {p.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Nenhum paciente disponível
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="message-body">Mensagem</Label>
                          <Textarea
                            id="message-body"
                            value={messageForm.body}
                            onChange={(e) => setMessageForm((f) => ({ ...f, body: e.target.value }))}
                            placeholder="Escreva uma mensagem acolhedora, com orientações e recomendações para a semana..."
                            rows={5}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsMessagesDialogOpen(false)
                            setMessageForm({ title: "", body: "", target: "all", patient_id: 0 })
                          }}
                          disabled={isSavingMessage}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateMessage} disabled={isSavingMessage}>
                          {isSavingMessage ? "Enviando..." : "Enviar mensagem"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex h-40 items-center justify-center text-muted-foreground">
                    Carregando mensagens...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 text-sm text-muted-foreground">
                        Nenhuma mensagem criada ainda. Clique em &quot;Nova Mensagem&quot; para começar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <Card key={msg.id} className="border-border">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <MessageSquare className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{msg.title}</p>
                                  {msg.patient ? (
                                    <Badge variant="outline" className="text-xs">
                                      Para: {msg.patient.name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      Todos os pacientes
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                                  {msg.body}
                                </p>
                              </div>
                            </div>
                            {msg.sent_at && (
                              <span className="text-xs text-muted-foreground">
                                Enviada em {new Date(msg.sent_at).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Templates de Notificação */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Templates de Notificação Push
                    </CardTitle>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Personalize as mensagens enviadas aos pacientes quando eventos ocorrem
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveTemplates}
                    disabled={isSavingTemplates || isLoadingTemplates}
                    className="gap-2"
                  >
                    {isSavingTemplates ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Templates
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notifTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum template disponível
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Para o Paciente */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Para o Paciente</h3>
                        <Badge variant="secondary" className="text-xs">
                          Recebidas no app do paciente
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {notifTemplates
                          .filter((t) => (templateRecipient[t.type] ?? "psychologist") === "patient")
                          .map((template) => (
                            <div key={template.id} className="space-y-3 rounded-lg border p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">
                                      {templateTypeLabels[template.type] || template.type}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {template.type}
                                    </Badge>
                                  </div>
                            {templatePlaceholders[template.type]?.length > 0 && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Placeholders disponíveis:{" "}
                                    {templatePlaceholders[template.type].join(", ")}
                                  </p>
                                )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`template-${template.id}-enabled`}
                                    className="text-sm text-muted-foreground"
                                  >
                                    {template.enabled ? "Ativa" : "Inativa"}
                                  </Label>
                                  <Switch
                                    id={`template-${template.id}-enabled`}
                                    checked={template.enabled}
                                    onCheckedChange={(checked) => {
                                      setNotifTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id ? { ...t, enabled: checked } : t
                                        )
                                      )
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <Label htmlFor={`template-${template.id}-title`}>Título</Label>
                                  <Input
                                    id={`template-${template.id}-title`}
                                    value={template.title_template}
                                    onChange={(e) => {
                                      setNotifTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id
                                            ? { ...t, title_template: e.target.value }
                                            : t
                                        )
                                      )
                                    }}
                                    placeholder="Título da notificação"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor={`template-${template.id}-body`}>Corpo (opcional)</Label>
                                  <Textarea
                                    id={`template-${template.id}-body`}
                                    value={template.body_template}
                                    onChange={(e) => {
                                      setNotifTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id
                                            ? { ...t, body_template: e.target.value }
                                            : t
                                        )
                                      )
                                    }}
                                    placeholder="Corpo da notificação (opcional)"
                                    rows={2}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Para a Psicóloga */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Para a Psicóloga</h3>
                        <Badge variant="secondary" className="text-xs">
                          Recebidas no seu painel
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {notifTemplates
                          .filter((t) => (templateRecipient[t.type] ?? "psychologist") === "psychologist")
                          .map((template) => (
                            <div key={template.id} className="space-y-3 rounded-lg border p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">
                                      {templateTypeLabels[template.type] || template.type}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {template.type}
                                    </Badge>
                                  </div>
                                  {templatePlaceholders[template.type]?.length > 0 && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Placeholders disponíveis:{" "}
                                      {templatePlaceholders[template.type].join(", ")}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`template-${template.id}-enabled`}
                                    className="text-sm text-muted-foreground"
                                  >
                                    {template.enabled ? "Ativa" : "Inativa"}
                                  </Label>
                                  <Switch
                                    id={`template-${template.id}-enabled`}
                                    checked={template.enabled}
                                    onCheckedChange={(checked) => {
                                      setNotifTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id ? { ...t, enabled: checked } : t
                                        )
                                      )
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <Label htmlFor={`template-${template.id}-title`}>Título</Label>
                                  <Input
                                    id={`template-${template.id}-title`}
                                    value={template.title_template}
                                    onChange={(e) => {
                                      setNotifTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id
                                            ? { ...t, title_template: e.target.value }
                                            : t
                                        )
                                      )
                                    }}
                                    placeholder="Título da notificação"
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor={`template-${template.id}-body`}>Corpo (opcional)</Label>
                                  <Textarea
                                    id={`template-${template.id}-body`}
                                    value={template.body_template}
                                    onChange={(e) => {
                                      setNotifTemplates((prev) =>
                                        prev.map((t) =>
                                          t.id === template.id
                                            ? { ...t, body_template: e.target.value }
                                            : t
                                        )
                                      )
                                    }}
                                    placeholder="Corpo da notificação (opcional)"
                                    rows={2}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Regras de Lembrete de Sessão */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Lembretes de Sessão
                      <Badge variant="secondary" className="text-xs font-normal">
                        Para o Paciente
                      </Badge>
                    </CardTitle>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Configure quando os pacientes devem receber lembretes de suas sessões
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Regra
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Nova Regra de Lembrete</DialogTitle>
                          <DialogDescription>
                            Crie uma nova regra para enviar lembretes aos pacientes
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-4">
                          <div>
                            <Label htmlFor="new-rule-offset">Enviar quanto tempo antes?</Label>
                            <Select
                              value={newRule.offset_minutes?.toString()}
                              onValueChange={(value) =>
                                setNewRule((prev) => ({ ...prev, offset_minutes: parseInt(value) }))
                              }
                            >
                              <SelectTrigger id="new-rule-offset" className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 minutos antes</SelectItem>
                                <SelectItem value="60">1 hora antes</SelectItem>
                                <SelectItem value="120">2 horas antes</SelectItem>
                                <SelectItem value="180">3 horas antes</SelectItem>
                                <SelectItem value="360">6 horas antes</SelectItem>
                                <SelectItem value="720">12 horas antes</SelectItem>
                                <SelectItem value="1440">1 dia antes (24h)</SelectItem>
                                <SelectItem value="2880">2 dias antes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="new-rule-title">
                              Título <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="new-rule-title"
                              value={newRule.title_template}
                              onChange={(e) =>
                                setNewRule((prev) => ({ ...prev, title_template: e.target.value }))
                              }
                              placeholder="Ex: Lembrete: sessão amanhã ✨"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="new-rule-body">Corpo (opcional)</Label>
                            <Textarea
                              id="new-rule-body"
                              value={newRule.body_template}
                              onChange={(e) =>
                                setNewRule((prev) => ({ ...prev, body_template: e.target.value }))
                              }
                              placeholder="Ex: {datetime}"
                              rows={2}
                              className="mt-1"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Placeholders: {sessionPlaceholders.join(", ")}
                            </p>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="new-rule-enabled" className="cursor-pointer">
                              Ativar regra imediatamente
                            </Label>
                            <Switch
                              id="new-rule-enabled"
                              checked={newRule.enabled}
                              onCheckedChange={(checked) =>
                                setNewRule((prev) => ({ ...prev, enabled: checked }))
                              }
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsAddRuleDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleAddRule} className="flex-1">
                              Adicionar Regra
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={handleSaveRules}
                      disabled={isSavingRules || isLoadingRules}
                      className="gap-2"
                    >
                      {isSavingRules ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Regras
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRules ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionRules
                      .sort((a, b) => b.offset_minutes - a.offset_minutes)
                      .map((rule) => (
                        <div key={rule.id} className="space-y-3 rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {formatOffsetMinutes(rule.offset_minutes)}
                                </Badge>
                                <Badge variant={rule.enabled ? "default" : "outline"}>
                                  {rule.enabled ? "Ativa" : "Inativa"}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Janela de busca: {rule.window_minutes || 60} minutos
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => {
                                  setSessionRules((prev) =>
                                    prev.map((r) => (r.id === rule.id ? { ...r, enabled: checked } : r))
                                  )
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <Label>Título</Label>
                              <Input
                                value={rule.title_template}
                                onChange={(e) => {
                                  setSessionRules((prev) =>
                                    prev.map((r) =>
                                      r.id === rule.id ? { ...r, title_template: e.target.value } : r
                                    )
                                  )
                                }}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label>Corpo (opcional)</Label>
                              <Textarea
                                value={rule.body_template}
                                onChange={(e) => {
                                  setSessionRules((prev) =>
                                    prev.map((r) =>
                                      r.id === rule.id ? { ...r, body_template: e.target.value } : r
                                    )
                                  )
                                }}
                                rows={2}
                                className="mt-1"
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                Placeholders: {sessionPlaceholders.join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {sessionRules.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma regra de lembrete configurada. Clique em "Adicionar Regra" para criar
                        uma.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-semibold">Informações importantes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      <li>
                        Templates desativados não enviarão notificações mesmo que o evento ocorra
                      </li>
                      <li>
                        Regras de lembrete são executadas automaticamente a cada hora pelo sistema
                      </li>
                      <li>Use placeholders para personalizar as mensagens dinamicamente</li>
                      <li>
                        Ao salvar, todos os templates/regras serão atualizados (envie sempre todos)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
