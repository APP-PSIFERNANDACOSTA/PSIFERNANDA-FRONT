"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Clock, CheckCircle2, AlertCircle, ChevronRight, BarChart3, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/services/quiz-service"
import { Quiz, QuizQuestion, QuizAnswer, QuizProgress } from "@/types/quiz"

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, QuizAnswer>>({})
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const { toast } = useToast()

  // Load available quizzes on component mount
  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await quizService.getAvailableQuizzes()
      
      if (response.success && response.quizzes) {
        setQuizzes(response.quizzes)
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

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setStartTime(Date.now())
  }

  const handleAnswer = (questionId: number, answerValue: string | number, answerText?: string) => {
    setAnswers((prev) => ({ 
      ...prev, 
      [questionId]: { 
        questionId, 
        answerValue: String(answerValue),
        answerText: answerText || String(answerValue)
      } 
    }))
  }

  const handleNext = () => {
    if (activeQuiz?.questions && currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      handleSubmitQuiz()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return

    try {
      setIsSubmitting(true)
      
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
      
      const responses = Object.values(answers).map(answer => ({
        question_id: answer.questionId,
        answer_value: answer.answerValue || answer.answerText,
        answer_text: answer.answerText || answer.answerValue,
      }))

      const response = await quizService.submitResponse(activeQuiz.id, {
        responses,
        time_spent_seconds: timeSpent,
      })

      if (response.success) {
        setShowResults(true)
        toast({
          title: "Quiz Concluído!",
          description: "Suas respostas foram salvas com sucesso.",
        })
        
        // Reload quizzes to update completion status
        await loadQuizzes()
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao salvar respostas",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao enviar respostas. Tente novamente.",
        variant: "destructive",
      })
      console.error('Error submitting quiz:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateScore = () => {
    if (!activeQuiz?.questions) return 0
    
    const total = Object.values(answers).reduce((sum, answer) => {
      return sum + Number.parseInt(answer.answerValue || '0')
    }, 0)
    
    const maxScore = activeQuiz.questions.length * 4
    return Math.round((total / maxScore) * 100)
  }

  const getScoreInterpretation = (score: number) => {
    if (!activeQuiz) return { level: "Indefinido", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-900/20" }
    
    const interpretation = quizService.getScoreInterpretation(score, activeQuiz.type)
    
    const colorMap = {
      green: { color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
      blue: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
      yellow: { color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
      red: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20" },
      gray: { color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-900/20" },
    }
    
    return {
      level: interpretation.level,
      ...colorMap[interpretation.color as keyof typeof colorMap] || colorMap.gray
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
          <p className="mt-2 text-muted-foreground">
            Complete os questionários para acompanhar seu progresso terapêutico
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-10 w-20" />
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
            Complete os questionários para acompanhar seu progresso terapêutico
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

  // Results view
  if (showResults && activeQuiz) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Quiz Concluído!</CardTitle>
            <CardDescription>Obrigado por completar a avaliação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-2">Obrigado por responder!</p>
                <p className="text-sm text-muted-foreground">
                  Suas respostas foram salvas com sucesso. Sua psicóloga terá acesso às suas respostas para análise.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => {
                setActiveQuiz(null)
                setShowResults(false)
              }}>
                Voltar aos Quiz
              </Button>
              <Button className="flex-1" onClick={() => window.location.reload()}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz taking view
  if (activeQuiz && activeQuiz.questions) {
    const question = activeQuiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{activeQuiz.title}</CardTitle>
                <CardDescription>
                  Questão {currentQuestion + 1} de {activeQuiz.questions.length}
                </CardDescription>
              </div>
              <Badge variant="secondary">{Math.round(progress)}%</Badge>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{question.question_text}</h3>
              
              {/* Multiple Choice */}
              {question.question_type === 'multiple_choice' && question.options && (
                <RadioGroup 
                  value={answers[question.id]?.answerValue || ''} 
                  onValueChange={(value) => handleAnswer(question.id, value)}
                >
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                      >
                        <RadioGroupItem value={option.value} id={`q${question.id}-${option.value}`} />
                        <Label htmlFor={`q${question.id}-${option.value}`} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {/* Scale (0-10) */}
              {question.question_type === 'scale' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Escolha um valor de 0 a 10</Label>
                      <span className="text-lg font-semibold text-primary">
                        {answers[question.id]?.answerValue !== undefined ? answers[question.id]?.answerValue : '—'}
                      </span>
                    </div>
                    <Slider
                      value={answers[question.id]?.answerValue !== undefined 
                        ? [parseInt(answers[question.id]?.answerValue || '0')]
                        : [0]
                      }
                      onValueChange={(values) => handleAnswer(question.id, values[0])}
                      min={0}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                  {/* Input numérico alternativo para mobile */}
                  <div className="space-y-2">
                    <Label htmlFor={`q${question.id}-scale-input`} className="text-sm text-muted-foreground">
                      Ou digite o valor:
                    </Label>
                    <Input
                      id={`q${question.id}-scale-input`}
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      value={answers[question.id]?.answerValue || ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          // Permitir limpar o campo se não for obrigatório
                          setAnswers((prev) => {
                            const newAnswers = { ...prev }
                            delete newAnswers[question.id]
                            return newAnswers
                          })
                          return
                        }
                        const value = parseInt(e.target.value) || 0
                        const clampedValue = Math.min(Math.max(value, 0), 10)
                        handleAnswer(question.id, clampedValue)
                      }}
                      className="w-32"
                      placeholder={question.required ? "0-10" : "0-10 (opcional)"}
                    />
                  </div>
                </div>
              )}

              {/* Text (Texto Livre) */}
              {question.question_type === 'text' && (
                <div className="space-y-2">
                  <Textarea
                    value={answers[question.id]?.answerText || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value, e.target.value)}
                    placeholder="Digite sua resposta aqui..."
                    rows={6}
                    className="w-full resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Responda com o máximo de detalhes possível
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex-1 bg-transparent"
              >
                Anterior
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={
                  isSubmitting || 
                  (question.required && !answers[question.id]) ||
                  (question.required && question.question_type === 'multiple_choice' && !answers[question.id]?.answerValue) ||
                  (question.required && question.question_type === 'scale' && (answers[question.id]?.answerValue === undefined || answers[question.id]?.answerValue === '')) ||
                  (question.required && question.question_type === 'text' && (!answers[question.id]?.answerText || answers[question.id]?.answerText.trim() === ''))
                } 
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {currentQuestion === activeQuiz.questions.length - 1 ? "Finalizar" : "Próxima"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main quizzes list view
  const pendingQuizzes = quizzes.filter(q => !q.is_completed)
  const completedQuizzes = quizzes.filter(q => q.is_completed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
        <p className="mt-2 text-muted-foreground">
          Complete os questionários para acompanhar seu progresso terapêutico
        </p>
      </div>

      {/* Pending Quizzes */}
      {pendingQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Pendentes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingQuizzes.map((quiz) => (
              <Card key={quiz.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="mt-1">{quiz.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Novo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <span className="text-sm text-muted-foreground">Disponível</span>
                    <Button onClick={() => handleStartQuiz(quiz)}>Iniciar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Quizzes */}
      {completedQuizzes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Concluídos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedQuizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="mt-1">{quiz.description}</CardDescription>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <span className="text-sm text-muted-foreground">
                    {quiz.latest_attempt?.completed_at
                      ? `Concluído em ${new Date(
                          quiz.latest_attempt.completed_at
                        ).toLocaleDateString("pt-BR")}`
                      : "Concluído"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {quizzes.length === 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Brain className="mx-auto h-12 w-12 text-primary/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum quiz disponível</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Não há questionários disponíveis no momento. Entre em contato com sua psicóloga.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">Sobre os quizzes</p>
            <p className="mt-1 text-muted-foreground">
              Estes questionários ajudam você e sua psicóloga a acompanhar seu progresso. Responda com honestidade e
              regularidade para melhores resultados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
