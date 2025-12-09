"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save,
  AlertCircle,
  GripVertical,
  Eye,
  Sparkles,
  Loader2,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quizService } from "@/services/quiz-service"
import { quizAssignmentService } from "@/services/quiz-assignment-service"
import { CreateQuizData, CreateQuizQuestionData } from "@/types/quiz"
import { PatientMultiSelect } from "@/components/forms/patient-multi-select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CreateQuizPage() {
  const [formData, setFormData] = useState<CreateQuizData>({
    title: '',
    description: '',
    type: '',
    duration_minutes: 5,
    status: 'draft',
    questions: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiQuestionCount, setAiQuestionCount] = useState(5)
  const [aiQuestionType, setAiQuestionType] = useState('mixed')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false)
  const [aiGenerateTopic, setAiGenerateTopic] = useState('')
  const [aiGenerateQuestionCount, setAiGenerateQuestionCount] = useState(5)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  
  // Assignment data
  const [selectedPatientIds, setSelectedPatientIds] = useState<number[]>([])
  const [dueDate, setDueDate] = useState<string>()
  const [notes, setNotes] = useState<string>()
  
  const { toast } = useToast()
  const router = useRouter()

  const statusOptions = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ]

  const questionTypeOptions = [
    { value: 'mixed', label: 'Misto' },
    { value: 'multiple_choice', label: 'Múltipla Escolha' },
    { value: 'scale', label: 'Escala' },
    { value: 'text', label: 'Texto Livre' }
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

  const generateQuestionsWithAI = async () => {
    try {
      setIsGeneratingAI(true)
      
      const response = await quizService.generateQuestionsWithAI({
        type: formData.type,
        count: aiQuestionCount,
        question_type: aiQuestionType
      })
      
      if (response.success && response.data?.questions) {
        // Adicionar as perguntas geradas pela IA
        const aiQuestions = response.data.questions.map((q: any, index: number) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          order: formData.questions.length + index,
          required: true
        }))
        
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...aiQuestions]
        }))
        
        toast({
          title: "Perguntas Geradas!",
          description: `${aiQuestions.length} perguntas foram geradas com IA e adicionadas ao quiz.`,
        })
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao gerar perguntas com IA",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar perguntas com IA. Tente novamente.",
        variant: "destructive",
      })
      console.error('Error generating questions with AI:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleGenerateQuizWithAI = async () => {
    if (!aiGenerateTopic || !aiGenerateTopic.trim()) {
      toast({
        title: "Erro",
        description: "Digite um tema para o quiz",
        variant: "destructive",
      })
      return
    }

    if (aiGenerateQuestionCount < 3 || aiGenerateQuestionCount > 20) {
      toast({
        title: "Erro",
        description: "A quantidade de perguntas deve ser entre 3 e 20",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingQuiz(true)
      
      const response = await quizService.generateQuizWithAI({
        topic: aiGenerateTopic.trim(),
        question_count: aiGenerateQuestionCount
      })

      if (response.success && response.data) {
        const quizData = response.data
        
        // Preencher o formulário com os dados gerados
        setFormData({
          title: quizData.title,
          description: quizData.description || '',
          type: aiGenerateTopic.trim() || quizData.type || 'Personalizado', // Usar o tema digitado
          duration_minutes: quizData.duration_minutes,
          status: 'draft',
          questions: quizData.questions.map((q: any, index: number) => ({
            question_text: q.question_text || '',
            question_type: q.question_type || 'multiple_choice',
            options: q.options || [],
            order: index,
            required: true
          }))
        })

        toast({
          title: "Quiz Gerado com IA",
          description: `Quiz "${quizData.title}" gerado com sucesso! Revise e ajuste antes de salvar.`,
        })

        // Fechar modal
        setShowAIGenerateModal(false)
        // Resetar campos do modal
        setAiGenerateTopic('')
        setAiGenerateQuestionCount(5)
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao gerar quiz com IA",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar quiz com IA. Tente novamente.",
        variant: "destructive",
      })
      console.error('Error generating quiz:', error)
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'O título é obrigatório'
    }

    if (!formData.type || !formData.type.trim()) {
      newErrors.type = 'O tipo/tema é obrigatório'
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
      setIsLoading(true)
      
      const submitData = {
        ...formData,
        status,
        questions: formData.questions.map((q, index) => ({
          ...q,
          order: index
        }))
      }

      const response = await quizService.create(submitData)
      
      if (response.success && response.quiz) {
        // Assign quiz to patients if any are selected
        if (selectedPatientIds.length > 0) {
          const assignmentResponse = await quizAssignmentService.assignToPatients(
            response.quiz.id,
            {
              patient_ids: selectedPatientIds,
              due_date: dueDate,
              notes: notes,
            }
          )
          
          if (assignmentResponse.success) {
            toast({
              title: "Quiz Criado e Atribuído!",
              description: `O quiz foi ${status === 'draft' ? 'salvo como rascunho' : 'publicado'} e atribuído a ${assignmentResponse.assigned_count} paciente(s) com sucesso.`,
            })
          } else {
            toast({
              title: "Quiz Criado!",
              description: `O quiz foi ${status === 'draft' ? 'salvo como rascunho' : 'publicado'} com sucesso, mas houve erro ao atribuir aos pacientes.`,
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Quiz Criado!",
            description: `O quiz foi ${status === 'draft' ? 'salvo como rascunho' : 'publicado'} com sucesso.`,
          })
        }
        
        router.push('/dashboard/quizzes')
      } else {
        toast({
          title: "Erro",
          description: response.message || "Erro ao criar quiz",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao criar quiz. Tente novamente.",
        variant: "destructive",
      })
      console.error('Error creating quiz:', err)
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-3xl font-bold text-foreground">Criar Novo Quiz</h1>
            <p className="mt-2 text-muted-foreground">
              Crie um questionário personalizado para seus pacientes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowAIGenerateModal(true)}
            disabled={isLoading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Criar com IA
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button 
            onClick={() => handleSubmit('active')}
            disabled={isLoading}
          >
            <Brain className="mr-2 h-4 w-4" />
            Publicar Quiz
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
                  <Label htmlFor="type">Tipo/Tema *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    placeholder="Ex: Ansiedade, Depressão, Sono, Estresse..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Descreva o tema ou tipo do quiz
                  </p>
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
                Selecione quais pacientes devem responder este quiz
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
                    Adicione as perguntas do seu quiz
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={aiQuestionCount.toString()} onValueChange={(value) => setAiQuestionCount(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={aiQuestionType} onValueChange={setAiQuestionType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={generateQuestionsWithAI} 
                    variant="outline" 
                    size="sm"
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isGeneratingAI ? 'Gerando...' : 'Gerar com IA'}
                  </Button>
                  <Button onClick={addQuestion} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Pergunta
                  </Button>
                </div>
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
                <Badge variant="outline">{formData.type || 'Sem tipo'}</Badge>
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
                  Nenhum paciente selecionado. O quiz será criado mas não atribuído.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">Tipo/Tema do Quiz:</h4>
                <p className="mt-1 text-muted-foreground">
                  Você pode digitar qualquer tema para o quiz. Exemplos:
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Ansiedade</li>
                  <li>• Depressão</li>
                  <li>• Sono</li>
                  <li>• Estresse no trabalho</li>
                  <li>• Relacionamentos familiares</li>
                  <li>• Autoestima</li>
                  <li>• Qualquer outro tema relevante</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Boas Práticas:</h4>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Use perguntas claras e objetivas</li>
                  <li>• Mantenha entre 5-15 perguntas</li>
                  <li>• Teste antes de publicar</li>
                  <li>• Salve como rascunho primeiro</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Gerar Quiz com IA */}
      <Dialog open={showAIGenerateModal} onOpenChange={setShowAIGenerateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Criar Quiz com IA
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-topic">Tema/Nicho *</Label>
              <Input
                id="ai-topic"
                value={aiGenerateTopic}
                onChange={(e) => setAiGenerateTopic(e.target.value)}
                placeholder="Ex: Ansiedade, Depressão, Sono, Estresse, Relacionamentos, Autoestima..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Descreva o tema do quiz. A IA gerará título, descrição, duração e perguntas baseadas neste tema.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-question-count">Quantidade de Perguntas *</Label>
              <Input
                id="ai-question-count"
                type="number"
                min="3"
                max="20"
                value={aiGenerateQuestionCount}
                onChange={(e) => setAiGenerateQuestionCount(parseInt(e.target.value) || 5)}
              />
              <p className="text-xs text-muted-foreground">
                Entre 3 e 20 perguntas. A IA criará uma mistura de tipos (múltipla escolha, escala, texto)
              </p>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                A IA gerará automaticamente: título, descrição, duração estimada e todas as perguntas. 
                Você poderá revisar e editar antes de salvar. Não será salvo automaticamente.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAIGenerateModal(false)
                  setAiGenerateTopic('')
                  setAiGenerateQuestionCount(5)
                }}
                disabled={isGeneratingQuiz}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateQuizWithAI}
                disabled={isGeneratingQuiz || !aiGenerateTopic?.trim()}
                className="gap-2"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Quiz
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
