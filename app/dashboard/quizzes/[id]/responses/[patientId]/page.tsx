"use client"

import { useState, useEffect, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Eye, 
  User, 
  Brain, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  BarChart3,
  FileText,
  Loader2
} from "lucide-react"
import { quizService } from "@/services/quiz-service"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PatientResponsesPageProps {
  params: {
    id: string
    patientId: string
  }
}

export default function PatientResponsesPage({ params }: PatientResponsesPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const quizId = parseInt(resolvedParams.id)
  const patientId = parseInt(resolvedParams.patientId)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responsesData, setResponsesData] = useState<any>(null)

  useEffect(() => {
    if (quizId && patientId) {
      loadPatientResponses()
    }
  }, [quizId, patientId])

  const loadPatientResponses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await quizService.getPatientResponses(quizId, patientId)
      
      if (response.success && response.data) {
        setResponsesData(response.data)
      } else {
        setError(response.message || 'Erro ao carregar respostas')
      }
    } catch (err) {
      console.error('Error loading patient responses:', err)
      setError('Erro ao carregar respostas')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAttemptStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Concluída</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Em Andamento</Badge>
      case 'abandoned':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Abandonada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Múltipla Escolha'
      case 'scale':
        return 'Escala'
      case 'text':
        return 'Texto Livre'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/quizzes/${quizId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Respostas do Paciente</h1>
            </div>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={loadPatientResponses}
              >
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  if (!responsesData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/quizzes/${quizId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Respostas do Paciente</h1>
            </div>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma resposta encontrada para este paciente.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const patient = responsesData.patient
  const quiz = responsesData.quiz
  const attempts = responsesData.attempts || []
  const latestAttempt = attempts.find((a: any) => a.status === 'completed') || attempts[0]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/quizzes/${quizId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Respostas do Paciente</h1>
              <p className="mt-2 text-muted-foreground">
                Visualizando respostas de {patient?.name || 'Paciente'} para esta avaliação
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{patient?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{patient?.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Quiz */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Informações da Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Título</p>
                <p className="font-medium">{quiz?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="font-medium">{quiz?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duração</p>
                <p className="font-medium">{quiz?.duration_minutes || 0} minutos</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perguntas</p>
                <p className="font-medium">{quiz?.questions?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tentativas */}
        {attempts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma tentativa encontrada
              </h3>
              <p className="text-sm text-muted-foreground">
                Este paciente ainda não iniciou este quiz.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt: any, index: number) => (
              <Card key={attempt.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Tentativa {index + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getAttemptStatusBadge(attempt.status)}
                      {attempt.score !== null && (
                        <Badge variant="outline" className="text-sm">
                          Score: {attempt.score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {attempt.started_at && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Iniciado em {formatDate(attempt.started_at)}
                        </div>
                        {attempt.completed_at && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                            Completado em {formatDate(attempt.completed_at)}
                          </div>
                        )}
                        {attempt.time_spent_seconds && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {Math.round(attempt.time_spent_seconds / 60)} minutos
                          </div>
                        )}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Respostas */}
                  {attempt.responses && attempt.responses.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Respostas:</h4>
                      {attempt.responses.map((response: any, responseIndex: number) => {
                        const question = response.question
                        return (
                          <Card key={response.id} className="border-primary/10">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">Pergunta {responseIndex + 1}</Badge>
                                    {question && (
                                      <Badge variant="secondary" className="text-xs">
                                        {getQuestionTypeLabel(question.question_type)}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-medium text-foreground mb-2">
                                    {question?.question_text || 'Pergunta não encontrada'}
                                  </p>
                                  
                                  {/* Resposta */}
                                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    {question?.question_type === 'scale' && (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-lg font-bold">
                                          {response.answer_value || response.answer_text || 'N/A'}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">de 0 a 10</span>
                                      </div>
                                    )}
                                    {question?.question_type === 'multiple_choice' && (
                                      <p className="font-medium text-foreground">
                                        {response.answer_text || response.answer_value || 'N/A'}
                                      </p>
                                    )}
                                    {question?.question_type === 'text' && (
                                      <p className="text-foreground whitespace-pre-wrap">
                                        {response.answer_text || response.answer_value || 'Sem resposta'}
                                      </p>
                                    )}
                                  </div>

                                  {/* Opções (para múltipla escolha) */}
                                  {question?.question_type === 'multiple_choice' && question.options && (
                                    <div className="mt-2">
                                      <p className="text-xs text-muted-foreground mb-1">Opções disponíveis:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {question.options.map((option: any, optIndex: number) => (
                                          <Badge 
                                            key={optIndex} 
                                            variant={option.value === response.answer_value ? "default" : "outline"}
                                            className="text-xs"
                                          >
                                            {option.value}: {option.label}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma resposta encontrada para esta tentativa.</p>
                    </div>
                  )}

                  {/* Score Interpretation */}
                  {attempt.score_interpretation && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Interpretação do Score</h4>
                        </div>
                        {attempt.score_interpretation.level && (
                          <Badge className="mb-2">
                            {attempt.score_interpretation.level}
                          </Badge>
                        )}
                        {attempt.score_interpretation.description && (
                          <p className="text-sm text-foreground mt-2">
                            {attempt.score_interpretation.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

