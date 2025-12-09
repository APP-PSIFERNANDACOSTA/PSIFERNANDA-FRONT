"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Heart, User, X } from "lucide-react"
import type { DiaryEntry } from "@/types/diary"
import { MOOD_OPTIONS } from "@/types/diary"

interface NotebookModalProps {
  entry: DiaryEntry | null
  isOpen: boolean
  onClose: () => void
  showPatientName?: boolean
}

export function NotebookModal({ entry, isOpen, onClose, showPatientName = false }: NotebookModalProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
        {/* Notebook Design */}
        <div className="relative bg-white min-h-[600px]">
          {/* Spiral Binding */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-b from-pink-100 to-pink-200 flex flex-col items-center py-8 space-y-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-pink-500 opacity-40" />
            ))}
          </div>

          {/* Notebook Content */}
          <div className="ml-8 pr-6 py-6">
            {/* Header */}
            <DialogHeader className="pb-4 border-b border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-800">
                      {entry.title || "Entrada do Diário"}
                    </DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(entry.date)}
                      </span>
                      {showPatientName && entry.patient && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {entry.patient.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="default" 
                    className={`${moodOption?.bgColor} ${moodOption?.color} font-medium border-0`}
                  >
                    {moodOption?.label}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Notebook Lines Background */}
            <div className="relative mt-6">
              {/* Ruled Lines */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-6 border-b border-pink-200"
                    style={{ marginTop: `${i * 24}px` }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 px-4 py-6">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {entry.content}
                </div>
              </div>
            </div>

            {/* Tags Section */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-8 mx-4 px-6 py-6 bg-pink-50 rounded-lg border border-pink-200">
                <h4 className="text-sm font-semibold text-pink-500 mb-4 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Tags Automáticas
                </h4>
                <div className="flex flex-wrap gap-3">
                  {entry.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs bg-pink-50 text-pink-500 border-pink-200 hover:bg-pink-100 px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 mx-4 px-4 py-3 bg-pink-50 rounded-lg border border-pink-200">
              <div className="text-xs text-pink-500 flex justify-between">
                <span>Criado em: {new Date(entry.created_at).toLocaleString("pt-BR")}</span>
                {entry.updated_at !== entry.created_at && (
                  <span>Última edição: {new Date(entry.updated_at).toLocaleString("pt-BR")}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
