"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Wind, Sparkles, Trophy, Play, Pause, RotateCcw, CheckCircle2, Clock, Target } from "lucide-react"
import exerciseService from "@/services/exercise-service"
import type { Exercise } from "@/types/exercise"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

const achievements = [
  { id: 1, title: "Primeira Respiração", description: "Complete seu primeiro exercício de respiração", unlocked: true },
  { id: 2, title: "Semana Consistente", description: "Pratique por 7 dias seguidos", unlocked: true },
  { id: 3, title: "Mestre do Mindfulness", description: "Complete 10 sessões de mindfulness", unlocked: false },
  { id: 4, title: "Gratidão Constante", description: "Pratique gratidão por 30 dias", unlocked: false },
]

export default function ExerciciosPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [reps, setReps] = useState(0)
  // Estados para exercícios guiados
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepTimeRemaining, setStepTimeRemaining] = useState(0)

  useEffect(() => {
    const loadExercises = async () => {
      try {
        setIsLoading(true)
        const data = await exerciseService.getMyExercises()
        setExercises(data)
      } catch (error: any) {
        console.error("Erro ao carregar exercícios:", error)
        showErrorToast("Erro", "Não foi possível carregar os exercícios no momento.")
      } finally {
        setIsLoading(false)
      }
    }

    loadExercises()
  }, [])

  // Timer simples quando está tocando
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Atualizar tempo restante quando mudar de step em exercícios guiados
  useEffect(() => {
    if (activeExercise?.type === "guided" && activeExercise.steps && activeExercise.steps[currentStepIndex]) {
      setStepTimeRemaining(activeExercise.steps[currentStepIndex].duration_seconds)
    }
  }, [currentStepIndex, activeExercise])

  // Timer para exercícios guiados
  useEffect(() => {
    if (!isPlaying || activeExercise?.type !== "guided" || !activeExercise.steps) return

    const currentStep = activeExercise.steps[currentStepIndex]
    if (!currentStep) return

    const interval = setInterval(() => {
      setStepTimeRemaining((prev) => {
        if (prev <= 1) {
          // Passar para o próximo step
          if (currentStepIndex < activeExercise.steps!.length - 1) {
            const nextIndex = currentStepIndex + 1
            setCurrentStepIndex(nextIndex)
            return activeExercise.steps![nextIndex]?.duration_seconds || 0
          } else {
            // Exercício completo
            setIsPlaying(false)
            return 0
          }
        }
        return prev - 1
      })
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, activeExercise, currentStepIndex])

  const handleStartExercise = async (exercise: Exercise) => {
    try {
      setActiveExercise(exercise)
      setIsPlaying(false)
      setElapsedSeconds(0)
      setReps(0)

      const session = await exerciseService.startExercise(exercise.id)
      setCurrentSessionId(session.id)
    } catch (error: any) {
      console.error("Erro ao iniciar exercício:", error)
      showErrorToast("Erro", "Não foi possível iniciar o exercício.")
    }
  }

  const handleComplete = async () => {
    if (!activeExercise) return

    try {
      await exerciseService.completeExercise(activeExercise.id, {
        session_id: currentSessionId ?? undefined,
        duration_seconds_real: activeExercise.type === "timer" ? elapsedSeconds : undefined,
        reps_real: activeExercise.type === "counter" ? reps : undefined,
      })
      showSuccessToast("Exercício concluído", "Excelente, continue praticando!")
    } catch (error: any) {
      console.error("Erro ao concluir exercício:", error)
      showErrorToast("Erro", "Não foi possível registrar a conclusão.")
    } finally {
      setActiveExercise(null)
      setIsPlaying(false)
      setElapsedSeconds(0)
      setReps(0)
      setCurrentSessionId(null)
      setCurrentStepIndex(0)
      setStepTimeRemaining(0)
    }
  }

  const formatMinutes = (seconds: number | null | undefined) => {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const getIconForExercise = (exercise: Exercise) => {
    const category = (exercise.category || "").toLowerCase()
    if (category.includes("respir")) return Wind
    if (category.includes("mind") || category.includes("atenção")) return Brain
    if (category.includes("relax")) return Sparkles
    return Target
  }

  const getDescriptionSummary = (description: string | null | undefined) => {
    if (!description) return ""
    const firstLine = description.split(/\r?\n/)[0].trim()
    if (firstLine.length <= 120) return firstLine
    return firstLine.slice(0, 117) + "..."
  }

  // Tela de execução do exercício
  if (activeExercise) {
    const Icon = getIconForExercise(activeExercise)
    const targetSeconds = activeExercise.duration_seconds || 0
    const progress =
      activeExercise.type === "timer" && targetSeconds > 0
        ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100))
        : 0

    return (
      <div className="mx-auto max-w-3xl space-y-8 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{activeExercise.title}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setActiveExercise(null)
              setIsPlaying(false)
              setElapsedSeconds(0)
              setReps(0)
              setCurrentSessionId(null)
              setCurrentStepIndex(0)
              setStepTimeRemaining(0)
            }}
          >
            Voltar
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-8 space-y-8">
            <div className="flex justify-center">
              <div className="flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="text-center">
                  <Icon className="mx-auto h-16 w-16 text-primary" />
                  {activeExercise.type === "guided" && activeExercise.steps ? (
                    <>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Passo {currentStepIndex + 1} de {activeExercise.steps.length}
                      </p>
                      <p className="mt-1 text-4xl font-bold text-primary">{stepTimeRemaining}</p>
                      <p className="mt-2 text-xs text-muted-foreground">segundos restantes</p>
                      {activeExercise.steps[currentStepIndex] && (
                        <p className="mt-3 text-sm font-medium text-foreground max-w-[200px] mx-auto">
                          {activeExercise.steps[currentStepIndex].description}
                        </p>
                      )}
                    </>
                  ) : activeExercise.type === "timer" ? (
                    <>
                      <p className="mt-4 text-sm text-muted-foreground">Tempo decorrido</p>
                      <p className="mt-1 text-4xl font-bold text-primary">
                        {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:
                        {String(elapsedSeconds % 60).padStart(2, "0")}
                      </p>
                      {activeExercise.duration_seconds && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Duração recomendada: {formatMinutes(activeExercise.duration_seconds)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mt-4 text-sm text-muted-foreground">Repetições concluídas</p>
                      <p className="mt-1 text-4xl font-bold text-primary">{reps}</p>
                      {activeExercise.target_reps && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Repetições recomendadas: {activeExercise.target_reps}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {activeExercise.type === "guided" && activeExercise.steps ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso do exercício</span>
                    <span className="font-medium">
                      {Math.round(((currentStepIndex + (stepTimeRemaining === 0 ? 1 : 0)) / activeExercise.steps.length) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={((currentStepIndex + (stepTimeRemaining === 0 ? 1 : 0)) / activeExercise.steps.length) * 100}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Próximos passos:</p>
                  <div className="space-y-1">
                    {activeExercise.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded ${
                          idx === currentStepIndex
                            ? "bg-primary/20 border border-primary/40 font-medium"
                            : idx < currentStepIndex
                              ? "bg-muted/50 text-muted-foreground line-through"
                              : "bg-muted/20"
                        }`}
                      >
                        {idx + 1}. {step.description} ({step.duration_seconds}s)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeExercise.type === "timer" && activeExercise.duration_seconds ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso em relação ao tempo recomendado</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setIsPlaying((prev) => !prev)}
                className="flex-1 min-w-[160px]"
                size="lg"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Iniciar
                  </>
                )}
              </Button>

              {activeExercise.type === "counter" && (
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[160px]"
                  onClick={() => setReps((prev) => prev + 1)}
                >
                  <Target className="mr-2 h-5 w-5" />
                  + 1 repetição
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="min-w-[120px]"
                onClick={() => {
                  setElapsedSeconds(0)
                  setReps(0)
                  setCurrentStepIndex(0)
                  setStepTimeRemaining(
                    activeExercise.type === "guided" && activeExercise.steps?.[0]
                      ? activeExercise.steps[0].duration_seconds
                      : 0
                  )
                }}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reiniciar
              </Button>
            </div>

            {activeExercise.description && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Como fazer:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {activeExercise.description
                    .split(/\r?\n|\. /)
                    .map((step) => step.trim())
                    .filter((step) => step.length > 0)
                    .map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleComplete}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Concluir exercício
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exercícios Terapêuticos</h1>
        <p className="mt-2 text-muted-foreground">
          Práticas recomendadas pela sua psicóloga, como respiração, mindfulness e relaxamento.
        </p>
      </div>

      {/* Stats simples */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{exercises.length}</p>
              <p className="text-xs text-muted-foreground">Exercícios disponíveis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-xs text-muted-foreground">Exercícios feitos (em breve)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de exercícios */}
      <div className="space-y-5 sm:space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Exercícios disponíveis</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando exercícios...</p>
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nenhum exercício disponível no momento. Sua psicóloga ainda não cadastrou exercícios.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exercises.map((exercise) => {
              const Icon = getIconForExercise(exercise)
              return (
                <Card key={exercise.id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{exercise.title}</CardTitle>
                          {exercise.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {getDescriptionSummary(exercise.description)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {exercise.type === "timer" ? "Com tempo" : exercise.type === "counter" ? "Contagem" : "Guiado"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {exercise.type === "timer" && exercise.duration_seconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatMinutes(exercise.duration_seconds)}
                        </span>
                      )}
                      {exercise.type === "counter" && exercise.target_reps && (
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {exercise.target_reps} repetições recomendadas
                        </span>
                      )}
                      {exercise.type === "guided" && exercise.steps && exercise.steps.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {exercise.steps.length} passos guiados
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleStartExercise(exercise)}
                      className="w-full"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar exercício
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}


