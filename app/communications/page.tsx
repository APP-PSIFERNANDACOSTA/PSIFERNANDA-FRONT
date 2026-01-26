"use client"

import { useEffect, useState } from "react"
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
  Edit,
  Calendar,
  AlertCircle,
  Clock,
  Search,
  Filter,
  X,
  PlayCircle,
  RotateCcw,
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

  useEffect(() => {
    loadMessages()
    loadPatients()
    loadTasks()
    loadNotifications()
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

        <Tabs defaultValue="notifications" className="space-y-6">
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
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
