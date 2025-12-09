"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Download, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video, 
  Presentation, 
  Image as ImageIcon, 
  File,
  Plus,
  Edit,
  Trash2,
  Loader2,
  PlayCircle,
  BookOpen
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import resourceService from "@/services/resource-service"
import type { Resource, ResourceNote } from "@/types/resource"
import { RESOURCE_CATEGORIES } from "@/types/resource"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

const fileIcons = {
  pdf: FileText,
  video: Video,
  ppt: Presentation,
  doc: FileText,
  image: ImageIcon,
  other: File
}

export default function ViewResourcePage() {
  const params = useParams()
  const router = useRouter()
  const resourceId = parseInt(params.id as string)
  
  const [resource, setResource] = useState<Resource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<ResourceNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  const loadResource = async () => {
    setIsLoading(true)
    try {
      const resourceData = await resourceService.getResourceById(resourceId)
      setResource(resourceData)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar recurso",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      router.push("/portal/resources")
    } finally {
      setIsLoading(false)
    }
  }

  const loadNotes = async () => {
    try {
      const notesData = await resourceService.getNotes(resourceId)
      setNotes(notesData)
    } catch (error) {
      console.error('Erro ao carregar anotações:', error)
    }
  }

  useEffect(() => {
    if (resourceId) {
      loadResource()
      loadNotes()
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

  const handleMarkCompleted = async () => {
    if (!resource) return
    
    try {
      await resourceService.markAsCompleted(resource.id)
      showSuccessToast("Recurso concluído", "Marcado como concluído com sucesso")
      loadResource() // Reload to update progress
    } catch (error: any) {
      showErrorToast(
        "Erro ao marcar como concluído",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsAddingNote(true)
    try {
      await resourceService.createNote(resourceId, {
        note_text: newNote
      })
      showSuccessToast("Anotação adicionada", "Sua anotação foi salva")
      setNewNote("")
      loadNotes()
    } catch (error: any) {
      showErrorToast(
        "Erro ao adicionar anotação",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      await resourceService.deleteNote(resourceId, noteId)
      showSuccessToast("Anotação removida", "Sua anotação foi deletada")
      loadNotes()
    } catch (error: any) {
      showErrorToast(
        "Erro ao deletar anotação",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const getEmbedUrl = (url: string) => {
    // YouTube URL handling
    if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop()?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }
    
    // Vimeo URL handling
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop()
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`
      }
    }
    
    // Return original URL if not a known platform
    return url
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Recurso não encontrado</p>
        <Button className="mt-4" onClick={() => router.push("/portal/resources")}>
          Voltar para Recursos
        </Button>
      </div>
    )
  }

  const isCompleted = resource.progress?.is_completed || false

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{resource.title}</h1>
          <p className="mt-2 text-muted-foreground">{resource.description}</p>
        </div>
        {isCompleted && (
          <Badge className="bg-green-500">
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluído
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
            </CardHeader>
            <CardContent>
              {/* PDF Viewer */}
              {resource.file_type === 'pdf' && resource.file_url ? (
                <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                  <iframe
                    src={resource.file_url}
                    className="w-full h-full"
                    title={resource.title}
                  />
                </div>
              ) : resource.file_type === 'video' && resource.video_url ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={getEmbedUrl(resource.video_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={resource.title}
                  />
                </div>
              ) : resource.file_type === 'video' && resource.file_url ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={resource.file_url}
                    controls
                    className="w-full h-full"
                  />
                </div>
              ) : resource.file_type === 'image' && resource.file_url ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={resource.file_url}
                    alt={resource.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  {resource.cover_url ? (
                    <img
                      src={resource.cover_url}
                      alt={resource.title}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">{resource.title}</p>
                      <p className="text-sm text-gray-500">{getResourceTypeLabel(resource.file_type)}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                {resource.file_url && !resource.video_url && (
                  <Button variant="outline" className="flex-1" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                )}
                {!isCompleted && (
                  <Button variant="default" onClick={handleMarkCompleted}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Concluído
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Minhas Anotações</CardTitle>
              <CardDescription>Adicione suas próprias anotações sobre este recurso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva suas anotações aqui..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAddNote} 
                    disabled={!newNote.trim() || isAddingNote}
                  >
                    {isAddingNote ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Anotação
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma anotação ainda. Adicione sua primeira anotação!
                  </p>
                ) : (
                  notes.map((note) => (
                    <Card key={note.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <p className="text-sm flex-1">{note.note_text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resource Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                <p className="text-sm">{getCategoryLabel(resource.category)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                <p className="text-sm">{getResourceTypeLabel(resource.file_type)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tamanho</Label>
                <p className="text-sm">{resource.formatted_file_size}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Adicionado em</Label>
                <p className="text-sm">
                  {new Date(resource.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {resource.progress && (
            <Card>
              <CardHeader>
                <CardTitle>Seu Progresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{resource.progress.formatted_progress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${resource.progress.progress_percentage}%` }}
                    />
                  </div>
                </div>
                {resource.progress.last_accessed_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Último acesso: {new Date(resource.progress.last_accessed_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
