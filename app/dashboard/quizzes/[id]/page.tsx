"use client"

import { useState, useEffect, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Edit, 
  ArrowLeft, 
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/services/quiz-service"
import { quizAssignmentService } from "@/services/quiz-assignment-service"
import { Quiz, PatientQuizAssignment } from "@/types/quiz"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ViewQuizPageProps {
  params: {
    id: string
  }
}

export default function ViewQuizPage({ params }: ViewQuizPageProps) {
  const resolvedParams = use(params)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<PatientQuizAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false)
  
  
  const { toast } = useToast()
  const router = useRouter()

  const quizId = parseInt(resolvedParams.id)

  useEffect(() => {
    if (quizId) {
      loadQuiz()
    }
  }, [quizId])

  const loadQuiz = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await quizService.getById(quizId)
      
      if (response.success && response.quiz) {
        setQuiz(response.quiz)
        await loadAssignments()
        await loadQuizAttempts()
      } else {
        setError(response.message || 'Erro ao carregar quiz')
      }
    } catch (err) {
      setError('Erro ao carregar quiz')
      console.error('Error loading quiz:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      setIsLoadingAssignments(true)
      
      const response = await quizAssignmentService.getAssignments({ quiz_id: quizId })
      
      if (response.success && response.data) {
        setAssignments(response.data)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const loadQuizAttempts = async () => {
    try {
      setIsLoadingAttempts(true)
      const response = await quizService.getQuizAttempts(quizId)
      if (response.success && response.data) {
        setQuizAttempts(response.data)
      }
    } catch (error) {
      console.error('Error loading quiz attempts:', error)
    } finally {
      setIsLoadingAttempts(false)
    }
  }

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Atribuído</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Em Andamento</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Concluído</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Expirado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Ativo</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const types = {
      anxiety: 'Ansiedade',
      sleep: 'Sono',
      mood: 'Humor',
      self_esteem: 'Autoestima',
      custom: 'Personalizado'
    }
    return types[type as keyof typeof types] || type
  }

  const handleDeleteQuiz = async () => {
    if (!confirm('Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await quizService.delete(quizId)
      
      if (response.success) {
        toast({
          title: "Quiz Excluído",
          description: "O quiz foi excluído com sucesso.",
        })
        router.push('/dashboard/quizzes')
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao excluir quiz",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao excluir quiz. Tente novamente.",
        variant: "destructive",
      })
      console.error('Error deleting quiz:', err)
    }
  }

  const handleViewResponses = (patientId: number, patientName: string) => {
    router.push(`/dashboard/quizzes/${quizId}/responses/${patientId}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quizzes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Visualizar Quiz</h1>
            <p className="mt-2 text-muted-foreground">
              Visualize as informações do quiz
            </p>
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
              onClick={loadQuiz}
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!quiz) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/quizzes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{quiz.title}</h1>
              <p className="mt-2 text-muted-foreground">
                {quiz.description || 'Visualize as informações do quiz'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteQuiz}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="responses">
              Respostas
              {quizAttempts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {quizAttempts.filter(a => a.status === 'completed').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quiz Info */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Informações do Quiz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{getTypeLabel(quiz.type)}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(quiz.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duração</Label>
                  <div className="mt-1 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{quiz.duration_minutes} minutos</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Perguntas</Label>
                  <div className="mt-1 flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>{quiz.questions?.length || 0} questões</span>
                  </div>
                </div>
              </div>
              
              {quiz.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                  <p className="mt-1 text-sm">{quiz.description}</p>
                </div>
              )}
            </CardContent>
              </Card>

              {/* Assigned Patients */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pacientes Atribuídos
              </CardTitle>
              <CardDescription>
                Lista de pacientes que têm acesso a este quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              {isLoadingAssignments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border rounded-lg space-y-3">
                      {/* Informações do Paciente */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{assignment.patient?.name}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.patient?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getAssignmentStatusBadge(assignment.status)}
                              {assignment.due_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span className={isOverdue(assignment.due_date) ? 'text-red-600 font-medium' : ''}>
                                    Prazo: {formatDate(assignment.due_date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Atribuído em {formatDate(assignment.assigned_at)}</p>
                          {assignment.notes && (
                            <p className="mt-1 max-w-xs truncate">{assignment.notes}</p>
                          )}
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResponses(assignment.patient_id, assignment.patient?.name || 'Paciente')}
                              className="text-xs"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Ver Respostas
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Informações das Tentativas */}
                      {assignment.attempts && assignment.attempts.length > 0 ? (
                        <div className="border-t pt-3">
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">
                            Tentativas ({assignment.attempts.length})
                          </h5>
                          <div className="space-y-2">
                            {assignment.attempts.map((attempt, index) => (
                              <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium">{index + 1}</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {attempt.status === 'completed' ? 'Concluída' : 
                                       attempt.status === 'in_progress' ? 'Em Andamento' : 'Abandonada'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {attempt.started_at ? formatDate(attempt.started_at) : 'Não iniciada'}
                                      {attempt.completed_at && ` - ${formatDate(attempt.completed_at)}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {attempt.status === 'completed' && attempt.score !== null && (
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                        {attempt.score} pontos
                                      </Badge>
                                      {attempt.score_interpretation && (
                                        <Badge variant="outline" className="text-xs">
                                          {attempt.score_interpretation.level}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {attempt.time_spent_seconds && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {Math.round(attempt.time_spent_seconds / 60)} min
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span>Nenhuma tentativa realizada ainda</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum paciente atribuído
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Este quiz ainda não foi atribuído a nenhum paciente.
                  </p>
                  <Link href={`/dashboard/quizzes/${quizId}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Quiz
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
              </Card>

              {/* Questions */}
              <Card>
            <CardHeader>
              <CardTitle>Perguntas</CardTitle>
              <CardDescription>
                Lista de perguntas do quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quiz.questions && quiz.questions.length > 0 ? (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <Card key={question.id} className="border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Pergunta {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {question.question_type === 'multiple_choice' ? 'Múltipla Escolha' : 
                               question.question_type === 'scale' ? 'Escala' : 'Texto Livre'}
                            </Badge>
                            {question.required && (
                              <Badge variant="destructive" className="text-xs">Obrigatória</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Pergunta</Label>
                          <p className="mt-1 text-sm">{question.question_text}</p>
                        </div>
                        
                        {question.question_type === 'multiple_choice' && question.options && (
                          <div>
                            <Label className="text-sm font-medium">Opções de Resposta</Label>
                            <div className="mt-2 space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs">
                                    {option.value}
                                  </Badge>
                                  <span>{option.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma pergunta encontrada</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Este quiz não possui perguntas configuradas.
                  </p>
                </div>
              )}
            </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quiz Stats */}
              <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID do Quiz</span>
                <span className="font-medium">{quiz.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Criado em</span>
                <span className="font-medium">
                  {new Date(quiz.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última atualização</span>
                <span className="font-medium">
                  {new Date(quiz.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tentativas</span>
                <span className="font-medium">{quiz.attempts?.length || 0}</span>
              </div>
            </CardContent>
              </Card>

              {/* Recent Attempts */}
              {quiz.attempts && quiz.attempts.length > 0 && (
                <Card>
              <CardHeader>
                <CardTitle>Tentativas Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quiz.attempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {attempt.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="text-sm font-medium">
                          {attempt.patient?.name || 'Paciente'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {attempt.score !== null ? `${attempt.score}%` : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attempt.completed_at ? 
                          new Date(attempt.completed_at).toLocaleDateString('pt-BR') :
                          'Em andamento'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Quiz
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/quizzes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar à Lista
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleDeleteQuiz}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Excluir Quiz
              </Button>
            </CardContent>
              </Card>

              {/* Info */}
              <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">Sobre este quiz:</h4>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Tipo: {getTypeLabel(quiz.type)}</li>
                  <li>• Duração estimada: {quiz.duration_minutes} min</li>
                  <li>• Perguntas: {quiz.questions?.length || 0}</li>
                  <li>• Status: {quiz.status}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Dicas:</h4>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Edite para fazer alterações</li>
                  <li>• Publique para disponibilizar</li>
                  <li>• Monitore as tentativas</li>
                  <li>• Analise os resultados</li>
                </ul>
              </div>
            </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Respostas dos Pacientes
              </CardTitle>
              <CardDescription>
                Visualize as respostas dos pacientes que completaram este quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAttempts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Carregando respostas...</span>
                </div>
              ) : quizAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhuma resposta ainda
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nenhum paciente completou este quiz ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar tentativas por paciente */}
                  {Object.entries(
                    quizAttempts.reduce((acc, attempt) => {
                      const patientId = attempt.patient_id
                      if (!acc[patientId]) {
                        acc[patientId] = {
                          patient: attempt.patient || { id: patientId, name: 'Paciente', email: '' },
                          attempts: []
                        }
                      }
                      acc[patientId].attempts.push(attempt)
                      return acc
                    }, {} as Record<number, { patient: any; attempts: any[] }>)
                  ).map(([patientId, data]: [string, any]) => {
                    const latestAttempt = data.attempts.find((a: any) => a.status === 'completed') || data.attempts[0]
                    return (
                      <Card key={patientId} className="border-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg mb-1">
                                  {data.patient?.name || 'Paciente'}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {data.patient?.email || 'Email não disponível'}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge 
                                    className={
                                      latestAttempt.status === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : latestAttempt.status === 'in_progress'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                    }
                                  >
                                    {latestAttempt.status === 'completed' ? 'Concluído' : 
                                     latestAttempt.status === 'in_progress' ? 'Em Andamento' : 'Abandonado'}
                                  </Badge>
                                  {latestAttempt.completed_at && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>Completado em {formatDate(latestAttempt.completed_at)}</span>
                                    </div>
                                  )}
                                  {latestAttempt.status === 'completed' && latestAttempt.ai_feedback && (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                      <Brain className="h-3 w-3 mr-1" />
                                      Análise disponível
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    {data.attempts.length} {data.attempts.length === 1 ? 'tentativa' : 'tentativas'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => handleViewResponses(data.patient.id, data.patient?.name || 'Paciente')}
                              className="shrink-0"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Respostas
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
