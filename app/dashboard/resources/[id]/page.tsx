"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft,
  Edit, 
  Share2, 
  Download, 
  Eye, 
  Users, 
  User, 
  FileText, 
  Video, 
  Presentation, 
  Image, 
  File,
  Loader2,
  Plus,
  X,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import resourceService from "@/services/resource-service"
import type { Resource } from "@/types/resource"
import { RESOURCE_CATEGORIES, SHARING_TYPES } from "@/types/resource"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

const fileIcons = {
  pdf: FileText,
  video: Video,
  ppt: Presentation,
  doc: FileText,
  image: Image,
  other: File
}

export default function ResourceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const resourceId = parseInt(params.id as string)
  
  const [resource, setResource] = useState<Resource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sharedPatients, setSharedPatients] = useState<Array<{ id: number; name: string; email: string }>>([])
  const [isLoadingShared, setIsLoadingShared] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [availablePatients, setAvailablePatients] = useState<Array<{ id: number; name: string }>>([])
  const [selectedPatients, setSelectedPatients] = useState<number[]>([])

  const loadResource = async () => {
    setIsLoading(true)
    try {
      const resourceData = await resourceService.getById(resourceId)
      setResource(resourceData)
      
      // Carregar pacientes compartilhados se for seletivo
      if (resourceData.sharing_type === 'selective') {
        setIsLoadingShared(true)
        try {
          const shared = await resourceService.getSharedPatients(resourceId)
          setSharedPatients(shared)
        } catch (error) {
          console.error('Erro ao carregar pacientes compartilhados:', error)
        } finally {
          setIsLoadingShared(false)
        }
      }
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar recurso",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      router.push("/dashboard/resources")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (resourceId) {
      loadResource()
    }
  }, [resourceId])

  const handleDownload = async () => {
    if (!resource) return
    
    try {
      const downloadData = await resourceService.downloadResource(resource.id)
      const link = document.createElement('a')
      link.href = downloadData.download_url
      link.download = downloadData.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showSuccessToast("Download iniciado", "O arquivo está sendo baixado")
    } catch (error: any) {
      showErrorToast(
        "Erro ao baixar arquivo",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const handleShareWithPatients = async () => {
    if (selectedPatients.length === 0) {
      showErrorToast("Erro", "Selecione pelo menos um paciente")
      return
    }

    try {
      await resourceService.shareWithPatients(resourceId, selectedPatients)
      showSuccessToast("Recurso compartilhado", "O recurso foi compartilhado com os pacientes selecionados")
      setShowShareModal(false)
      setSelectedPatients([])
      loadResource() // Reload to update shared patients
    } catch (error: any) {
      showErrorToast(
        "Erro ao compartilhar recurso",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const handleUnshareFromPatient = async (patientId: number) => {
    try {
      await resourceService.unshareFromPatient(resourceId, patientId)
      showSuccessToast("Compartilhamento removido", "O paciente não terá mais acesso ao recurso")
      loadResource() // Reload to update shared patients
    } catch (error: any) {
      showErrorToast(
        "Erro ao remover compartilhamento",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const getFileIcon = (type: string) => {
    const Icon = fileIcons[type as keyof typeof fileIcons] || File
    return <Icon className="h-6 w-6" />
  }

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case "pdf":
        return "PDF"
      case "video":
        return "Vídeo"
      case "ppt":
        return "Apresentação"
      case "doc":
        return "Documento"
      case "image":
        return "Imagem"
      default:
        return "Arquivo"
    }
  }

  const getCategoryLabel = (category: string) => {
    const cat = RESOURCE_CATEGORIES.find(c => c.value === category)
    return cat?.label || category
  }

  const getSharingBadge = (sharingType: string) => {
    const sharing = SHARING_TYPES.find(s => s.value === sharingType)
    return (
      <Badge variant={sharingType === 'public' ? 'default' : 'secondary'}>
        {sharing?.label}
      </Badge>
    )
  }

  if (isLoading) {
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
      <div className="max-w-6xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold text-foreground">{resource.title}</h1>
            <p className="mt-2 text-muted-foreground">Detalhes e compartilhamento do recurso</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/resources/${resource.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
              <CardDescription>Preview do recurso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {resource.cover_url ? (
                  <img
                    src={resource.cover_url}
                    alt={resource.title}
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {getFileIcon(resource.file_type)}
                    </div>
                    <p className="text-lg font-medium text-gray-600">{resource.title}</p>
                    <p className="text-sm text-gray-500">{getResourceTypeLabel(resource.file_type)}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Completo
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resource Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Recurso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Título</Label>
                  <p className="text-sm">{resource.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                  <p className="text-sm">{getCategoryLabel(resource.category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Arquivo</Label>
                  <p className="text-sm">{getResourceTypeLabel(resource.file_type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tamanho</Label>
                  <p className="text-sm">{resource.formatted_file_size}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                  <p className="text-sm">{new Date(resource.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Atualizado em</Label>
                  <p className="text-sm">{new Date(resource.updated_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {resource.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                  <p className="text-sm mt-1">{resource.description}</p>
                </div>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sharing Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Compartilhamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tipo</span>
                {getSharingBadge(resource.sharing_type)}
              </div>

              {resource.sharing_type === 'public' ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Todos os pacientes têm acesso</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pacientes com acesso</span>
                    <Button
                      size="sm"
                      onClick={() => setShowShareModal(true)}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {isLoadingShared ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : sharedPatients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum paciente selecionado</p>
                  ) : (
                    <div className="space-y-2">
                      {sharedPatients.map(patient => (
                        <div key={patient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnshareFromPatient(patient.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Visualizações</span>
                  <span className="text-sm font-medium">{resource.progress_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Anotações</span>
                  <span className="text-sm font-medium">{resource.notes_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Concluídos</span>
                  <span className="text-sm font-medium">{resource.completed_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Compartilhar com Pacientes</CardTitle>
              <CardDescription>Selecione os pacientes que terão acesso a este recurso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availablePatients.map(patient => (
                  <div key={patient.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`share-patient-${patient.id}`}
                      checked={selectedPatients.includes(patient.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPatients(prev => [...prev, patient.id])
                        } else {
                          setSelectedPatients(prev => prev.filter(id => id !== patient.id))
                        }
                      }}
                    />
                    <Label htmlFor={`share-patient-${patient.id}`} className="cursor-pointer">
                      {patient.name}
                    </Label>
                  </div>
                ))}
                {availablePatients.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum paciente disponível</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowShareModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleShareWithPatients} disabled={selectedPatients.length === 0}>
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}


