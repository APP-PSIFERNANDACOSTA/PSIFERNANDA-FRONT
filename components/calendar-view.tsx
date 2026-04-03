"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle2, Trash2, AlertCircle, X, Save, Video, ExternalLink, Pencil } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Session, SessionStatus } from "@/types/session"
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from "@/types/session"
import type { GoogleCalendarEvent } from "@/services/google-oauth-service"

/** Mapeamento das cores do Google Calendar (colorId) - https://developers.google.com/workspace/calendar/api/v3/reference/colors */
const GOOGLE_CALENDAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "1": { bg: "#7986CB", text: "#fff", border: "#5c6bc0" },   // Lavender
  "2": { bg: "#33B679", text: "#fff", border: "#2e9d6a" },   // Sage
  "3": { bg: "#8E24AA", text: "#fff", border: "#701e88" },   // Grape
  "4": { bg: "#E67C73", text: "#fff", border: "#e04a3f" },  // Flamingo
  "5": { bg: "#F6BF26", text: "#1a1a1a", border: "#d4a01f" }, // Banana
  "6": { bg: "#F4511E", text: "#fff", border: "#d84315" },   // Tangerine
  "7": { bg: "#039BE5", text: "#fff", border: "#0288d1" },  // Peacock
  "8": { bg: "#616161", text: "#fff", border: "#424242" },   // Graphite
  "9": { bg: "#3F51B5", text: "#fff", border: "#303f9f" },  // Blueberry
  "10": { bg: "#0B8043", text: "#fff", border: "#06602e" },  // Basil
  "11": { bg: "#D50000", text: "#fff", border: "#b71c1c" }, // Tomato
}
const DEFAULT_GOOGLE_COLOR = { bg: "#F6BF26", text: "#1a1a1a", border: "#d4a01f" } // Banana (padrão)
import sessionService from "@/services/session-service"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import {
  buildSaoPauloCalendarDays,
  formatBrazilCalendarDayNumber,
  formatSessionInstantInLocalTimezone,
  formatSessionInstantInSaoPaulo,
  getBrazilWallDateKey,
  getSaoPauloTodayNoonDate,
  isSaoPauloWallMonthEqual,
  isSameSaoPauloCalendarDay,
  saoPauloMonthRangeUtcIso,
  saoPauloWallDateTimeToUtcIso,
  utcIsoToSaoPauloDateAndTime,
} from "@/lib/session-datetime-br"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CalendarViewProps {
  onSessionClick?: (session: Session) => void
  googleEvents?: GoogleCalendarEvent[]
  onMonthChange?: (date: Date) => void
  /** Incrementar para forçar recarregar sessões do mês (ex.: após envio ao Google). */
  sessionListSyncNonce?: number
}

export function CalendarView({
  onSessionClick,
  googleEvents = [],
  onMonthChange,
  sessionListSyncNonce = 0,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleCalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGoogleEventModalOpen, setIsGoogleEventModalOpen] = useState(false)
  const [isActioning, setIsActioning] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showTodayList, setShowTodayList] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showSessionEditForm, setShowSessionEditForm] = useState(false)
  const [editSessionDate, setEditSessionDate] = useState<string>("")
  const [editSessionTime, setEditSessionTime] = useState<string>("")
  const [editSessionDuration, setEditSessionDuration] = useState<number | null>(null)
  const [editSessionNotes, setEditSessionNotes] = useState<string>("")

  const openSessionEditForm = (session: Session) => {
    const { date, time } = utcIsoToSaoPauloDateAndTime(session.session_date)
    setEditSessionDate(date)
    setEditSessionTime(time)
    setEditSessionDuration(session.duration)
    setEditSessionNotes(session.notes ?? "")
    setShowSessionEditForm(true)
  }

  const resetSessionEditForm = () => {
    setShowSessionEditForm(false)
    setEditSessionDate("")
    setEditSessionTime("")
    setEditSessionDuration(null)
    setEditSessionNotes("")
  }

  const loadSessionsForCurrentMonth = async () => {
    setIsLoading(true)
    try {
      const { start, end } = saoPauloMonthRangeUtcIso(currentDate)
      const data = await sessionService.getAllSessions({
        start_date: start,
        end_date: end,
      })
      setSessions(data)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar sessões",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useAutoRefresh(loadSessionsForCurrentMonth, { intervalMs: 60000 })

  useEffect(() => {
    loadSessionsForCurrentMonth()
    onMonthChange?.(currentDate)
  }, [currentDate])

  useEffect(() => {
    if (sessionListSyncNonce > 0) {
      loadSessionsForCurrentMonth()
    }
  }, [sessionListSyncNonce])

  const days = useMemo(
    () => buildSaoPauloCalendarDays(currentDate),
    [currentDate]
  )

  const todayBrazilDateKey = getBrazilWallDateKey(getSaoPauloTodayNoonDate())

  /** Não mostrar no calendário eventos do Google que já têm sessão vinculada (evita “dois” blocos). */
  const linkedGoogleEventIds = useMemo(
    () =>
      new Set(
        sessions
          .map((s) => s.google_event_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    [sessions]
  )

  const getSessionsForDay = (day: Date) => {
    return sessions.filter((session) => isSameSaoPauloCalendarDay(session.session_date, day))
  }

  const getGoogleEventsForDay = (day: Date) => {
    return googleEvents.filter((ev) => {
      if (linkedGoogleEventIds.has(ev.id)) return false
      return isSameSaoPauloCalendarDay(ev.start, day)
    })
  }

  const nextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    setCurrentDate(newDate)
  }

  const prevMonth = () => {
    const newDate = subMonths(currentDate, 1)
    setCurrentDate(newDate)
  }

  const today = () => {
    const todayAnchor = getSaoPauloTodayNoonDate()
    setCurrentDate(new Date(todayAnchor.getTime()))
    setSelectedDay(new Date(todayAnchor.getTime()))
    setShowTodayList(true)
    setViewMode("list")
  }

  const getSessionsForSelectedDay = () => {
    if (!selectedDay) return []
    return sessions.filter((session) =>
      isSameSaoPauloCalendarDay(session.session_date, selectedDay)
    ).sort((a, b) => {
      return new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    })
  }

  const getGoogleEventsForSelectedDay = () => {
    if (!selectedDay) return []
    return googleEvents
      .filter((ev) => {
        if (linkedGoogleEventIds.has(ev.id)) return false
        return isSameSaoPauloCalendarDay(ev.start, selectedDay)
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  const getGoogleEventStyle = (ev: GoogleCalendarEvent) => {
    const c = ev.colorId ? GOOGLE_CALENDAR_COLORS[ev.colorId] ?? DEFAULT_GOOGLE_COLOR : DEFAULT_GOOGLE_COLOR
    return { backgroundColor: c.bg, color: c.text, borderColor: c.border }
  }

  const formatTime = (dateString: string) => {
    return formatSessionInstantInLocalTimezone(dateString, "HH:mm")
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {viewMode === "list" && selectedDay
                ? `Sessões de ${formatSessionInstantInSaoPaulo(selectedDay.toISOString(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                : format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex gap-2">
              {viewMode === 'list' ? (
                <Button variant="outline" size="sm" onClick={() => setViewMode('calendar')}>
                  Voltar ao Calendário
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={today}>
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div key={day} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((day, index) => {
                const daySessions = getSessionsForDay(day)
                const dayGoogleEvents = getGoogleEventsForDay(day)
                const isCurrentMonth = isSaoPauloWallMonthEqual(
                  day,
                  currentDate.getFullYear(),
                  currentDate.getMonth()
                )
                const isToday = getBrazilWallDateKey(day) === todayBrazilDateKey
                const isSelectedDay =
                  selectedDay !== null && getBrazilWallDateKey(day) === getBrazilWallDateKey(selectedDay)

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDay(new Date(day.getTime()))
                      setShowTodayList(true)
                      setViewMode("list")
                    }}
                    className={`min-h-[120px] bg-white p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                    } ${isToday ? "bg-blue-50 border-blue-300 border-2" : ""} ${
                      isSelectedDay ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? "text-blue-600 font-bold" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {formatBrazilCalendarDayNumber(day)}
                    </div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            resetSessionEditForm()
                            setSelectedSession(session)
                            setIsModalOpen(true)
                            onSessionClick?.(session)
                          }}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-90 transition-opacity truncate relative z-[1] border ${
                            SESSION_STATUS_COLORS[session.status]
                          }`}
                          title={`${formatTime(session.session_date)} - ${session.patient?.name || "Sem paciente"} - ${SESSION_STATUS_LABELS[session.status]}`}
                        >
                          <div className="font-medium">{formatTime(session.session_date)}</div>
                          <div className="truncate">
                            Sessão: {session.patient?.name || "Sem paciente"}
                          </div>
                        </div>
                      ))}
                      {dayGoogleEvents.slice(0, 3 - daySessions.length).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGoogleEvent(ev)
                            setIsGoogleEventModalOpen(true)
                          }}
                          className="text-xs p-1 rounded truncate border cursor-pointer hover:opacity-90 transition-opacity relative z-0"
                          style={getGoogleEventStyle(ev)}
                          title={`${formatSessionInstantInLocalTimezone(ev.start, "HH:mm")} - ${ev.summary} (Google) - Clique para ver detalhes`}
                        >
                          <div className="font-medium">{formatSessionInstantInLocalTimezone(ev.start, "HH:mm")}</div>
                          <div className="truncate">{ev.summary}</div>
                        </div>
                      ))}
                      {(daySessions.length + dayGoogleEvents.length) > 3 && (
                        <div className="text-xs text-gray-500 font-medium px-1">
                          +{daySessions.length + dayGoogleEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Visualização em Lista
            <div className="space-y-3">
              {getSessionsForSelectedDay().length === 0 && getGoogleEventsForSelectedDay().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-lg">Nenhuma sessão agendada para este dia</p>
                  <p className="text-sm mt-2">Clique em "Voltar ao Calendário" ou importe eventos do Google</p>
                </div>
              ) : (
                <>
                {getSessionsForSelectedDay().map((session) => (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      resetSessionEditForm()
                      setSelectedSession(session)
                      setIsModalOpen(true)
                      onSessionClick?.(session)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-4 min-w-[90px]">
                            <span className="text-3xl font-bold text-primary">
                              {formatTime(session.session_date)}
                            </span>
                            {session.duration && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {session.duration} min
                              </span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span className="font-semibold text-xl">
                                {session.patient?.name || 'Sem paciente'}
                              </span>
                            </div>
                            {session.patient?.email && (
                              <div className="text-sm text-muted-foreground">
                                {session.patient.email}
                              </div>
                            )}
                            {session.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 bg-gray-50 p-3 rounded-md border">
                                {session.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge className={SESSION_STATUS_COLORS[session.status]}>
                            {SESSION_STATUS_LABELS[session.status]}
                          </Badge>
                          {(session.status === "scheduled" || session.status === "rescheduled") && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSession(session)
                                setIsModalOpen(true)
                                openSessionEditForm(session)
                                onSessionClick?.(session)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getGoogleEventsForSelectedDay().map((ev) => (
                  <Card
                    key={ev.id}
                    className="border cursor-pointer hover:shadow-md hover:opacity-95 transition-all"
                    style={{ ...getGoogleEventStyle(ev), borderWidth: '1px' }}
                    onClick={() => {
                      setSelectedGoogleEvent(ev)
                      setIsGoogleEventModalOpen(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex flex-col items-center justify-center rounded-lg p-4 min-w-[90px] bg-black/10">
                            <span className="text-3xl font-bold" style={{ color: getGoogleEventStyle(ev).color }}>
                              {format(new Date(ev.start), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 opacity-80" />
                              <span className="font-semibold text-xl">{ev.summary}</span>
                            </div>
                            <Badge variant="outline" className="mt-2 opacity-90">Google Calendar</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open) {
          setSelectedSession(null)
          resetSessionEditForm()
          setIsUpdatingStatus(false)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showSessionEditForm ? "Editar sessão" : "Detalhes da Sessão"}
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={SESSION_STATUS_COLORS[selectedSession.status]}>
                  {SESSION_STATUS_LABELS[selectedSession.status]}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calendar-session-status">Alterar status</Label>
                <select
                  id="calendar-session-status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSession.status}
                  disabled={isUpdatingStatus || isActioning}
                  onChange={async (e) => {
                    const v = e.target.value as SessionStatus
                    if (v === selectedSession.status) return
                    setIsUpdatingStatus(true)
                    try {
                      const updated = await sessionService.updateSession(
                        selectedSession.patient_id,
                        selectedSession.id,
                        { status: v }
                      )
                      setSelectedSession(updated)
                      await loadSessionsForCurrentMonth()
                      showSuccessToast("Status atualizado", "O status da sessão foi alterado.")
                    } catch (error: any) {
                      showErrorToast(
                        "Erro ao atualizar status",
                        error.response?.data?.message || "Tente novamente mais tarde"
                      )
                    } finally {
                      setIsUpdatingStatus(false)
                    }
                  }}
                >
                  <option value="scheduled">Agendada</option>
                  <option value="rescheduled">Remarcada</option>
                  <option value="completed">Realizada</option>
                  <option value="no_show">Falta</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Inclui sessões já finalizadas: você pode corrigir o status quando precisar.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-0.5 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">
                      {formatSessionInstantInLocalTimezone(
                        selectedSession.session_date,
                        "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Brasília:{" "}
                    {formatSessionInstantInSaoPaulo(
                      selectedSession.session_date,
                      "dd/MM/yyyy HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                
                {selectedSession.patient && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedSession.patient.name}</span>
                    <span className="text-muted-foreground">({selectedSession.patient.email})</span>
                  </div>
                )}
                
                {selectedSession.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedSession.duration} minutos</span>
                  </div>
                )}
                
                {selectedSession.notes && (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Notas:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">
                      {selectedSession.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedSession.status !== 'completed' && selectedSession.status !== 'no_show' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      setIsActioning(true)
                      try {
                        await sessionService.markAsCompleted(selectedSession.patient_id, selectedSession.id)
                        showSuccessToast("Sessão concluída", "Sessão marcada como realizada com sucesso")
                        setIsModalOpen(false)
                        setSelectedSession(null)
                        loadSessionsForCurrentMonth()
                      } catch (error: any) {
                        showErrorToast(
                          "Erro ao marcar sessão",
                          error.response?.data?.message || "Tente novamente mais tarde"
                        )
                      } finally {
                        setIsActioning(false)
                      }
                    }}
                    disabled={isActioning}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como Concluída
                  </Button>
                )}
                
                {(selectedSession.status === 'scheduled' || selectedSession.status === 'rescheduled') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setIsActioning(true)
                        try {
                          await sessionService.markAsNoShow(selectedSession.patient_id, selectedSession.id)
                          showSuccessToast("Sessão marcada como falta", "Sessão de falta registrada com sucesso")
                          setIsModalOpen(false)
                          setSelectedSession(null)
                          loadSessionsForCurrentMonth()
                        } catch (error: any) {
                          showErrorToast(
                            "Erro ao marcar sessão",
                            error.response?.data?.message || "Tente novamente mais tarde"
                          )
                        } finally {
                          setIsActioning(false)
                        }
                      }}
                      disabled={isActioning}
                      className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Marcar como Falta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedSession && openSessionEditForm(selectedSession)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar sessão
                    </Button>
                  </>
                )}
                
                {selectedSession.patient && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/dashboard/patients/${selectedSession.patient_id}`
                    }}
                  >
                    Ver Paciente
                  </Button>
                )}
              </div>

              {/* Formulário de edição (data, hora BR, duração, notas → Google) */}
              {showSessionEditForm && selectedSession && (
                <div className="mt-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Pencil className="h-5 w-5 text-primary" />
                      Editar sessão
                    </h3>
                    <Button variant="ghost" size="sm" onClick={resetSessionEditForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-session-date">Data * (Brasília)</Label>
                        <Input
                          id="edit-session-date"
                          type="date"
                          value={editSessionDate}
                          onChange={(e) => setEditSessionDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-session-time">Horário * (Brasília)</Label>
                        <Input
                          id="edit-session-time"
                          type="time"
                          value={editSessionTime}
                          onChange={(e) => setEditSessionTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                      Data e hora são sempre no fuso de Brasília; o Google Calendar recebe o instante correto.
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="edit-session-duration">Duração (minutos)</Label>
                      <Input
                        id="edit-session-duration"
                        type="number"
                        min="15"
                        max="300"
                        step="15"
                        value={editSessionDuration ?? ""}
                        onChange={(e) =>
                          setEditSessionDuration(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        placeholder={selectedSession.duration?.toString() || "60"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-session-notes">Notas</Label>
                      <Textarea
                        id="edit-session-notes"
                        value={editSessionNotes}
                        onChange={(e) => setEditSessionNotes(e.target.value)}
                        placeholder="Observações sobre a sessão..."
                        rows={3}
                        className="resize-y min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" onClick={resetSessionEditForm}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!editSessionDate || !editSessionTime) {
                            showErrorToast("Campos obrigatórios", "Data e horário são obrigatórios")
                            return
                          }

                          setIsActioning(true)
                          try {
                            const updated = await sessionService.updateSession(
                              selectedSession.patient_id,
                              selectedSession.id,
                              {
                                session_date: saoPauloWallDateTimeToUtcIso(
                                  editSessionDate,
                                  editSessionTime
                                ),
                                duration: editSessionDuration,
                                notes: editSessionNotes.trim() || null,
                              }
                            )
                            showSuccessToast("Sessão atualizada", "Alterações salvas e sincronizadas quando houver Google Calendar.")
                            resetSessionEditForm()
                            setSelectedSession(updated)
                            await loadSessionsForCurrentMonth()
                          } catch (error: any) {
                            showErrorToast(
                              "Erro ao salvar",
                              error.response?.data?.message || "Tente novamente mais tarde"
                            )
                          } finally {
                            setIsActioning(false)
                          }
                        }}
                        disabled={isActioning || !editSessionDate || !editSessionTime}
                        className="gap-2"
                      >
                        {isActioning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Salvar alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Google Event Details Modal */}
      <Dialog open={isGoogleEventModalOpen} onOpenChange={(open) => {
        setIsGoogleEventModalOpen(open)
        if (!open) setSelectedGoogleEvent(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGoogleEvent && (
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: getGoogleEventStyle(selectedGoogleEvent).backgroundColor }}
                />
              )}
              Evento do Google Calendar
            </DialogTitle>
          </DialogHeader>
          {selectedGoogleEvent && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{selectedGoogleEvent.summary}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(selectedGoogleEvent.start), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {format(new Date(selectedGoogleEvent.start), 'HH:mm', { locale: ptBR })} - {format(new Date(selectedGoogleEvent.end), 'HH:mm', { locale: ptBR })}
                </div>
              </div>
              {selectedGoogleEvent.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md border">
                  {selectedGoogleEvent.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedGoogleEvent.hangoutLink && (
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <a href={selectedGoogleEvent.hangoutLink} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4" />
                      Entrar na chamada
                    </a>
                  </Button>
                )}
                {selectedGoogleEvent.htmlLink && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <a href={selectedGoogleEvent.htmlLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Abrir no Google Calendar
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

