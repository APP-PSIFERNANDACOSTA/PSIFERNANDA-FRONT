"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, FileText, Clock, Tag, Shield, Database, Eye, X } from "lucide-react"
import type { DiaryEntry } from "@/types/diary"
import { MOOD_OPTIONS } from "@/types/diary"

interface PsychologistDiaryModalProps {
  entry: DiaryEntry | null
  isOpen: boolean
  onClose: () => void
}

export function PsychologistDiaryModal({ entry, isOpen, onClose }: PsychologistDiaryModalProps) {
  if (!entry) return null

  const moodOption = MOOD_OPTIONS.find(mood => mood.value === entry.mood)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="border-b pb-4 px-6 pt-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold text-gray-900 break-words">
                  Análise Clínica - {entry.patient?.name || "Paciente"}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    {formatDate(entry.date)}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <User className="h-4 w-4 flex-shrink-0" />
                    ID: #{entry.patient_id}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge 
                variant="default" 
                className={`${moodOption?.bgColor} ${moodOption?.color} font-medium border-0 whitespace-nowrap`}
              >
                {moodOption?.label}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6 px-6 overflow-y-auto flex-1">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Entry Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Entry Content */}
              <Card className="border-l-4 border-l-pink-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-pink-600" />
                    {entry.title || "Entrada do Diário"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                      {entry.content}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags Analysis */}
              {entry.tags && entry.tags.length > 0 && (
                <Card className="bg-pink-50 border-pink-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-pink-700 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-pink-600" />
                      Análise Automática de Sentimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs bg-white text-pink-700 border-pink-300 hover:bg-pink-100"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-pink-600 mt-3 italic">
                      Tags geradas automaticamente pela IA baseadas no conteúdo emocional
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Clinical Data */}
            <div className="space-y-6">
              {/* Patient Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Dados do Paciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-blue-600 whitespace-nowrap">Nome:</span>
                    <span className="font-medium text-blue-800 text-right break-words">{entry.patient?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-blue-600 whitespace-nowrap">ID:</span>
                    <span className="font-medium text-blue-800">#{entry.patient_id}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-blue-600 whitespace-nowrap">Usuário:</span>
                    <span className="font-medium text-blue-800">#{entry.user_id}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Entry Metadata */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    Metadados da Entrada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 whitespace-nowrap">ID:</span>
                    <span className="font-medium text-gray-800">#{entry.id}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 whitespace-nowrap">Criado:</span>
                    <span className="font-medium text-gray-800 text-xs text-right">
                      {new Date(entry.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {entry.updated_at !== entry.created_at && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600 whitespace-nowrap">Editado:</span>
                      <span className="font-medium text-gray-800 text-xs text-right">
                        {new Date(entry.updated_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600 whitespace-nowrap">Privacidade:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs flex-shrink-0 ${
                        entry.is_private 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {entry.is_private ? "Privado" : "Público"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Mood Analysis */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-yellow-600" />
                    Análise de Humor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-yellow-600 whitespace-nowrap">Estado:</span>
                    <Badge 
                      variant="default" 
                      className={`${moodOption?.bgColor} ${moodOption?.color} font-medium border-0 text-xs flex-shrink-0`}
                    >
                      {moodOption?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-yellow-600 whitespace-nowrap">Data:</span>
                    <span className="font-medium text-yellow-800 text-xs text-right">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer with Timestamps */}
          <div className="border-t pt-4 mt-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  Registrado em: {new Date(entry.created_at).toLocaleString("pt-BR")}
                </span>
                {entry.updated_at !== entry.created_at && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    Atualizado em: {new Date(entry.updated_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              <div className="text-gray-400 whitespace-nowrap">
                ID da Entrada: #{entry.id}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}