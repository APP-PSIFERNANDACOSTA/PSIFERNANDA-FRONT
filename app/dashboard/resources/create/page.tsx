"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Loader2,
  Plus,
  Users,
  User
} from "lucide-react"
import { useRouter } from "next/navigation"
import resourceService from "@/services/resource-service"
import patientService from "@/services/patient-service"
import type { CreateResourceData } from "@/types/resource"
import { RESOURCE_CATEGORIES, SHARING_TYPES } from "@/types/resource"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

export default function CreateResourcePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateResourceData & { video_url?: string; resourceType?: 'file' | 'video' }>({
    file: undefined,
    video_url: "",
    resourceType: 'file',
    cover_image: undefined,
    title: "",
    description: "",
    category: "outros",
    tags: [],
    sharing_type: "public",
    patient_ids: []
  })
  const [tagInput, setTagInput] = useState("")
  const [patients, setPatients] = useState<Array<{ id: number; name: string }>>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Array<{ id: number; name: string }>>([])

  // Carregar pacientes ao montar o componente
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await patientService.getAll({ status: 'active' })
        
        // A estrutura correta é: { success: true, patients: { data: [...] } }
        const patientsData = response.patients?.data || []
        
        const patientsList = patientsData.map((patient: any) => ({
          id: patient.id,
          name: patient.name
        }))
        
        setPatients(patientsList)
        setFilteredPatients(patientsList)
      } catch (error) {
        console.error('Erro ao carregar pacientes:', error)
      }
    }
    
    loadPatients()
  }, [])

  // Filtrar pacientes baseado na busca
  useEffect(() => {
    if (!patientSearch.trim()) {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(patientSearch.toLowerCase())
      )
      setFilteredPatients(filtered)
    }
  }, [patientSearch, patients])

  const handleFileSelect = (file: File) => {
    setFormData(prev => ({ ...prev, file }))
  }

  const handleCoverSelect = (file: File) => {
    setFormData(prev => ({ ...prev, cover_image: file }))
  }

  const handleRemoveCover = () => {
    setFormData(prev => ({ ...prev, cover_image: undefined }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que um arquivo OU uma URL de vídeo foi fornecida
    if (formData.resourceType === 'file' && !formData.file) {
      showErrorToast("Erro", "Selecione um arquivo")
      return
    }
    
    if (formData.resourceType === 'video' && !formData.video_url?.trim()) {
      showErrorToast("Erro", "Digite a URL do vídeo")
      return
    }

    if (!formData.title.trim()) {
      showErrorToast("Erro", "Título é obrigatório")
      return
    }

    // Garantir que patient_ids seja um array vazio se não houver seleção
    const submitData: any = {
      ...formData,
      patient_ids: formData.patient_ids || []
    }

    // Remover campos condicionais vazios
    if (formData.resourceType === 'file') {
      delete submitData.video_url
    } else if (formData.resourceType === 'video') {
      delete submitData.file
    }

    // Remover campos undefined, null ou strings vazias
    Object.keys(submitData).forEach(key => {
      const value = submitData[key]
      if (value === undefined || value === null || value === '') {
        delete submitData[key]
      }
    })

    if (formData.sharing_type === 'selective' && submitData.patient_ids.length === 0) {
      showErrorToast("Erro", "Selecione pelo menos um paciente para compartilhamento seletivo")
      return
    }

    // Remover patient_ids se for compartilhamento público
    if (formData.sharing_type === 'public') {
      delete submitData.patient_ids
    }
    
    // Remover resourceType antes de enviar
    delete submitData.resourceType

    setIsLoading(true)
    try {
      await resourceService.create(submitData)
      showSuccessToast("Recurso criado", "O recurso foi criado com sucesso")
      router.push("/dashboard/resources")
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null) ||
        "Tente novamente mais tarde"
      showErrorToast("Erro ao criar recurso", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/resources")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novo Recurso</h1>
            <p className="mt-2 text-muted-foreground">Adicione um novo recurso à sua biblioteca</p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resource Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Recurso</CardTitle>
              <CardDescription>Selecione como deseja adicionar o recurso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, resourceType: 'file', file: undefined, video_url: '' }))}
                  className={`p-6 border-2 rounded-lg text-center transition-all ${
                    formData.resourceType === 'file'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="font-medium">Upload de Arquivo</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, vídeos, docs, etc</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, resourceType: 'video', file: undefined, video_url: '' }))}
                  className={`p-6 border-2 rounded-lg text-center transition-all ${
                    formData.resourceType === 'video'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="font-medium">Link de Vídeo</p>
                  <p className="text-sm text-muted-foreground mt-1">YouTube, Vimeo, etc</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          {formData.resourceType === 'file' && (
            <Card>
              <CardHeader>
                <CardTitle>Arquivo Principal</CardTitle>
                <CardDescription>Selecione o arquivo que será compartilhado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      {formData.file ? formData.file.name : "Clique para selecionar arquivo"}
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, vídeos, apresentações, documentos, imagens (máx. 100MB)
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    accept=".pdf,.mp4,.avi,.mov,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  />
                  
                  {formData.file && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700">{formData.file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video URL */}
          {formData.resourceType === 'video' && (
            <Card>
              <CardHeader>
                <CardTitle>URL do Vídeo</CardTitle>
                <CardDescription>Cole o link do YouTube, Vimeo ou outro serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </CardContent>
            </Card>
          )}

          {/* Cover Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Capa (Opcional)</CardTitle>
              <CardDescription>Adicione uma capa personalizada para o recurso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.cover_image ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(formData.cover_image)}
                        alt="Preview da capa"
                        className="h-32 w-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveCover}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{formData.cover_image.name}</p>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('cover-input')?.click()}
                  >
                    <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Clique para adicionar capa
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, WEBP (máx. 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="cover-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCoverSelect(e.target.files[0])}
                  accept=".jpg,.jpeg,.png,.webp"
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados sobre o recurso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título do recurso"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o conteúdo do recurso"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  {RESOURCE_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Digite uma tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sharing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Compartilhamento</CardTitle>
              <CardDescription>Configure como o recurso será compartilhado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {SHARING_TYPES.map(type => (
                  <div key={type.value} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={type.value}
                      name="sharing_type"
                      value={type.value}
                      checked={formData.sharing_type === type.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, sharing_type: e.target.value as 'public' | 'selective' }))}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                        {type.value === 'public' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span className="font-medium">{type.label}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground ml-6">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {formData.sharing_type === 'selective' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Selecionar Pacientes</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Escolha quais pacientes terão acesso a este recurso
                  </p>
                  
                  {/* Campo de busca */}
                  <Input
                    placeholder="Buscar pacientes..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="mb-3"
                  />
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredPatients.map(patient => (
                      <div key={patient.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`patient-${patient.id}`}
                          checked={formData.patient_ids?.includes(patient.id) || false}
                          onChange={(e) => {
                            const isChecked = e.target.checked
                            setFormData(prev => ({
                              ...prev,
                              patient_ids: isChecked
                                ? [...(prev.patient_ids || []), patient.id]
                                : (prev.patient_ids || []).filter(id => id !== patient.id)
                            }))
                          }}
                        />
                        <Label htmlFor={`patient-${patient.id}`} className="cursor-pointer">
                          {patient.name}
                        </Label>
                      </div>
                    ))}
                    {filteredPatients.length === 0 && patients.length > 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum paciente encontrado com este termo de busca.
                      </p>
                    )}
                    {patients.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum paciente encontrado. Crie pacientes primeiro.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                !formData.title.trim() ||
                !formData.resourceType ||
                (formData.resourceType === 'file' && !formData.file) ||
                (formData.resourceType === 'video' && !formData.video_url?.trim())
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Recurso"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
