"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Heart, Plus, CalendarIcon, TrendingUp, Sparkles, Loader2, Edit, Trash2 } from "lucide-react"
import { MoodSelector } from "@/components/mood-selector"
import { DiaryEntryCard } from "@/components/diary-entry-card"
import { NotebookModal } from "@/components/notebook-modal"
import diaryService from "@/services/diary-service"
import type { DiaryEntry, MoodType, CreateDiaryEntryData } from "@/types/diary"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

export default function DiarioPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [selectedMood, setSelectedMood] = useState<MoodType | "">("")
  const [entryContent, setEntryContent] = useState("")
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFilteredByDate, setIsFilteredByDate] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [showNotebookModal, setShowNotebookModal] = useState(false)

  const loadEntries = async () => {
    setIsLoading(true)
    try {
      const response = await diaryService.getMyEntries()
      setEntries(response.entries.data)
      // Por padrão, mostrar apenas os últimos 5 diários
      setFilteredEntries(response.entries.data.slice(0, 5))
      setIsFilteredByDate(false)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar entradas",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const filterEntriesByDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const entriesForDate = entries.filter(entry => entry.date.startsWith(dateString))
    setFilteredEntries(entriesForDate)
    setIsFilteredByDate(true)
  }

  const showAllEntries = () => {
    setFilteredEntries(entries.slice(0, 5))
    setIsFilteredByDate(false)
  }

  const handleViewEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry)
    setShowNotebookModal(true)
  }

  const handleCloseNotebookModal = () => {
    setShowNotebookModal(false)
    setSelectedEntry(null)
  }

  useEffect(() => {
    loadEntries()
  }, [])

  const handleSaveEntry = async () => {
    if (!entryContent) return

    setIsSaving(true)
    try {
      const data: CreateDiaryEntryData = {
        content: entryContent,
      }

      await diaryService.create(data)
      showSuccessToast("Entrada criada", "Sua entrada foi salva com sucesso!")

      // Reset form
      setShowNewEntry(false)
      setEntryContent("")
      
      // Reload entries
      await loadEntries()
    } catch (error: any) {
      showErrorToast(
        "Erro ao salvar entrada",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsSaving(false)
    }
  }


  const handleCancel = () => {
    setShowNewEntry(false)
    setEntryContent("")
    setSelectedDate(new Date())
  }

  const getConsecutiveDays = () => {
    // Simple calculation - in real app, this would be more sophisticated
    return entries.length > 0 ? Math.min(entries.length, 30) : 0
  }

  if (showNewEntry) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Nova Entrada no Diário
            </h1>
            <p className="mt-2 text-muted-foreground">Registre suas emoções e pensamentos do dia</p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como foi seu dia?</CardTitle>
            <CardDescription>Escreva sobre seus sentimentos e experiências</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data</label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  A data será automaticamente definida como hoje
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Como foi seu dia?</label>
              <Textarea
                placeholder="Escreva sobre seus sentimentos, pensamentos e experiências do dia..."
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                O título será gerado automaticamente baseado no seu texto. Seja honesto consigo mesmo. Este é um espaço seguro para suas reflexões.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent" disabled={isSaving}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEntry} 
                disabled={!entryContent || isSaving} 
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Salvar Entrada
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diário Emocional</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe suas emoções e reflexões diárias</p>
        </div>
        <Button onClick={() => setShowNewEntry(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={(date) => {
                setSelectedDate(date)
                if (date) {
                  filterEntriesByDate(date)
                }
              }} 
              className="rounded-md border" 
            />
            <div className="mt-4 space-y-2 rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium text-foreground">Sequência atual</p>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{getConsecutiveDays()} dias consecutivos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries */}
        <div className="space-y-5 sm:space-y-4 lg:col-span-2">
          {/* Header com filtro ativo */}
          {isFilteredByDate && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Diário de {selectedDate?.toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-muted-foreground">
                      {filteredEntries.length} entrada(s) encontrada(s)
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={showAllEntries}>
                  Ver todos os diários
                </Button>
              </CardContent>
            </Card>
          )}

          {!isFilteredByDate && getConsecutiveDays() > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 p-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-foreground">Continue assim!</p>
                  <p className="text-muted-foreground">
                    Você está mantendo uma ótima consistência no seu diário emocional.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isFilteredByDate ? 'Nenhuma entrada nesta data' : 'Nenhuma entrada ainda'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isFilteredByDate 
                    ? 'Não há entradas de diário para esta data'
                    : 'Comece escrevendo sobre como você se sente hoje'
                  }
                </p>
                <Button onClick={() => setShowNewEntry(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isFilteredByDate ? 'Nova Entrada para esta data' : 'Primeira Entrada'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => (
              <DiaryEntryCard
                key={entry.id}
                entry={entry}
                readonly={true}
                onView={handleViewEntry}
              />
            ))
          )}
        </div>
      </div>

      {/* Notebook Modal */}
      <NotebookModal
        entry={selectedEntry}
        isOpen={showNotebookModal}
        onClose={handleCloseNotebookModal}
        showPatientName={false}
      />
    </div>
  )
}
