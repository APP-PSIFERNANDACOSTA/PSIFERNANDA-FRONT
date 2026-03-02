"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle2, CalendarClock, Trash2, AlertCircle, X, Save, Video, ExternalLink } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Session } from "@/types/session"
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
}

export function CalendarView({ onSessionClick, googleEvents = [], onMonthChange }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleCalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGoogleEventModalOpen, setIsGoogleEventModalOpen] = useState(false)
  const [isActioning, setIsActioning] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showTodayList, setShowTodayList] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState<string>("")
  const [rescheduleTime, setRescheduleTime] = useState<string>("")
  const [rescheduleDuration, setRescheduleDuration] = useState<number | null>(null)

  useAutoRefresh(loadSessionsForCurrentMonth, { intervalMs: 60000 })

  useEffect(() => {
    loadSessionsForCurrentMonth()
    onMonthChange?.(currentDate)
  }, [currentDate])


  const loadSessionsForCurrentMonth = async () => {
    setIsLoading(true)
    try {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const data = await sessionService.getAllSessions({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
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

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_date)
      return isSameDay(sessionDate, day)
    })
  }

  const getGoogleEventsForDay = (day: Date) => {
    return googleEvents.filter(ev => {
      const evStart = new Date(ev.start)
      return isSameDay(evStart, day)
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
    const todayDate = new Date()
    const todayDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 0, 0, 0, 0)
    
    // Atualizar todos os estados
    setCurrentDate(new Date(todayDate.getTime()))
    setSelectedDay(todayDay)
    setShowTodayList(true)
    setViewMode('list') // Mudar para visualização de lista
  }

  const getSessionsForSelectedDay = () => {
    if (!selectedDay) return []
    const selectedDayOnly = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate()
    )
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_date)
      return isSameDay(sessionDate, selectedDayOnly)
    }).sort((a, b) => {
      return new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    })
  }

  const getGoogleEventsForSelectedDay = () => {
    if (!selectedDay) return []
    return googleEvents.filter(ev => isSameDay(new Date(ev.start), selectedDay))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  const getGoogleEventStyle = (ev: GoogleCalendarEvent) => {
    const c = ev.colorId ? GOOGLE_CALENDAR_COLORS[ev.colorId] ?? DEFAULT_GOOGLE_COLOR : DEFAULT_GOOGLE_COLOR
    return { backgroundColor: c.bg, color: c.text, borderColor: c.border }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "HH:mm", { locale: ptBR })
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
              {viewMode === 'list' && selectedDay
                ? `Sessões de ${format(selectedDay, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
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
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={index}
                    onClick={() => {
                      const dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0)
                      setSelectedDay(dayOnly)
                      setShowTodayList(true)
                      setViewMode('list')
                    }}
                    className={`min-h-[120px] bg-white p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                    } ${isToday ? "bg-blue-50 border-blue-300 border-2" : ""} ${
                      selectedDay && isSameDay(day, selectedDay) ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? "text-blue-600 font-bold" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSession(session)
                            setIsModalOpen(true)
                            onSessionClick?.(session)
                          }}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate ${
                            SESSION_STATUS_COLORS[session.status]
                          }`}
                          title={`${formatTime(session.session_date)} - ${session.patient?.name || 'Sem paciente'} - ${SESSION_STATUS_LABELS[session.status]}`}
                        >
                          <div className="font-medium">{formatTime(session.session_date)}</div>
                          <div className="truncate">{session.patient?.name || 'Sem paciente'}</div>
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
                          className="text-xs p-1 rounded truncate border cursor-pointer hover:opacity-90 transition-opacity"
                          style={getGoogleEventStyle(ev)}
                          title={`${format(new Date(ev.start), 'HH:mm')} - ${ev.summary} (Google) - Clique para ver detalhes`}
                        >
                          <div className="font-medium">{format(new Date(ev.start), 'HH:mm', { locale: ptBR })}</div>
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
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={SESSION_STATUS_COLORS[session.status]}>
                            {SESSION_STATUS_LABELS[session.status]}
                          </Badge>
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
          setShowRescheduleForm(false)
          setRescheduleDate("")
          setRescheduleTime("")
          setRescheduleDuration(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Sessão</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={SESSION_STATUS_COLORS[selectedSession.status]}>
                  {SESSION_STATUS_LABELS[selectedSession.status]}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(selectedSession.session_date), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
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
                      onClick={() => {
                        if (selectedSession) {
                          // Inicializar valores do formulário com a data/hora atual da sessão
                          const sessionDate = new Date(selectedSession.session_date)
                          setRescheduleDate(format(sessionDate, 'yyyy-MM-dd'))
                          setRescheduleTime(format(sessionDate, 'HH:mm'))
                          setRescheduleDuration(selectedSession.duration)
                          setShowRescheduleForm(true)
                        }
                      }}
                      className="gap-2"
                    >
                      <CalendarClock className="h-4 w-4" />
                      Remarcar
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

              {/* Formulário de Remarcação */}
              {showRescheduleForm && selectedSession && (
                <div className="mt-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-primary" />
                      Remarcar Sessão
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRescheduleForm(false)
                        setRescheduleDate("")
                        setRescheduleTime("")
                        setRescheduleDuration(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reschedule-date">Nova Data *</Label>
                        <Input
                          id="reschedule-date"
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reschedule-time">Novo Horário *</Label>
                        <Input
                          id="reschedule-time"
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reschedule-duration">Duração (minutos) - Opcional</Label>
                      <Input
                        id="reschedule-duration"
                        type="number"
                        min="15"
                        max="300"
                        step="15"
                        value={rescheduleDuration || ''}
                        onChange={(e) => setRescheduleDuration(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder={selectedSession.duration?.toString() || '60'}
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRescheduleForm(false)
                          setRescheduleDate("")
                          setRescheduleTime("")
                          setRescheduleDuration(null)
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!rescheduleDate || !rescheduleTime) {
                            showErrorToast("Campos obrigatórios", "Data e horário são obrigatórios")
                            return
                          }

                          setIsActioning(true)
                          try {
                            // Combinar data e hora
                            const [year, month, day] = rescheduleDate.split('-')
                            const [hours, minutes] = rescheduleTime.split(':')
                            const newDateTime = new Date(
                              parseInt(year),
                              parseInt(month) - 1,
                              parseInt(day),
                              parseInt(hours),
                              parseInt(minutes)
                            )

                            await sessionService.reschedule(
                              selectedSession.patient_id,
                              selectedSession.id,
                              {
                                session_date: newDateTime.toISOString(),
                                duration: rescheduleDuration,
                                notes: null
                              }
                            )
                            
                            showSuccessToast("Sessão remarcada", "Sessão remarcada com sucesso")
                            setShowRescheduleForm(false)
                            setRescheduleDate("")
                            setRescheduleTime("")
                            setRescheduleDuration(null)
                            loadSessionsForCurrentMonth()
                            setIsModalOpen(false)
                            setSelectedSession(null)
                          } catch (error: any) {
                            showErrorToast(
                              "Erro ao remarcar sessão",
                              error.response?.data?.message || "Tente novamente mais tarde"
                            )
                          } finally {
                            setIsActioning(false)
                          }
                        }}
                        disabled={isActioning || !rescheduleDate || !rescheduleTime}
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
                            Confirmar Remarcação
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

