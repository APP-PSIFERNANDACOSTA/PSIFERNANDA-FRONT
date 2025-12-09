"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Brain, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  BarChart3,
  FileText,
  Eye
} from "lucide-react"
import { quizService } from "@/services/quiz-service"
import { Quiz } from "@/types/quiz"

interface PatientResponsesModalProps {
  isOpen: boolean
  onClose: () => void
  quizId: number
  patientId: number
  patientName: string
}

export function PatientResponsesModal({
  isOpen,
  onClose,
  quizId,
  patientId,
  patientName,
}: PatientResponsesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responsesData, setResponsesData] = useState<any>(null)

  useEffect(() => {
    if (isOpen && quizId && patientId) {
      loadPatientResponses()
    }
  }, [isOpen, quizId, patientId])

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
      setError('Erro ao carregar respostas')
      console.error('Error loading patient responses:', err)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Respostas do Paciente
          </DialogTitle>
          <DialogDescription>
            Visualizando respostas de {patientName} para esta avaliação
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ) : error ? (
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
        ) : responsesData ? (
          <div className="space-y-6">
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
                    <p className="font-medium">{responsesData.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{responsesData.patient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status da Atribuição</p>
                    <Badge variant="outline">{responsesData.assignment.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Tentativas</p>
                    <p className="font-medium">{responsesData.total_attempts}</p>
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
                    <p className="font-medium">{responsesData.quiz.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p className="font-medium">{responsesData.quiz.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duração</p>
                    <p className="font-medium">{responsesData.quiz.duration_minutes} minutos</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Perguntas</p>
                    <p className="font-medium">{responsesData.quiz.questions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tentativas */}
            {responsesData.attempts.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tentativas Realizadas
                </h3>
                
                {responsesData.attempts.map((attempt: any, index: number) => (
                  <Card key={attempt.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          Tentativa #{index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getAttemptStatusBadge(attempt.status)}
                          {attempt.score !== null && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {attempt.score} pontos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Informações da Tentativa */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Iniciada em</p>
                            <p className="text-sm text-muted-foreground">
                              {attempt.started_at ? formatDate(attempt.started_at) : 'Não iniciada'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Tempo gasto</p>
                            <p className="text-sm text-muted-foreground">
                              {attempt.time_spent_seconds 
                                ? `${Math.round(attempt.time_spent_seconds / 60)} min`
                                : 'Não registrado'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Concluída em</p>
                            <p className="text-sm text-muted-foreground">
                              {attempt.completed_at ? formatDate(attempt.completed_at) : 'Não concluída'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Respostas */}
                      {attempt.responses && attempt.responses.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Respostas
                          </h4>
                          <div className="space-y-3">
                            {attempt.responses.map((response: any, responseIndex: number) => (
                              <div key={response.id} className="p-4 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium">
                                    Pergunta {responseIndex + 1}
                                  </h5>
                                  <Badge variant="outline" className="text-xs">
                                    {getQuestionTypeLabel(response.question?.question_type)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {response.question?.question_text}
                                </p>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm font-medium">Resposta:</p>
                                  <p className="text-sm">
                                    {response.response_text || response.response_value || 'Sem resposta'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma resposta registrada para esta tentativa</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhuma tentativa realizada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Este paciente ainda não realizou nenhuma tentativa desta avaliação.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}



