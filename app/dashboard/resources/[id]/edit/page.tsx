"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
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
  User,
  ArrowLeft
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import resourceService from "@/services/resource-service"
import patientService from "@/services/patient-service"
import type { Resource, UpdateResourceData } from "@/types/resource"
import { RESOURCE_CATEGORIES, SHARING_TYPES } from "@/types/resource"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

export default function EditResourcePage() {
  const router = useRouter()
  const params = useParams()
  const resourceId = parseInt(params.id as string)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingResource, setIsLoadingResource] = useState(true)
  const [resource, setResource] = useState<Resource | null>(null)
  const [formData, setFormData] = useState<UpdateResourceData>({
    cover_image: undefined,
    remove_cover: false,
    title: "",
    description: "",
    category: "outros",
    tags: [],
    sharing_type: "public",
    patient_ids: []
  })
  const [tagInput, setTagInput] = useState("")
  const [patients, setPatients] = useState<Array<{ id: number; name: string }>>([])
  const [sharedPatients, setSharedPatients] = useState<Array<{ id: number; name: string; email: string }>>([])

  const loadResource = async () => {
    setIsLoadingResource(true)
    try {
      const resourceData = await resourceService.getById(resourceId)
      setResource(resourceData)
      
      // Carregar pacientes compartilhados se for seletivo
      let patientIds: number[] = []
      if (resourceData.sharing_type === 'selective') {
        try {
          const shared = await resourceService.getSharedPatients(resourceId)
          setSharedPatients(shared)
          patientIds = shared.map(p => p.id)
        } catch (error) {
          console.error('Erro ao carregar pacientes compartilhados:', error)
        }
      }
      
      // Atualizar formData com todos os dados de uma vez
      setFormData({
        cover_image: undefined,
        remove_cover: false,
        title: resourceData.title || "",
        description: resourceData.description || "",
        category: resourceData.category || "outros",
        tags: Array.isArray(resourceData.tags) ? resourceData.tags : [],
        sharing_type: resourceData.sharing_type || "public",
        patient_ids: patientIds
      })
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar recurso",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      router.push("/dashboard/resources")
    } finally {
      setIsLoadingResource(false)
    }
  }

  useEffect(() => {
    if (resourceId) {
      loadResource()
      loadPatients()
    }
  }, [resourceId])

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll({ status: 'active' })
      const patientsData = response.patients?.data || []
      setPatients(patientsData.map(p => ({ id: p.id, name: p.name })))
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setPatients([])
    }
  }

  const handleCoverSelect = (file: File) => {
    setFormData(prev => ({ 
      ...prev, 
      cover_image: file,
      remove_cover: false 
    }))
  }

  const handleRemoveCover = () => {
    setFormData(prev => ({ 
      ...prev, 
      cover_image: undefined,
      remove_cover: true 
    }))
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
    
    // Validação no frontend
    if (!formData.title || !formData.title.trim()) {
      showErrorToast("Erro", "Título é obrigatório")
      return
    }

    if (formData.sharing_type === 'selective' && (!formData.patient_ids || formData.patient_ids.length === 0)) {
      showErrorToast("Erro", "Selecione pelo menos um paciente para compartilhamento seletivo")
      return
    }

    setIsLoading(true)
    try {
      // Garantir que todos os campos obrigatórios estão presentes
      const dataToSend: UpdateResourceData = {
        title: formData.title.trim(),
        description: formData.description || "",
        category: formData.category || "outros",
        tags: formData.tags || [],
        sharing_type: formData.sharing_type || "public",
        patient_ids: formData.sharing_type === 'selective' ? (formData.patient_ids || []) : undefined,
        cover_image: formData.cover_image,
        remove_cover: formData.remove_cover
      }

      await resourceService.update(resourceId, dataToSend)
      showSuccessToast("Recurso atualizado", "O recurso foi atualizado com sucesso")
      router.push("/dashboard/resources")
    } catch (error: any) {
      console.error('Erro ao atualizar recurso:', error)
      const errorMessage = error.response?.data?.message || error.message || "Tente novamente mais tarde"
      const errors = error.response?.data?.errors
      
      if (errors) {
        // Se houver erros de validação, mostrar todos
        const errorList = Object.values(errors).flat().join(', ')
        showErrorToast("Erro ao atualizar recurso", errorList)
      } else {
        showErrorToast("Erro ao atualizar recurso", errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/resources")
  }

  if (isLoadingResource) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Recurso não encontrado</p>
        <Link href="/dashboard/resources">
          <Button className="mt-4">Voltar para Recursos</Button>
        </Link>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/resources">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Recurso</h1>
            <p className="mt-2 text-muted-foreground">Atualize as informações do recurso</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current File Info */}
        <Card>
          <CardHeader>
            <CardTitle>Arquivo Atual</CardTitle>
            <CardDescription>Informações do arquivo principal (não pode ser alterado)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <span className="text-sm text-gray-700 font-medium">{resource.title}</span>
                <div className="text-xs text-gray-500">
                  {resource.formatted_file_size} • {resource.file_type.toUpperCase()}
                </div>
              </div>
              <Badge variant="outline">
                {resource.file_type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Para alterar o arquivo principal, delete este recurso e crie um novo.
            </p>
          </CardContent>
        </Card>

        {/* Cover Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Capa</CardTitle>
            <CardDescription>Atualize a capa do recurso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Cover */}
              {resource.cover_url && !formData.remove_cover && !formData.cover_image && (
                <div className="space-y-3">
                  <Label>Capa Atual</Label>
                  <div className="relative inline-block">
                    <img
                      src={resource.cover_url}
                      alt="Capa atual"
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
                </div>
              )}

              {/* New Cover Upload */}
              {(!resource.cover_url || formData.remove_cover || formData.cover_image) && (
                <div className="space-y-3">
                  <Label>Nova Capa</Label>
                  {formData.cover_image ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={URL.createObjectURL(formData.cover_image)}
                          alt="Preview da nova capa"
                          className="h-32 w-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            cover_image: undefined,
                            remove_cover: false 
                          }))}
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
                        Clique para adicionar nova capa
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
              )}

              {/* Remove Cover Option */}
              {resource.cover_url && !formData.remove_cover && !formData.cover_image && (
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCover}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover Capa
                  </Button>
                </div>
              )}
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
                
                {/* Currently Shared Patients */}
                {sharedPatients.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-xs font-medium text-muted-foreground">Atualmente compartilhado com:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {sharedPatients.map(patient => (
                        <Badge key={patient.id} variant="outline" className="gap-1">
                          {patient.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              patient_ids: prev.patient_ids.filter(id => id !== patient.id)
                            }))}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Patients */}
                <div className="space-y-2">
                  {patients.map(patient => (
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
                  {patients.length === 0 && (
                    <p className="text-sm text-muted-foreground">
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
          <Button type="submit" disabled={isLoading || !formData.title.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </form>
      </div>
    </DashboardLayout>
  )
}


