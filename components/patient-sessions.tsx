"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Trash2, Edit, Clock, CheckCircle2, CalendarClock, AlertCircle, X, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import sessionService from "@/services/session-service"
import sessionReportService from "@/services/session-report-service"
import type { Session, CreateSessionData } from "@/types/session"
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from "@/types/session"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PatientSessionsProps {
  patientId: number
  patientName: string
  priceSession?: number | null
}

export function PatientSessions({ patientId, patientName, priceSession }: PatientSessionsProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [sessionToReschedule, setSessionToReschedule] = useState<Session | null>(null)
  const [rescheduleData, setRescheduleData] = useState({
    session_date: '',
    duration: 50,
    notes: '',
  })
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [sessionReports, setSessionReports] = useState<Record<number, boolean>>({})
  const [loadingReports, setLoadingReports] = useState<Record<number, boolean>>({})
  const [sessionsToCreate, setSessionsToCreate] = useState<CreateSessionData[]>([
    {
      session_date: '',
      duration: 50,
      status: 'scheduled',
    }
  ])
  // Estados separados para data e hora (para melhor UX)
  const [sessionDates, setSessionDates] = useState<string[]>([''])
  const [sessionTimes, setSessionTimes] = useState<string[]>([''])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringWeeks, setRecurringWeeks] = useState(4)

  useEffect(() => {
    loadSessions()
  }, [patientId])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const data = await sessionService.getPatientSessions(patientId)
      setSessions(data)
      // Verificar quais sessões têm relatório
      checkReportsForSessions(data)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar sessões",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const checkReportsForSessions = async (sessionsList: Session[]) => {
    const reports: Record<number, boolean> = {}
    const loading: Record<number, boolean> = {}
    
    for (const session of sessionsList) {
      loading[session.id] = true
      try {
        const { exists } = await sessionReportService.exists(patientId, session.id)
        reports[session.id] = exists
      } catch (error) {
        reports[session.id] = false
      } finally {
        loading[session.id] = false
      }
    }
    
    setSessionReports(reports)
    setLoadingReports(loading)
  }

  const handleViewReport = (sessionId: number) => {
    router.push(`/dashboard/patients/${patientId}/sessions/${sessionId}/report`)
  }

  const handleAddSessionField = () => {
    setSessionsToCreate([
      ...sessionsToCreate,
      {
        session_date: '',
        duration: 50,
        status: 'scheduled',
      }
    ])
    setSessionDates([...sessionDates, ''])
    setSessionTimes([...sessionTimes, ''])
  }

  const handleRemoveSessionField = (index: number) => {
    const newSessions = sessionsToCreate.filter((_, i) => i !== index)
    setSessionsToCreate(newSessions)
    setSessionDates(sessionDates.filter((_, i) => i !== index))
    setSessionTimes(sessionTimes.filter((_, i) => i !== index))
  }

  const handleDateChange = (index: number, date: string) => {
    const newDates = [...sessionDates]
    newDates[index] = date
    setSessionDates(newDates)
    
    // Combinar data e hora
    const time = sessionTimes[index] || '09:00'
    if (date && time) {
      const combinedDateTime = `${date}T${time}`
      const newSessions = [...sessionsToCreate]
      newSessions[index] = {
        ...newSessions[index],
        session_date: combinedDateTime
      }
      setSessionsToCreate(newSessions)
    }
  }

  const handleTimeChange = (index: number, time: string) => {
    const newTimes = [...sessionTimes]
    newTimes[index] = time
    setSessionTimes(newTimes)
    
    // Combinar data e hora
    const date = sessionDates[index] || ''
    if (date && time) {
      const combinedDateTime = `${date}T${time}`
      const newSessions = [...sessionsToCreate]
      newSessions[index] = {
        ...newSessions[index],
        session_date: combinedDateTime
      }
      setSessionsToCreate(newSessions)
    }
  }

  const handleSessionChange = (index: number, field: keyof CreateSessionData, value: any) => {
    const newSessions = [...sessionsToCreate]
    newSessions[index] = {
      ...newSessions[index],
      [field]: value
    }
    setSessionsToCreate(newSessions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Validar que todas as sessões têm data e hora
      const invalidSessions = sessionsToCreate.filter((s, idx) => {
        const hasDate = sessionDates[idx] && sessionDates[idx].trim() !== ''
        const hasTime = sessionTimes[idx] && sessionTimes[idx].trim() !== ''
        return !hasDate || !hasTime || !s.session_date
      })
      if (invalidSessions.length > 0) {
        showErrorToast("Erro", "Todas as sessões devem ter data e horário preenchidos")
        return
      }

      let sessionsToSend = [...sessionsToCreate]

      // Se recorrente estiver marcado, criar sessões semanais adicionais
      if (isRecurring && sessionsToCreate.length > 0) {
        const baseSession = sessionsToCreate[0]
        if (baseSession.session_date) {
          const baseDate = new Date(baseSession.session_date)
          
          // Criar sessões para as próximas semanas
          for (let week = 1; week < recurringWeeks; week++) {
            const nextDate = new Date(baseDate)
            nextDate.setDate(nextDate.getDate() + (week * 7))
            
            // Formatar para datetime-local
            const year = nextDate.getFullYear()
            const month = String(nextDate.getMonth() + 1).padStart(2, '0')
            const day = String(nextDate.getDate()).padStart(2, '0')
            const hours = String(nextDate.getHours()).padStart(2, '0')
            const minutes = String(nextDate.getMinutes()).padStart(2, '0')
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
            
            sessionsToSend.push({
              session_date: formattedDate,
              duration: baseSession.duration || null,
              notes: baseSession.notes || null,
              status: baseSession.status || 'scheduled',
            })
          }
        }
      }

      await sessionService.createSessions(patientId, {
        sessions: sessionsToSend
      })

      showSuccessToast(
        "Sessões criadas",
        `${sessionsToSend.length} sessão(ões) criada(s) com sucesso${isRecurring ? ` (${recurringWeeks} semanas recorrentes)` : ''}`
      )
      
      // Resetar formulário
      setSessionsToCreate([{
        session_date: '',
        duration: 50,
        status: 'scheduled',
      }])
      setSessionDates([''])
      setSessionTimes([''])
      setIsRecurring(false)
      setRecurringWeeks(4)
      setShowForm(false)
      loadSessions()
    } catch (error: any) {
      showErrorToast(
        "Erro ao criar sessões",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsCreating(false)
    }
  }

  const handleMarkAsCompleted = async (sessionId: number) => {
    try {
      await sessionService.markAsCompleted(patientId, sessionId)
      showSuccessToast("Sessão concluída", "Sessão marcada como realizada com sucesso")
      loadSessions()
    } catch (error: any) {
      showErrorToast(
        "Erro ao marcar sessão",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const handleMarkAsNoShow = async (sessionId: number) => {
    try {
      await sessionService.markAsNoShow(patientId, sessionId)
      showSuccessToast("Sessão marcada como falta", "Sessão de falta registrada com sucesso")
      loadSessions()
    } catch (error: any) {
      showErrorToast(
        "Erro ao marcar sessão",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const handleOpenReschedule = (session: Session) => {
    // Formatar data para datetime-local
    const date = new Date(session.session_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
    
    setSessionToReschedule(session)
    setRescheduleData({
      session_date: formattedDate,
      duration: session.duration || 50,
      notes: session.notes || '',
    })
    setShowRescheduleModal(true)
  }

  const handleReschedule = async () => {
    if (!sessionToReschedule) return
    if (!rescheduleData.session_date) {
      showErrorToast("Erro", "Data e hora são obrigatórias")
      return
    }

    setIsRescheduling(true)
    try {
      await sessionService.reschedule(patientId, sessionToReschedule.id, {
        session_date: rescheduleData.session_date,
        duration: rescheduleData.duration || null,
        notes: rescheduleData.notes || null,
      })
      showSuccessToast("Sessão remarcada", "Sessão remarcada com sucesso")
      setShowRescheduleModal(false)
      setSessionToReschedule(null)
      loadSessions()
    } catch (error: any) {
      showErrorToast(
        "Erro ao remarcar sessão",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) {
      return
    }

    try {
      await sessionService.deleteSession(patientId, sessionId)
      showSuccessToast("Sessão excluída", "Sessão excluída com sucesso")
      loadSessions()
    } catch (error: any) {
      showErrorToast(
        "Erro ao excluir sessão",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Botão para adicionar sessões */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Sessões</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as sessões agendadas de {patientName}
          </p>
        </div>
        <Button onClick={() => {
          if (!showForm) {
            // Inicializar arrays quando abrir o formulário
            setSessionDates([''])
            setSessionTimes([''])
          }
          setShowForm(!showForm)
        }} className="gap-2" variant={showForm ? "outline" : "default"}>
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Adicionar Sessões
            </>
          )}
        </Button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {sessionsToCreate.map((session, index) => (
                <Card key={index} className="p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Sessão {index + 1}</h4>
                    {sessionsToCreate.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSessionField(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`session_date_${index}`}>Data *</Label>
                      <Input
                        id={`session_date_${index}`}
                        type="date"
                        value={sessionDates[index] || ''}
                        onChange={(e) => handleDateChange(index, e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`session_time_${index}`}>Horário *</Label>
                      <Input
                        id={`session_time_${index}`}
                        type="time"
                        value={sessionTimes[index] || ''}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`duration_${index}`}>Duração (minutos)</Label>
                      <Input
                        id={`duration_${index}`}
                        type="number"
                        min="15"
                        max="300"
                        step="15"
                        value={session.duration || ''}
                        onChange={(e) => handleSessionChange(index, 'duration', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`status_${index}`}>Status</Label>
                      <select
                        id={`status_${index}`}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={session.status || 'scheduled'}
                        onChange={(e) => handleSessionChange(index, 'status', e.target.value as any)}
                      >
                        <option value="scheduled">Agendada</option>
                        <option value="rescheduled">Remarcada</option>
                        <option value="completed">Realizada</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="no_show">Falta</option>
                      </select>
                    </div>
                  </div>
                  
                  {priceSession && (
                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                      💰 <strong>Valor da sessão:</strong> R$ {Number(priceSession).toFixed(2)} (valor padrão do paciente)
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor={`notes_${index}`}>Notas (opcional)</Label>
                    <textarea
                      id={`notes_${index}`}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={session.notes || ''}
                      onChange={(e) => handleSessionChange(index, 'notes', e.target.value || null)}
                      placeholder="Adicione notas sobre a sessão..."
                    />
                  </div>
                </Card>
              ))}

              {/* Opção de Recorrência Semanal */}
              {sessionsToCreate.length === 1 && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="isRecurring" className="font-medium cursor-pointer">
                        📅 Sessão recorrente semanal (mesmo dia e horário toda semana)
                      </Label>
                    </div>
                    
                    {isRecurring && (
                      <div className="space-y-2 pl-7">
                        <Label htmlFor="recurringWeeks">Quantas semanas? *</Label>
                        <select
                          id="recurringWeeks"
                          value={recurringWeeks}
                          onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="4">4 semanas (1 mês)</option>
                          <option value="8">8 semanas (2 meses)</option>
                          <option value="12">12 semanas (3 meses)</option>
                          <option value="16">16 semanas (4 meses)</option>
                          <option value="24">24 semanas (6 meses)</option>
                          <option value="52">52 semanas (1 ano)</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Serão criadas {recurringWeeks} sessões no mesmo dia e horário, uma por semana
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSessionField}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Mais Uma Sessão
                </Button>
                
                <Button type="submit" disabled={isCreating} className="gap-2">
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Criar {sessionsToCreate.length} Sessão(ões)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de sessões */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Nenhuma sessão encontrada</p>
            <p className="text-muted-foreground">
              Clique em "Adicionar Sessões" para criar novas sessões
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {formatDate(session.session_date)}
                  </CardTitle>
                  <Badge className={SESSION_STATUS_COLORS[session.status]}>
                    {SESSION_STATUS_LABELS[session.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatTime(session.session_date)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{session.duration} minutos</span>
                  </div>
                )}
                {session.notes && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Notas:</p>
                    <p className="line-clamp-3">{session.notes}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {/* Botão de Relatório */}
                  {loadingReports[session.id] ? (
                    <Button variant="outline" size="sm" disabled className="gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </Button>
                  ) : sessionReports[session.id] ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleViewReport(session.id)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Ver Relatório
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(session.id)}
                      className="gap-2 border-dashed"
                    >
                      <FileText className="h-4 w-4" />
                      Relatório+
                    </Button>
                  )}

                  {session.status !== 'completed' && session.status !== 'no_show' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMarkAsCompleted(session.id)}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como Concluída
                    </Button>
                  )}
                  {(session.status === 'scheduled' || session.status === 'rescheduled') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsNoShow(session.id)}
                        className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Marcar como Falta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReschedule(session)}
                        className="gap-2"
                      >
                        <CalendarClock className="h-4 w-4" />
                        Remarcar
                      </Button>
                    </>
                  )}
                  {session.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Remarcar */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarcar Sessão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule_date">Nova Data e Hora *</Label>
              <Input
                id="reschedule_date"
                type="datetime-local"
                value={rescheduleData.session_date}
                onChange={(e) => setRescheduleData({
                  ...rescheduleData,
                  session_date: e.target.value
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule_duration">Duração (minutos)</Label>
              <Input
                id="reschedule_duration"
                type="number"
                min="15"
                max="300"
                value={rescheduleData.duration || ''}
                onChange={(e) => setRescheduleData({
                  ...rescheduleData,
                  duration: e.target.value ? parseInt(e.target.value) : null
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule_notes">Notas (opcional)</Label>
              <textarea
                id="reschedule_notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={rescheduleData.notes}
                onChange={(e) => setRescheduleData({
                  ...rescheduleData,
                  notes: e.target.value
                })}
                placeholder="Adicione notas sobre a remarcação..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRescheduleModal(false)}
                disabled={isRescheduling}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={isRescheduling}
                className="gap-2"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Remarcando...
                  </>
                ) : (
                  <>
                    <CalendarClock className="h-4 w-4" />
                    Remarcar Sessão
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

