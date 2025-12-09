"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Loader2, Activity, Wind, Brain, Target, Sparkles } from "lucide-react"
import exerciseService from "@/services/exercise-service"
import type { Exercise, ExerciseType } from "@/types/exercise"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

interface ExerciseFormState {
  id?: number
  title: string
  description: string
  category: string
  type: ExerciseType
  durationMinutes: string
  targetReps: string
  is_active: boolean
}

const defaultForm: ExerciseFormState = {
  title: "",
  description: "",
  category: "",
  type: "timer",
  durationMinutes: "5",
  targetReps: "",
  is_active: true,
}

export default function ExercisesPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [aiGoal, setAIGoal] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [form, setForm] = useState<ExerciseFormState>(defaultForm)

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

  const openCreateDialog = () => {
    setForm(defaultForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (exercise: Exercise) => {
    setForm({
      id: exercise.id,
      title: exercise.title,
      description: exercise.description || "",
      category: exercise.category || "",
      type: exercise.type,
      durationMinutes: exercise.duration_seconds ? String(Math.round(exercise.duration_seconds / 60)) : "",
      targetReps: exercise.target_reps ? String(exercise.target_reps) : "",
      is_active: exercise.is_active,
    })
    setIsDialogOpen(true)
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

    setIsSaving(true)
    try {
      const payload: Partial<Exercise> = {
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
        is_active: form.is_active,
      }

      let saved: Exercise
      if (form.id) {
        saved = await exerciseService.update(form.id, payload)
        showSuccessToast("Exercício atualizado", "As informações do exercício foram salvas.")
      } else {
        saved = await exerciseService.create(payload)
        showSuccessToast("Exercício criado", "Novo exercício cadastrado com sucesso.")
      }

      setIsDialogOpen(false)
      setForm(defaultForm)

      // Atualizar lista local
      setExercises((prev) => {
        const others = prev.filter((e) => e.id !== saved.id)
        return [...others, saved].sort((a, b) => a.title.localeCompare(b.title))
      })
    } catch (error: any) {
      console.error("Erro ao salvar exercício:", error)
      showErrorToast("Erro ao salvar exercício", error.response?.data?.message || "Tente novamente mais tarde.")
    } finally {
      setIsSaving(false)
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

  const handleGenerateWithAI = async () => {
    if (!aiGoal.trim()) {
      showErrorToast("Campos obrigatórios", "Descreva o foco do exercício para a IA (ex.: ansiedade, sono, respiração).")
      return
    }

    setIsGeneratingAI(true)
    try {
      const generated = await exerciseService.generateWithAI({
        focus: aiGoal.trim(),
      })

      if (!generated) {
        showErrorToast("Erro", "Não foi possível gerar um exercício com IA agora.")
        return
      }

      // Preenche o formulário, mas NÃO salva
      setForm({
        id: undefined,
        title: generated.title,
        description: generated.description || "",
        category: generated.category || "",
        type: generated.type,
        durationMinutes:
          generated.type === "timer" && generated.duration_seconds
            ? String(Math.max(1, Math.round(generated.duration_seconds / 60)))
            : "",
        targetReps:
          generated.type === "counter" && generated.target_reps
            ? String(generated.target_reps)
            : "",
        is_active: true,
      })

      setIsAIDialogOpen(false)
      setAIGoal("")
      setIsDialogOpen(true)
      showSuccessToast("Exercício sugerido", "Revise os campos e clique em salvar se estiver satisfeito.")
    } catch (error: any) {
      console.error("Erro ao gerar exercício com IA:", error)
      showErrorToast("Erro", error.response?.data?.message || "Não foi possível gerar o exercício com IA.")
    } finally {
      setIsGeneratingAI(false)
    }
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
            <Button
              variant="outline"
              onClick={() => setIsAIDialogOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Gerar com IA
            </Button>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Exercício
            </Button>
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
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(exercise)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {exercise.type === "timer" ? "Com tempo" : "Contagem"}
                            </Badge>
                            {exercise.type === "timer" && exercise.duration_seconds && (
                              <span>{Math.round(exercise.duration_seconds / 60)} min recomendados</span>
                            )}
                            {exercise.type === "counter" && exercise.target_reps && (
                              <span>{exercise.target_reps} repetições recomendadas</span>
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

        {/* Dialog de criação/edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
              <DialogDescription>
                Defina os detalhes do exercício terapêutico que ficará disponível para seus pacientes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                  rows={3}
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
                ) : (
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
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                />
                <Label htmlFor="is_active" className="text-sm text-muted-foreground">
                  Disponível no portal do paciente
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setForm(defaultForm)
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {form.id ? "Salvar alterações" : "Criar exercício"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Gerar com IA */}
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar exercício com IA</DialogTitle>
              <DialogDescription>
                Descreva o objetivo terapêutico ou situação do paciente. A IA vai sugerir um exercício, sem salvar
                automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-goal">Objetivo / foco do exercício *</Label>
                <Textarea
                  id="ai-goal"
                  value={aiGoal}
                  onChange={(e) => setAIGoal(e.target.value)}
                  placeholder="Ex.: ajudar paciente a reduzir ansiedade antes de dormir, focando em respiração e relaxamento..."
                  rows={4}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A sugestão será usada apenas para preencher o formulário. Você poderá revisar e editar tudo antes de salvar.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAIDialogOpen(false)
                    setAIGoal("")
                  }}
                  disabled={isGeneratingAI}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!aiGoal.trim() || isGeneratingAI}
                  className="gap-2"
                  onClick={async () => {
                    if (!aiGoal.trim()) return
                    try {
                      setIsGeneratingAI(true)
                      const suggestion = await exerciseService.generateWithAI(aiGoal.trim())

                      setForm((prev) => ({
                        ...prev,
                        id: undefined, // sempre criar novo
                        title: suggestion.title || prev.title,
                        description: suggestion.description || prev.description,
                        category: suggestion.category || prev.category,
                        type: suggestion.type,
                        durationMinutes:
                          suggestion.type === "timer" && suggestion.duration_seconds
                            ? String(Math.round(suggestion.duration_seconds / 60))
                            : "",
                        targetReps:
                          suggestion.type === "counter" && suggestion.target_reps
                            ? String(suggestion.target_reps)
                            : "",
                      }))

                      setIsAIDialogOpen(false)
                      setAIGoal("")
                      setIsDialogOpen(true)
                      showSuccessToast("Sugestão gerada", "Revise o exercício sugerido antes de salvar.")
                    } catch (error: any) {
                      console.error("Erro ao gerar exercício com IA:", error)
                      showErrorToast(
                        "Erro ao gerar com IA",
                        error.response?.data?.message || "Não foi possível gerar sugestão no momento.",
                      )
                    } finally {
                      setIsGeneratingAI(false)
                    }
                  }}
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar sugestão
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de geração com IA */}
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar exercício com IA</DialogTitle>
              <DialogDescription>
                Descreva o foco do exercício (ex.: “respiração para crise de ansiedade”, “relaxamento antes de dormir”).
                A IA irá sugerir um exercício e você poderá editar antes de salvar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-goal">Foco / objetivo do exercício *</Label>
                <Textarea
                  id="ai-goal"
                  value={aiGoal}
                  onChange={(e) => setAIGoal(e.target.value)}
                  placeholder="Ex.: Exercício de respiração curta para momentos de ansiedade intensa."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAIDialogOpen(false)
                    setAIGoal("")
                  }}
                  disabled={isGeneratingAI}
                >
                  Cancelar
                </Button>
                <Button onClick={handleGenerateWithAI} disabled={isGeneratingAI} className="gap-2">
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar com IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}


