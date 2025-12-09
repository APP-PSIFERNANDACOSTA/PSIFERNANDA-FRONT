"use client"

import { useState, useEffect, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Brain, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save,
  AlertCircle,
  GripVertical,
  Eye,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/services/quiz-service"
import { quizAssignmentService } from "@/services/quiz-assignment-service"
import { Quiz, UpdateQuizData, CreateQuizQuestionData } from "@/types/quiz"
import { PatientMultiSelect } from "@/components/forms/patient-multi-select"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface EditQuizPageProps {
  params: {
    id: string
  }
}

export default function EditQuizPage({ params }: EditQuizPageProps) {
  const resolvedParams = use(params)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [formData, setFormData] = useState<UpdateQuizData>({
    title: '',
    description: '',
    type: 'anxiety',
    duration_minutes: 5,
    status: 'draft',
    questions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Assignment data
  const [selectedPatientIds, setSelectedPatientIds] = useState<number[]>([])
  const [dueDate, setDueDate] = useState<string>()
  const [notes, setNotes] = useState<string>()
  
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
        setFormData({
          title: response.quiz.title,
          description: response.quiz.description || '',
          type: response.quiz.type,
          duration_minutes: response.quiz.duration_minutes,
          status: response.quiz.status,
          questions: response.quiz.questions?.map(q => ({
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options || [],
            order: q.order,
            required: q.required
          })) || []
        })
        
        // Load existing assignments
        await loadAssignments()
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
      const response = await quizAssignmentService.getAssignments({ quiz_id: quizId })
      if (response.success && response.data) {
        // Set the first assignment's due date and notes as default
        const firstAssignment = response.data[0]
        if (firstAssignment) {
          setDueDate(firstAssignment.due_date)
          setNotes(firstAssignment.notes)
        }
        
        // Set selected patient IDs
        const patientIds = response.data.map(assignment => assignment.patient_id)
        setSelectedPatientIds(patientIds)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const quizTypes = [
    { value: 'anxiety', label: 'Ansiedade' },
    { value: 'sleep', label: 'Sono' },
    { value: 'mood', label: 'Humor' },
    { value: 'self_esteem', label: 'Autoestima' },
    { value: 'custom', label: 'Personalizado' }
  ]

  const statusOptions = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addQuestion = () => {
    const newQuestion: CreateQuizQuestionData = {
      question_text: '',
      question_type: 'multiple_choice',
      options: [
        { value: '0', label: 'Nunca' },
        { value: '1', label: 'Raramente' },
        { value: '2', label: 'Às vezes' },
        { value: '3', label: 'Frequentemente' },
        { value: '4', label: 'Sempre' }
      ],
      order: formData.questions.length,
      required: true
    }
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const addOption = (questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...(q.options || []), { value: '', label: '' }] }
          : q
      )
    }))
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options?.filter((_, j) => j !== optionIndex) }
          : q
      )
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options?.map((opt, j) => 
                j === optionIndex ? { ...opt, [field]: value } : opt
              )
            }
          : q
      )
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'O título é obrigatório'
    }

    if (!formData.type) {
      newErrors.type = 'O tipo é obrigatório'
    }

    if (formData.questions.length === 0) {
      newErrors.questions = 'Pelo menos uma pergunta é obrigatória'
    }

    formData.questions.forEach((question, index) => {
      if (!question.question_text.trim()) {
        newErrors[`question_${index}_text`] = 'O texto da pergunta é obrigatório'
      }

      if (question.question_type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        newErrors[`question_${index}_options`] = 'Pelo menos 2 opções são obrigatórias'
      }

      question.options?.forEach((option, optIndex) => {
        if (!option.value.trim() || !option.label.trim()) {
          newErrors[`question_${index}_option_${optIndex}`] = 'Valor e label são obrigatórios'
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (status: 'draft' | 'active' = 'draft') => {
    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros antes de continuar.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      
      const submitData = {
        ...formData,
        status,
        questions: formData.questions.map((q, index) => ({
          ...q,
          order: index
        }))
      }

      const response = await quizService.update(quizId, submitData)
      
      if (response.success) {
        // Update assignments if any patients are selected
        if (selectedPatientIds.length > 0) {
          const assignmentResponse = await quizAssignmentService.assignToPatients(
            quizId,
            {
              patient_ids: selectedPatientIds,
              due_date: dueDate,
              notes: notes,
            }
          )
          
          if (assignmentResponse.success) {
            toast({
              title: "Quiz Atualizado e Atribuições Atualizadas!",
              description: `O quiz foi ${status === 'draft' ? 'salvo como rascunho' : 'atualizado'} e as atribuições foram atualizadas com sucesso.`,
            })
          } else {
            toast({
              title: "Quiz Atualizado!",
              description: `O quiz foi ${status === 'draft' ? 'salvo como rascunho' : 'atualizado'} com sucesso, mas houve erro ao atualizar as atribuições.`,
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Quiz Atualizado!",
            description: `O quiz foi ${status === 'draft' ? 'salvo como rascunho' : 'atualizado'} com sucesso.`,
          })
        }
        
        router.push('/dashboard/quizzes')
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao atualizar quiz",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar quiz. Tente novamente.",
        variant: "destructive",
      })
      console.error('Error updating quiz:', err)
    } finally {
      setIsSaving(false)
    }
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
            <h1 className="text-3xl font-bold text-foreground">Editar Quiz</h1>
            <p className="mt-2 text-muted-foreground">
              Edite as informações do seu quiz
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
            <h1 className="text-3xl font-bold text-foreground">Editar Quiz</h1>
            <p className="mt-2 text-muted-foreground">
              Edite as informações do seu quiz
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Rascunho
          </Button>
          <Button 
            onClick={() => handleSubmit('active')}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Atualizar Quiz
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações principais do quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Avaliação de Ansiedade Semanal"
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o objetivo do quiz..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {quizTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Atribuição de Pacientes</CardTitle>
              <CardDescription>
                Gerencie quais pacientes devem responder este quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientMultiSelect
                selectedPatientIds={selectedPatientIds}
                onSelectionChange={setSelectedPatientIds}
                dueDate={dueDate}
                onDueDateChange={setDueDate}
                notes={notes}
                onNotesChange={setNotes}
              />
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perguntas</CardTitle>
                  <CardDescription>
                    Edite as perguntas do seu quiz
                  </CardDescription>
                </div>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.questions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma pergunta adicionada</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clique em "Adicionar Pergunta" para começar
                  </p>
                </div>
              ) : (
                formData.questions.map((question, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">Pergunta {index + 1}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Texto da Pergunta *</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          placeholder="Digite sua pergunta aqui..."
                          rows={2}
                        />
                        {errors[`question_${index}_text`] && (
                          <p className="text-sm text-red-600">{errors[`question_${index}_text`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Pergunta</Label>
                        <Select 
                          value={question.question_type} 
                          onValueChange={(value) => updateQuestion(index, 'question_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                            <SelectItem value="scale">Escala</SelectItem>
                            <SelectItem value="text">Texto Livre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {question.question_type === 'multiple_choice' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Opções de Resposta *</Label>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {question.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <Input
                                placeholder="Valor (ex: 0, 1, 2...)"
                                value={option.value}
                                onChange={(e) => updateOption(index, optIndex, 'value', e.target.value)}
                                className="w-20"
                              />
                              <Input
                                placeholder="Label (ex: Nunca, Raramente...)"
                                value={option.label}
                                onChange={(e) => updateOption(index, optIndex, 'label', e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index, optIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {errors[`question_${index}_options`] && (
                            <p className="text-sm text-red-600">{errors[`question_${index}_options`]}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
              
              {errors.questions && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.questions}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium">{formData.title || 'Título do Quiz'}</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.description || 'Descrição do quiz...'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">{quizTypes.find(t => t.value === formData.type)?.label}</Badge>
                <Badge variant="secondary">{formData.duration_minutes} min</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {formData.questions.length} pergunta(s)
              </div>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Atribuição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Pacientes selecionados:</span>
                <span className="ml-2 font-medium">{selectedPatientIds.length}</span>
              </div>
              
              {dueDate && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Data limite:</span>
                  <span className="ml-2 font-medium">
                    {new Date(dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              {notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Observações:</span>
                  <p className="mt-1 text-xs bg-muted p-2 rounded">
                    {notes}
                  </p>
                </div>
              )}
              
              {selectedPatientIds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum paciente selecionado. O quiz será atualizado mas não atribuído.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-medium">{quiz?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span className="font-medium">
                  {quiz?.created_at ? new Date(quiz.created_at).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última atualização:</span>
                <span className="font-medium">
                  {quiz?.updated_at ? new Date(quiz.updated_at).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status atual:</span>
                <Badge variant={quiz?.status === 'active' ? 'default' : 'secondary'}>
                  {statusOptions.find(s => s.value === quiz?.status)?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">Ao editar:</h4>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Salve como rascunho para testar</li>
                  <li>• Publique apenas quando estiver pronto</li>
                  <li>• Respostas existentes serão mantidas</li>
                  <li>• Mudanças afetam novos respondentes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
