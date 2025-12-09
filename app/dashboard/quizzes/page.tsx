"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  BarChart3,
  MoreHorizontal
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/services/quiz-service"
import { Quiz } from "@/types/quiz"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await quizService.getAll()
      
      if (response.success && response.data) {
        setQuizzes(response.data)
      } else {
        setError(response.message || 'Erro ao carregar quizzes')
      }
    } catch (err) {
      setError('Erro ao carregar quizzes')
      console.error('Error loading quizzes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQuiz = async (quizId: number) => {
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
        await loadQuizzes()
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os quizzes dos seus pacientes
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={loadQuizzes}
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os quizzes dos seus pacientes
          </p>
        </div>
        <Link href="/dashboard/quizzes/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Quiz
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Quizzes</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quizzes.filter(q => q.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <Edit className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {quizzes.filter(q => q.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Perguntas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <CardDescription className="mt-1">{quiz.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/quizzes/${quiz.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Badge variant="outline">{getTypeLabel(quiz.type)}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(quiz.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {quiz.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    {quiz.questions?.length || 0} questões
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Criado em {new Date(quiz.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/quizzes/${quiz.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Brain className="mx-auto h-12 w-12 text-primary/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum quiz criado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece criando seu primeiro quiz.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/quizzes/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Quiz
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">Sobre os Quizzes</p>
            <p className="mt-1 text-muted-foreground">
              Crie questionários personalizados para acompanhar o progresso dos seus pacientes. 
              Os quizzes podem ser de ansiedade, sono, humor, autoestima ou personalizados.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}
