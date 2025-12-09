"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Video, 
  Headphones, 
  Download, 
  Star, 
  Search, 
  BookOpen, 
  Heart, 
  Brain, 
  Sparkles,
  Eye,
  Loader2,
  CheckCircle,
  Clock
} from "lucide-react"
import Link from "next/link"
import resourceService from "@/services/resource-service"
import type { Resource } from "@/types/resource"
import { RESOURCE_CATEGORIES } from "@/types/resource"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

const categories = [
  { id: "all", label: "Todos", icon: BookOpen },
  { id: "livros", label: "Livros", icon: BookOpen },
  { id: "apresentacoes", label: "Apresentações", icon: Sparkles },
  { id: "artigos", label: "Artigos", icon: FileText },
  { id: "exercicios", label: "Exercícios", icon: Brain },
  { id: "videos", label: "Vídeos", icon: Video },
  { id: "outros", label: "Outros", icon: Heart },
]

const fileIcons = {
  pdf: FileText,
  video: Video,
  ppt: Sparkles,
  doc: FileText,
  image: Heart,
  other: FileText
}

export default function RecursosPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<number[]>([])

  const loadResources = async () => {
    setIsLoading(true)
    try {
      const response = await resourceService.getMyResources({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined
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
  }, [selectedCategory, searchQuery])

  const toggleFavorite = (resourceId: number) => {
    setFavorites((prev) => (prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId]))
  }

  const handleDownload = async (resource: Resource) => {
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

  const handleMarkCompleted = async (resource: Resource) => {
    try {
      await resourceService.markAsCompleted(resource.id)
      showSuccessToast("Recurso concluído", "Marcado como concluído com sucesso")
      loadResources() // Reload to update progress
    } catch (error: any) {
      showErrorToast(
        "Erro ao marcar como concluído",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const filteredResources = resources.filter((resource) => {
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const getResourceIcon = (type: string) => {
    const Icon = fileIcons[type as keyof typeof fileIcons] || FileText
    return Icon
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Biblioteca de Recursos</h1>
        <p className="mt-2 text-muted-foreground">Materiais selecionados para apoiar sua jornada</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Favoritos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {resources
              .filter((r) => favorites.includes(r.id))
              .map((resource) => {
                const Icon = getResourceIcon(resource.file_type)
                return (
                  <Card key={resource.id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            {resource.cover_url ? (
                              <img
                                src={resource.cover_url}
                                alt={resource.title}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <Icon className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <CardDescription className="mt-1">{resource.description}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(resource.id)}
                          className="shrink-0"
                        >
                          <Star className="h-5 w-5 fill-primary text-primary" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{getResourceTypeLabel(resource.file_type)}</Badge>
                        <Badge variant="outline">{getCategoryLabel(resource.category)}</Badge>
                        <span className="text-sm text-muted-foreground">{resource.formatted_file_size}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 gap-2"
                          onClick={() => window.open(`/portal/resources/${resource.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => handleDownload(resource)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {selectedCategory === "all" ? "Todos os Recursos" : categories.find((c) => c.id === selectedCategory)?.label}
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredResources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="mt-4 text-lg font-medium text-foreground">Nenhum recurso encontrado</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente ajustar seus filtros ou buscar por outros termos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredResources.map((resource) => {
              const Icon = getResourceIcon(resource.file_type)
              const isFavorite = favorites.includes(resource.id)
              const isCompleted = resource.progress?.is_completed || false
              return (
                <Card 
                  key={resource.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => window.open(`/portal/resources/${resource.id}`, '_blank')}
                >
                  {/* Book Cover - Amazon/Kindle Style */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-background flex items-center justify-center relative overflow-hidden h-48">
                    {resource.cover_url ? (
                      <img
                        src={resource.cover_url}
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.error('Erro ao carregar capa:', resource.cover_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="mb-4">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {getResourceTypeLabel(resource.file_type)}
                        </p>
                      </div>
                    )}
                    
                    {/* Completion Badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    
                    {/* Favorite Badge */}
                    {isFavorite && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1">
                        <Star className="h-4 w-4 fill-white" />
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Recurso
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Title and Description */}
                    <div>
                      <CardTitle className="text-base line-clamp-2 leading-tight">
                        {resource.title}
                      </CardTitle>
                      {resource.description && (
                        <CardDescription className="mt-1 line-clamp-2 text-xs">
                          {resource.description}
                        </CardDescription>
                      )}
                    </div>

                    {/* Category and Size */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(resource.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {resource.formatted_file_size}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {resource.progress && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{resource.progress.formatted_progress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${resource.progress.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-1 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`/portal/resources/${resource.id}`, '_blank')
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(resource)
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      
                      {!isCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkCompleted(resource)
                          }}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
