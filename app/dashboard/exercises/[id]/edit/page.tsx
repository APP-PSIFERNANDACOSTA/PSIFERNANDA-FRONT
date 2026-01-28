"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react"
import exerciseService from "@/services/exercise-service"
import type { Exercise, ExerciseType, ExerciseStep } from "@/types/exercise"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

interface ExerciseFormState {
  id?: number
  title: string
  description: string
  category: string
  type: ExerciseType
  durationMinutes: string
  targetReps: string
  steps: ExerciseStep[]
  is_active: boolean
}

export default function EditExercisePage() {
  const router = useRouter()
  const params = useParams()
  const exerciseId = Number(params.id)
  const [form, setForm] = useState<ExerciseFormState>({
    title: "",
    description: "",
    category: "",
    type: "timer",
    durationMinutes: "",
    targetReps: "",
    steps: [],
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadExercise()
  }, [exerciseId])

  const loadExercise = async () => {
    setIsLoading(true)
    try {
      const exercises = await exerciseService.getAll()
      const exercise = exercises.find((e) => e.id === exerciseId)
      if (!exercise) {
        showErrorToast("Erro", "Exercício não encontrado.")
        router.push("/dashboard/exercises")
        return
      }

      setForm({
        id: exercise.id,
        title: exercise.title,
        description: exercise.description || "",
        category: exercise.category || "",
        type: exercise.type,
        durationMinutes: exercise.duration_seconds ? String(Math.round(exercise.duration_seconds / 60)) : "",
        targetReps: exercise.target_reps ? String(exercise.target_reps) : "",
        steps: exercise.steps || [],
        is_active: exercise.is_active,
      })
    } catch (error: any) {
      console.error("Erro ao carregar exercício:", error)
      showErrorToast("Erro", "Não foi possível carregar o exercício.")
      router.push("/dashboard/exercises")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      showErrorToast("Campos obrigatórios", "O título do exercício é obrigatório.")
      return
    }

    if (form.type === "timer" && !form.durationMinutes.trim()) {
      showErrorToast("Campos obrigatórios", "Informe a duração em minutos para exercícios com tempo.")
      return
    }

    if (form.type === "counter" && !form.targetReps.trim()) {
      showErrorToast("Campos obrigatórios", "Informe o número de repetições para exercícios com contagem.")
      return
    }

    if (form.type === "guided" && form.steps.length === 0) {
      showErrorToast("Campos obrigatórios", "Adicione pelo menos um passo para exercícios guiados.")
      return
    }

    if (form.type === "guided") {
      for (let i = 0; i < form.steps.length; i++) {
        const step = form.steps[i]
        if (!step.description.trim()) {
          showErrorToast("Campos obrigatórios", `A descrição do passo ${i + 1} é obrigatória.`)
          return
        }
        if (!step.duration_seconds || step.duration_seconds < 1) {
          showErrorToast("Campos obrigatórios", `O tempo do passo ${i + 1} deve ser pelo menos 1 segundo.`)
          return
        }
      }
    }

    setIsSaving(true)
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        type: form.type,
        duration_seconds:
          form.type === "timer" && form.durationMinutes
            ? Number(form.durationMinutes) * 60
            : null,
        target_reps:
          form.type === "counter" && form.targetReps
            ? Number(form.targetReps)
            : null,
        steps:
          form.type === "guided" && form.steps.length > 0
            ? form.steps
            : null,
        is_active: form.is_active,
      }

      await exerciseService.update(form.id!, payload)
      showSuccessToast("Exercício atualizado", "As informações do exercício foram salvas.")
      router.push("/dashboard/exercises")
    } catch (error: any) {
      console.error("Erro ao salvar exercício:", error)
      showErrorToast("Erro ao salvar exercício", error.response?.data?.message || "Tente novamente mais tarde.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/exercises">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Exercício</h1>
              <p className="text-gray-600">
                Atualize os detalhes do exercício terapêutico.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Exercício</CardTitle>
            <CardDescription>Preencha os dados básicos do exercício</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Respiração 4-7-8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Explique brevemente como o exercício funciona e quando utilizá-lo."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ex.: respiração, mindfulness, relaxamento..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value: ExerciseType) => setForm((f) => ({ ...f, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timer">Com tempo (minutos)</SelectItem>
                    <SelectItem value="counter">Com contagem (repetições)</SelectItem>
                    <SelectItem value="guided">Guiado (passos com tempos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === "timer" ? (
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duração recomendada (minutos) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={1}
                    max={120}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                    placeholder="Ex.: 5"
                  />
                </div>
              ) : form.type === "counter" ? (
                <div className="space-y-2">
                  <Label htmlFor="targetReps">Repetições recomendadas *</Label>
                  <Input
                    id="targetReps"
                    type="number"
                    min={1}
                    max={1000}
                    value={form.targetReps}
                    onChange={(e) => setForm((f) => ({ ...f, targetReps: e.target.value }))}
                    placeholder="Ex.: 10"
                  />
                </div>
              ) : null}
            </div>

            {form.type === "guided" && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Passos do exercício *</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Defina cada passo com descrição e tempo em segundos
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        steps: [...f.steps, { description: "", duration_seconds: 10 }],
                      }))
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar passo
                  </Button>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto border rounded-lg p-4 bg-muted/20">
                  {form.steps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum passo adicionado. Clique em "Adicionar passo" para começar.
                    </p>
                  ) : (
                    form.steps.map((step, index) => (
                      <div key={index} className="flex gap-3 items-start p-4 border rounded-lg bg-background">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Passo {index + 1}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <Input
                              placeholder="Ex.: Inspire pelo nariz contando 4 segundos"
                              value={step.description}
                              onChange={(e) => {
                                const newSteps = [...form.steps]
                                newSteps[index] = { ...newSteps[index], description: e.target.value }
                                setForm((f) => ({ ...f, steps: newSteps }))
                              }}
                            />
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                min={1}
                                max={600}
                                placeholder="Tempo (segundos)"
                                value={step.duration_seconds}
                                onChange={(e) => {
                                  const newSteps = [...form.steps]
                                  newSteps[index] = {
                                    ...newSteps[index],
                                    duration_seconds: Number(e.target.value) || 1,
                                  }
                                  setForm((f) => ({ ...f, steps: newSteps }))
                                }}
                                className="w-40"
                              />
                              <span className="text-sm text-muted-foreground">segundos</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newSteps = form.steps.filter((_, i) => i !== index)
                                  setForm((f) => ({ ...f, steps: newSteps }))
                                }}
                                className="ml-auto"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {form.steps.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Total: {form.steps.reduce((acc, step) => acc + step.duration_seconds, 0)} segundos (
                    {Math.round((form.steps.reduce((acc, step) => acc + step.duration_seconds, 0) / 60) * 10) / 10}{" "}
                    min)
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm text-muted-foreground">
                Disponível no portal do paciente
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/exercises">
                <Button variant="outline" disabled={isSaving}>
                  Cancelar
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
