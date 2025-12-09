"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Video, 
  Presentation, 
  Image, 
  File,
  Users,
  User,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import resourceService from "@/services/resource-service"
import type { Resource, ResourceFilters } from "@/types/resource"
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

export default function ResourcesPage() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<ResourceFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const loadResources = async () => {
    setIsLoading(true)
    try {
      const response = await resourceService.getAll({
        ...filters,
        search: searchQuery || undefined,
        page: 1
      })
      setResources(response.data)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar recursos",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [filters, searchQuery])

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Tem certeza que deseja deletar "${resource.title}"?`)) {
      return
    }

    try {
      await resourceService.delete(resource.id)
      showSuccessToast("Recurso deletado", "O recurso foi removido com sucesso")
      loadResources()
    } catch (error: any) {
      showErrorToast(
        "Erro ao deletar recurso",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const getFileIcon = (fileType: string) => {
    const Icon = fileIcons[fileType as keyof typeof fileIcons] || File
    return <Icon className="h-6 w-6" />
  }

  const getSharingBadge = (sharingType: string) => {
    const sharing = SHARING_TYPES.find(s => s.value === sharingType)
    return (
      <Badge variant={sharingType === 'public' ? 'default' : 'secondary'}>
        {sharing?.label}
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const cat = RESOURCE_CATEGORIES.find(c => c.value === category)
    return cat?.label || category
  }

  const getResourceTypeLabel = (fileType: string) => {
    switch (fileType) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Biblioteca de Recursos</h1>
            <p className="mt-2 text-muted-foreground">Gerencie seus recursos digitais e compartilhe com pacientes</p>
          </div>
          <Link href="/dashboard/resources/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recurso
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar recursos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Categoria</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={filters.category || ""}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                    >
                      <option value="">Todas as categorias</option>
                      {RESOURCE_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Compartilhamento</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={filters.sharing_type || ""}
                      onChange={(e) => setFilters(prev => ({ ...prev, sharing_type: e.target.value || undefined }))}
                    >
                      <option value="">Todos os tipos</option>
                      {SHARING_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setFilters({})}
                      className="w-full"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum recurso encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || Object.keys(filters).length > 0
                  ? "Tente ajustar seus filtros ou buscar por outros termos"
                  : "Comece criando seu primeiro recurso digital"
                }
              </p>
              <Link href="/dashboard/resources/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Recurso
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((resource) => {
              const FileIcon = fileIcons[resource.file_type as keyof typeof fileIcons] || File
              return (
                <Card 
                  key={resource.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-primary/20"
                >
                  {/* Image/Cover Section */}
                  <div 
                    className="aspect-[4/3] bg-gradient-to-br from-primary/5 via-primary/10 to-background flex items-center justify-center relative overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/dashboard/resources/${resource.id}`)}
                  >
                    {resource.cover_url ? (
                      <>
                        <img
                          src={resource.cover_url}
                          alt={resource.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-3 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <FileIcon className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {getResourceTypeLabel(resource.file_type)}
                        </p>
                      </div>
                    )}
                    
                    {/* Type Badge on Image */}
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant="secondary" 
                        className="bg-white/90 backdrop-blur-sm text-xs font-medium shadow-sm"
                      >
                        <FileIcon className="h-3 w-3 mr-1" />
                        {getResourceTypeLabel(resource.file_type)}
                      </Badge>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/resources/${resource.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Title and Description */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/resources/${resource.id}`)}
                    >
                      <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                        {resource.title}
                      </CardTitle>
                      {resource.description && (
                        <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                          {resource.description}
                        </CardDescription>
                      )}
                    </div>

                    {/* Category and Sharing */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium border-primary/20 text-primary"
                      >
                        {getCategoryLabel(resource.category)}
                      </Badge>
                      {resource.sharing_type === 'public' ? (
                        <Badge variant="default" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          Seletivo
                        </Badge>
                      )}
                    </div>

                    {/* Stats and Metadata */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="font-medium">{resource.progress_count || 0}</span>
                            <span className="hidden sm:inline">visualizações</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="font-medium">{resource.notes_count || 0}</span>
                            <span className="hidden sm:inline">notas</span>
                          </span>
                        </div>
                      </div>
                      {resource.formatted_file_size && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <File className="h-3 w-3" />
                          <span>{resource.formatted_file_size}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 text-xs font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/resources/${resource.id}`)
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Ver
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/resources/${resource.id}/edit`)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(resource)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


