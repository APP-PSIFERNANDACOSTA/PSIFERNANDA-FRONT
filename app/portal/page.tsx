"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Video, Heart, Brain, CheckCircle2, AlertCircle, TrendingUp, Sparkles, Loader2, User, BookOpen, FileText, DollarSign, Library, NotebookPen } from "lucide-react"
import { NotificationPromptBanner } from "@/components/notification-prompt-banner"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useState, useEffect } from "react"
import sessionService from "@/services/session-service"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from "@/types/session"
import { format } from "date-fns"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { ptBR } from "date-fns/locale"
import messageService from "@/services/message-service"
import type { Message } from "@/types/message"
import diaryService from "@/services/diary-service"
import exerciseService from "@/services/exercise-service"
import quizService from "@/services/quiz-service"
import patientNoteService from "@/services/patient-note-service"
import type { PatientNote } from "@/types/patient-note"
import { getPatientNoteDisplayTitle } from "@/components/patient-note-detail-content"

function getPostTherapySnippet(note: PatientNote): string | null {
  const b = note.body_structured
  if (!b) return null
  const parts = [
    b.discussion_summary,
    b.phrase_to_remember,
    b.daily_application,
    b.extra_notes,
  ]
    .map((s) => s?.trim())
    .filter(Boolean) as string[]
  const text = parts[0]
  if (!text) return null
  return text.length > 160 ? `${text.slice(0, 160).trim()}…` : text
}

export default function PatientPortalPage() {
  const { user } = useAuth()
  const [nextSession, setNextSession] = useState<Session | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [latestMessage, setLatestMessage] = useState<Message | null>(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(true)
  const [diariesCount, setDiariesCount] = useState(0)
  const [exercisesCount, setExercisesCount] = useState(0)
  const [quizzesCount, setQuizzesCount] = useState(0)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [latestPostTherapy, setLatestPostTherapy] = useState<PatientNote | null>(null)
  const [isLoadingPostTherapy, setIsLoadingPostTherapy] = useState(true)

  const refetchAll = () => {
    loadNextSession()
    loadLatestMessage()
    loadStats()
    loadLatestPostTherapy()
  }
  useAutoRefresh(refetchAll, { intervalMs: 60000 })

  useEffect(() => {
    loadNextSession()
    loadLatestMessage()
    loadStats()
    loadLatestPostTherapy()
  }, [])

  const loadLatestPostTherapy = async () => {
    try {
      setIsLoadingPostTherapy(true)
      const { data } = await patientNoteService.listMyPortalPostTherapy({
        page: 1,
        per_page: 1,
      })
      setLatestPostTherapy(data[0] ?? null)
    } catch (error) {
      console.error("Erro ao carregar pós-terapia:", error)
      setLatestPostTherapy(null)
    } finally {
      setIsLoadingPostTherapy(false)
    }
  }

  const loadNextSession = async () => {
    try {
      setIsLoadingSession(true)
      const sessions = await sessionService.getMySessions()
      
      // Buscar próxima sessão agendada ou remarcada
      const upcoming = sessions
        .filter((s) => (s.status === "scheduled" || s.status === "rescheduled") && new Date(s.session_date) >= new Date())
        .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0]
      
      setNextSession(upcoming || null)
    } catch (error) {
      console.error("Erro ao carregar próxima sessão:", error)
      setNextSession(null)
    } finally {
      setIsLoadingSession(false)
    }
  }

  const loadLatestMessage = async () => {
    try {
      setIsLoadingMessage(true)
      const messages = await messageService.getMyMessages()
      setLatestMessage(messages[0] || null)
    } catch (error) {
      console.error("Erro ao carregar mensagens da psi:", error)
      setLatestMessage(null)
    } finally {
      setIsLoadingMessage(false)
    }
  }

  const loadStats = async () => {
    try {
      setIsLoadingStats(true)
      
      // Carregar diários
      try {
        const diariesResponse = await diaryService.getMyEntries()
        setDiariesCount(diariesResponse.entries?.data?.length || 0)
      } catch (error) {
        console.error("Erro ao carregar diários:", error)
        setDiariesCount(0)
      }

      // Carregar exercícios completados
      try {
        const exercises = await exerciseService.getMyExercises()
        // Contar exercícios que foram iniciados/completados
        // Por enquanto, vamos contar todos os exercícios disponíveis
        // TODO: Implementar contagem de exercícios realmente completados
        setExercisesCount(exercises.length)
      } catch (error) {
        console.error("Erro ao carregar exercícios:", error)
        setExercisesCount(0)
      }

      // Carregar quizzes respondidos
      try {
        const history = await quizService.getPatientHistory()
        setQuizzesCount(history.data?.length || 0)
      } catch (error) {
        console.error("Erro ao carregar quizzes:", error)
        setQuizzesCount(0)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const formatSessionDate = (dateString: string, mobile: boolean = false) => {
    const date = new Date(dateString)
    if (mobile) {
      return format(date, "EEE, dd MMM", { locale: ptBR })
    }
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
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

  return (
    <div className="space-y-12 sm:space-y-6">
      {/* Welcome Section */}
      <Card className="group border-primary/20 bg-gradient-to-br from-primary/5 to-background transition-colors hover:from-primary/10 hover:to-background">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Olá, {user?.name?.split(" ")[0]}!</CardTitle>
              <CardDescription>Bem-vindo(a) de volta ao seu espaço terapêutico</CardDescription>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary">
              <Heart className="h-8 w-8 text-primary transition-colors group-hover:text-white" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <NotificationPromptBanner />

      {/* Message from Psychologist */}
      <Card className="group border-primary/20 transition-colors hover:bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
              <Heart className="h-5 w-5 text-primary transition-colors group-hover:text-white" />
            </span>
            Mensagem da Psi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoadingMessage ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                Carregando mensagem...
              </div>
            ) : latestMessage ? (
              <>
                <p className="text-sm font-medium text-foreground">{latestMessage.title}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{latestMessage.body}</p>
                {latestMessage.sent_at && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Enviado em{" "}
                      {new Date(latestMessage.sent_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Continue seu progresso terapêutico com dedicação e autocuidado</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Session */}
      <Card className="group transition-colors hover:bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
              <Calendar className="h-5 w-5 text-primary transition-colors group-hover:text-white" />
            </span>
            Próxima Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : nextSession ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={SESSION_STATUS_COLORS[nextSession.status]}>
                      {SESSION_STATUS_LABELS[nextSession.status]}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium">Sessão de Terapia</p>
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
                <Link href="/portal/sessions">
                  <Button variant="outline" className="gap-2">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
              {nextSession.notes ? (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium text-foreground">Notas:</p>
                  <p className="mt-1 text-muted-foreground">{nextSession.notes}</p>
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium text-foreground">Preparação para a sessão:</p>
                  <p className="mt-1 text-muted-foreground">
                    Lembre-se de estar em um ambiente tranquilo e privado. Tenha água por perto e seu diário emocional em
                    mãos.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-3 transition-colors group-hover:bg-primary">
                <Calendar className="h-12 w-12 text-primary opacity-70 transition-colors group-hover:opacity-100 group-hover:text-white" />
              </div>
              <p className="font-medium text-foreground mb-1">Nenhuma sessão agendada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Você não possui sessões agendadas no momento.
              </p>
              <Link href="/portal/sessions">
                <Button variant="outline" size="sm">
                  Ver Histórico de Sessões
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pós terapia da última sessão */}
      <Card className="group transition-colors hover:bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
              <NotebookPen className="h-5 w-5 text-primary transition-colors group-hover:text-white" />
            </span>
            Pós terapia da última sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPostTherapy ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando…</span>
            </div>
          ) : latestPostTherapy ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <Badge variant="secondary" className="font-normal">
                    Mais recente
                  </Badge>
                  <div className="space-y-1.5">
                    <p className="font-medium break-words">{getPatientNoteDisplayTitle(latestPostTherapy)}</p>
                    {latestPostTherapy.session && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span className="block sm:hidden">
                            {formatSessionDate(latestPostTherapy.session.session_date, true)}
                          </span>
                          <span className="hidden sm:block">
                            {formatSessionDate(latestPostTherapy.session.session_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>
                            {formatSessionTime(
                              latestPostTherapy.session.session_date,
                              latestPostTherapy.session.duration
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/portal/post-therapy/${latestPostTherapy.id}`} className="w-full sm:w-auto shrink-0">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                    Ver
                  </Button>
                </Link>
              </div>
              {getPostTherapySnippet(latestPostTherapy) ? (
                <div className="rounded-lg bg-muted/80 dark:bg-muted/40 p-3 text-sm border border-border/60">
                  <p className="font-medium text-foreground">Trecho da pós-terapia:</p>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {getPostTherapySnippet(latestPostTherapy)}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/80 dark:bg-muted/40 p-3 text-sm border border-border/60">
                  <p className="font-medium text-foreground">Nota da profissional:</p>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    Toque em <span className="font-medium text-foreground">Ver</span> para ler o registro completo desta
                    sessão.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-3 transition-colors group-hover:bg-primary">
                <NotebookPen className="h-8 w-8 text-primary opacity-80 transition-colors group-hover:text-white" />
              </div>
              <p className="font-medium text-foreground mb-1">Ainda não há pós-terapia</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Quando houver um registro após uma sessão, ele aparecerá aqui.
              </p>
              <Link href="/portal/post-therapy">
                <Button variant="outline" size="sm">
                  Ver área Pós-terapia
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card className="group transition-colors hover:bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
              <TrendingUp className="h-5 w-5 text-primary transition-colors group-hover:text-white" />
            </span>
            Suas Atividades
          </CardTitle>
          <CardDescription>Resumo do seu engajamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:gap-4 sm:grid-cols-3">
            <div className="group/stat flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover/stat:bg-primary">
                <Heart className="h-6 w-6 text-primary transition-colors group-hover/stat:text-white" />
              </div>
              <div className="flex-1">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{diariesCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Diários Feitos</p>
              </div>
            </div>
            <div className="group/stat flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover/stat:bg-primary">
                <BookOpen className="h-6 w-6 text-primary transition-colors group-hover/stat:text-white" />
              </div>
              <div className="flex-1">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{exercisesCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Exercícios Feitos</p>
              </div>
            </div>
            <div className="group/stat flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover/stat:bg-primary">
                <Brain className="h-6 w-6 text-primary transition-colors group-hover/stat:text-white" />
              </div>
              <div className="flex-1">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{quizzesCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Quizzes Respondidos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Melhorado para mobile - Inclui itens que não estão no bottom nav */}
      <div className="grid gap-6 sm:gap-5 grid-cols-2 lg:grid-cols-4">
        <Link href="/portal/exercises" className="block group">
          <Card className="cursor-pointer transition-all hover:bg-primary active:scale-[0.98] touch-manipulation h-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-white/20">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-colors group-hover:text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base group-hover:text-white transition-colors">Exercícios</p>
                <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-white/80 transition-colors">Práticas terapêuticas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/contracts" className="block group">
          <Card className="cursor-pointer transition-all hover:bg-primary active:scale-[0.98] touch-manipulation h-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-white/20">
                <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-colors group-hover:text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base group-hover:text-white transition-colors">Contratos</p>
                <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-white/80 transition-colors">Meus contratos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/financial" className="block group">
          <Card className="cursor-pointer transition-all hover:bg-primary active:scale-[0.98] touch-manipulation h-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-white/20">
                <DollarSign className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-colors group-hover:text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base group-hover:text-white transition-colors">Financeiro</p>
                <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-white/80 transition-colors">Pagamentos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Card className="group cursor-pointer transition-all hover:bg-primary active:scale-[0.98] touch-manipulation h-full">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-white/20">
                  <Library className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-colors group-hover:text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm sm:text-base group-hover:text-white transition-colors">Recursos</p>
                  <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-white/80 transition-colors">Em breve</p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recursos em Desenvolvimento</DialogTitle>
              <DialogDescription>
                Logo terá uma biblioteca para ajudar no seu tratamento. Fique atento às novidades!
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
