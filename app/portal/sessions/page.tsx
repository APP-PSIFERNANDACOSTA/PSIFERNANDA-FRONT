"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Video, FileText, CheckCircle2, MapPin, Loader2, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import sessionService from "@/services/session-service"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from "@/types/session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { showErrorToast } from "@/lib/toast-helpers"

export default function SessoesPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await sessionService.getMySessions()
      setSessions(data || [])
    } catch (err: any) {
      console.error("Erro ao carregar sessões:", err)
      setError(err?.response?.data?.message || "Erro ao carregar sessões")
      showErrorToast("Erro", "Não foi possível carregar as sessões")
    } finally {
      setIsLoading(false)
    }
  }

  // Próxima sessão agendada ou remarcada
  const nextSession = sessions
    .filter((s) => (s.status === "scheduled" || s.status === "rescheduled") && new Date(s.session_date) >= new Date())
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0]

  // Sessões realizadas (completed)
  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())

  // Outras sessões (agendadas futuras, canceladas, etc)
  const otherSessions = sessions
    .filter((s) => {
      if (s.status === "completed") return false
      if ((s.status === "scheduled" || s.status === "rescheduled") && new Date(s.session_date) >= new Date()) {
        // Excluir a próxima sessão (já mostrada no card)
        return s.id !== nextSession?.id
      }
      return true
    })
    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())

  const formatSessionDate = (dateString: string, mobile: boolean = false) => {
    const date = new Date(dateString)
    if (mobile) {
      // Formato mais compacto para mobile: "seg, 17 nov 2025"
      return format(date, "EEE, dd MMM yyyy", { locale: ptBR })
    }
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const formatSessionTime = (dateString: string, duration: number | null) => {
    const date = new Date(dateString)
    const startTime = format(date, "HH:mm")
    if (duration) {
      const endDate = new Date(date.getTime() + duration * 60000)
      const endTime = format(endDate, "HH:mm")
      return `${startTime} - ${endTime}`
    }
    return startTime
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Sessões</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe seu histórico e próximas sessões terapêuticas</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando sessões...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Sessões</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe seu histórico e próximas sessões terapêuticas</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="ml-3 text-destructive">{error}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minhas Sessões</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe seu histórico e próximas sessões terapêuticas</p>
      </div>

      {/* Next Session */}
      {nextSession && (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próxima Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={SESSION_STATUS_COLORS[nextSession.status]}>
                    {SESSION_STATUS_LABELS[nextSession.status]}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Sessão de Terapia</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="block sm:hidden">{formatSessionDate(nextSession.session_date, true)}</span>
                      <span className="hidden sm:block">{formatSessionDate(nextSession.session_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{formatSessionTime(nextSession.session_date, nextSession.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {nextSession.notes && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium text-foreground">Notas:</p>
                  <p className="mt-1 text-muted-foreground">{nextSession.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Scheduled/Rescheduled Sessions */}
      {otherSessions.filter((s) => s.status === "scheduled" || s.status === "rescheduled").length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Próximas Sessões</h2>
          {otherSessions
            .filter((s) => s.status === "scheduled" || s.status === "rescheduled")
            .map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-primary shrink-0" />
                        <CardTitle className="text-lg">Sessão de Terapia</CardTitle>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="block sm:hidden">{formatSessionDate(session.session_date, true)}</span>
                          <span className="hidden sm:block">{formatSessionDate(session.session_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatSessionTime(session.session_date, session.duration)}</span>
                        </div>
            </div>
          </div>
                    <Badge variant="outline" className={SESSION_STATUS_COLORS[session.status] + " shrink-0"}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </div>
                </CardHeader>
                {session.notes && (
                  <CardContent>
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium text-foreground">Notas:</p>
                      <p className="mt-1 text-muted-foreground">{session.notes}</p>
                    </div>
        </CardContent>
                )}
      </Card>
            ))}
        </div>
      )}

      {/* Session History */}
      {completedSessions.length > 0 && (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Histórico de Sessões</h2>
          {completedSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                      <CardTitle className="text-lg">Sessão de Terapia</CardTitle>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="block sm:hidden">{formatSessionDate(session.session_date, true)}</span>
                        <span className="hidden sm:block">{formatSessionDate(session.session_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatSessionTime(session.session_date, session.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={SESSION_STATUS_COLORS[session.status] + " shrink-0"}>
                    {SESSION_STATUS_LABELS[session.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.notes && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Resumo da Sessão:</p>
                    <p className="mt-1 text-sm text-muted-foreground">{session.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
      )}

      {/* Cancelled/No Show Sessions */}
      {sessions.filter((s) => s.status === "cancelled" || s.status === "no_show").length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Outras Sessões</h2>
          {sessions
            .filter((s) => s.status === "cancelled" || s.status === "no_show")
            .map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">Sessão de Terapia</CardTitle>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="block sm:hidden">{formatSessionDate(session.session_date, true)}</span>
                          <span className="hidden sm:block">{formatSessionDate(session.session_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatSessionTime(session.session_date, session.duration)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={SESSION_STATUS_COLORS[session.status] + " shrink-0"}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </div>
                </CardHeader>
                {session.notes && (
                  <CardContent>
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium text-foreground">Notas:</p>
                      <p className="mt-1 text-muted-foreground">{session.notes}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma sessão encontrada</h3>
            <p className="text-sm text-muted-foreground">Você ainda não possui sessões agendadas ou realizadas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
