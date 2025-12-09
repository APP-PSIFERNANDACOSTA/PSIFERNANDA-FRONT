"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Video, Heart, Brain, CheckCircle2, AlertCircle, TrendingUp, Sparkles, Loader2, User, BookOpen, FileText, DollarSign, Library } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useState, useEffect } from "react"
import sessionService from "@/services/session-service"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from "@/types/session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import messageService from "@/services/message-service"
import type { Message } from "@/types/message"
import diaryService from "@/services/diary-service"
import exerciseService from "@/services/exercise-service"
import quizService from "@/services/quiz-service"

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

  useEffect(() => {
    loadNextSession()
    loadLatestMessage()
    loadStats()
  }, [])

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Olá, {user?.name?.split(" ")[0]}!</CardTitle>
              <CardDescription>Bem-vindo(a) de volta ao seu espaço terapêutico</CardDescription>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Message from Psychologist */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
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
              <Calendar className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
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

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Suas Atividades
          </CardTitle>
          <CardDescription>Resumo do seu engajamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
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
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
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
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
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
      <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
        <Link href="/portal/exercises" className="block">
          <Card className="cursor-pointer transition-all hover:bg-accent active:scale-[0.98] touch-manipulation h-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base">Exercícios</p>
                <p className="text-xs text-muted-foreground mt-0.5">Práticas terapêuticas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/contracts" className="block">
          <Card className="cursor-pointer transition-all hover:bg-accent active:scale-[0.98] touch-manipulation h-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base">Contratos</p>
                <p className="text-xs text-muted-foreground mt-0.5">Meus contratos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/financial" className="block">
          <Card className="cursor-pointer transition-all hover:bg-accent active:scale-[0.98] touch-manipulation h-full">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm sm:text-base">Financeiro</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pagamentos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer transition-all hover:bg-accent active:scale-[0.98] touch-manipulation h-full">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-5 sm:p-6 min-h-[100px]">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Library className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm sm:text-base">Recursos</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Em breve</p>
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
