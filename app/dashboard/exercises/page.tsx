"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit2, Loader2, Activity, Wind, Brain, Target } from "lucide-react"
import exerciseService from "@/services/exercise-service"
import type { Exercise } from "@/types/exercise"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    setIsLoading(true)
    try {
      const data = await exerciseService.getAll()
      setExercises(data)
    } catch (error: any) {
      console.error("Erro ao carregar exercícios:", error)
      showErrorToast("Erro ao carregar exercícios", error.response?.data?.message || "Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (exercise: Exercise) => {
    try {
      const updated = await exerciseService.toggleActive(exercise.id)
      setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      showSuccessToast(
        "Status atualizado",
        updated.is_active ? "Exercício ativado para os pacientes." : "Exercício desativado para os pacientes.",
      )
    } catch (error: any) {
      console.error("Erro ao atualizar status do exercício:", error)
      showErrorToast("Erro", error.response?.data?.message || "Não foi possível atualizar o status.")
    }
  }

  const getCategoryIcon = (category?: string | null) => {
    if (!category) return Activity
    const normalized = category.toLowerCase()
    if (normalized.includes("respir") || normalized.includes("respiração")) return Wind
    if (normalized.includes("mind") || normalized.includes("atenção")) return Brain
    if (normalized.includes("alvo") || normalized.includes("meta")) return Target
    return Activity
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercícios Terapêuticos</h1>
            <p className="text-gray-600">
              Cadastre exercícios como respiração, mindfulness e outras práticas para seus pacientes.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/exercises/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Exercício
              </Button>
            </Link>
          </div>
        </div>

        {/* Lista de exercícios */}
        <Card>
          <CardHeader>
            <CardTitle>Exercícios cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando exercícios...
              </div>
            ) : exercises.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum exercício cadastrado ainda. Clique em <strong>Novo Exercício</strong> para começar.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {exercises
                  .slice()
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((exercise) => {
                    const Icon = getCategoryIcon(exercise.category)
                    return (
                      <Card
                        key={exercise.id}
                        className={exercise.is_active ? "border-primary/20" : "border-dashed border-gray-300"}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h2 className="font-semibold text-foreground">{exercise.title}</h2>
                                  {!exercise.is_active && (
                                    <Badge variant="outline" className="text-xs">
                                      Inativo
                                    </Badge>
                                  )}
                                </div>
                                {exercise.category && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{exercise.category}</p>
                                )}
                                {exercise.description && (
                                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                    {exercise.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Link href={`/dashboard/exercises/${exercise.id}/edit`}>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {exercise.type === "timer" ? "Com tempo" : exercise.type === "counter" ? "Contagem" : "Guiado"}
                            </Badge>
                            {exercise.type === "timer" && exercise.duration_seconds && (
                              <span>{Math.round(exercise.duration_seconds / 60)} min recomendados</span>
                            )}
                            {exercise.type === "counter" && exercise.target_reps && (
                              <span>{exercise.target_reps} repetições recomendadas</span>
                            )}
                            {exercise.type === "guided" && exercise.steps && exercise.steps.length > 0 && (
                              <span>{exercise.steps.length} passos ({Math.round(exercise.steps.reduce((acc, s) => acc + s.duration_seconds, 0) / 60 * 10) / 10} min)</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`active-${exercise.id}`}
                                checked={exercise.is_active}
                                onCheckedChange={() => handleToggleActive(exercise)}
                              />
                              <Label htmlFor={`active-${exercise.id}`} className="text-xs text-muted-foreground">
                                {exercise.is_active
                                  ? "Visível no portal do paciente"
                                  : "Oculto no portal do paciente"}
                              </Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
