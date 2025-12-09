"use client"

// Forçar revalidação dinâmica - sem cache
export const dynamic = 'force-dynamic'

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DiaryEntryCard } from "@/components/diary-entry-card"
import { DiaryFilter } from "@/components/diary-filter"
import { BookOpen, Loader2, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { DiaryEntry, DiaryFilters } from "@/types/diary"
import diaryService from "@/services/diary-service"
import patientService from "@/services/patient-service"
import type { Patient } from "@/types/patient"
import { showErrorToast } from "@/lib/toast-helpers"

export default function DiaryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<DiaryFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)

  useEffect(() => {
    loadPatients()
    loadEntries()
  }, [])

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll({ status: "active" })
      setPatients(response.patients.data)
    } catch (error: any) {
      console.error("Erro ao carregar pacientes:", error)
    }
  }

  const loadEntries = async (searchFilters?: DiaryFilters) => {
    setIsLoading(true)
    try {
      const activeFilters = searchFilters || filters
      const response = await diaryService.getAllEntries(activeFilters)
      setEntries(response.entries.data)
      setCurrentPage(response.entries.current_page)
      setTotalPages(response.entries.last_page)
      setTotalEntries(response.entries.total)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar diários",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  const handleFiltersChange = (newFilters: DiaryFilters) => {
    setFilters(newFilters)
  }

  const handleSearch = () => {
    setIsSearching(true)
    setCurrentPage(1)
    loadEntries({ ...filters, page: 1 })
  }

  const handleViewEntry = (entry: DiaryEntry) => {
    router.push(`/dashboard/diary/${entry.id}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diários</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie os diários emocionais dos seus pacientes
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-pink-600">{totalEntries}</div>
                  <div className="text-sm font-medium text-pink-600 mt-1">Total de Entradas</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diários registrados
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">{patients.length}</div>
                  <div className="text-sm font-medium text-blue-600 mt-1">Pacientes Ativos</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Com diários disponíveis
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-purple-600">{entries.length}</div>
                  <div className="text-sm font-medium text-purple-600 mt-1">Exibindo</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entradas nesta página
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <DiaryFilter
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          isLoading={isSearching}
          patients={patients}
          showPatientFilter={true}
          showDateFilters={true}
          showMoodFilter={true}
          showSearchFilter={true}
          title="Filtros de Diários"
        />

        {/* Entries List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
              <span className="text-muted-foreground">Carregando diários...</span>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum diário encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {Object.keys(filters).length > 0
                  ? "Tente ajustar os filtros para encontrar mais resultados"
                  : "Ainda não há diários registrados pelos pacientes"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <DiaryEntryCard
                key={entry.id}
                entry={entry}
                onView={handleViewEntry}
                showPatientName={true}
                readonly={true}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} ({totalEntries} entradas)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const newPage = Math.max(1, currentPage - 1)
                      setCurrentPage(newPage)
                      setIsLoading(true)
                      try {
                        const response = await diaryService.getAllEntries({ 
                          ...filters,
                          page: newPage
                        })
                        setEntries(response.entries.data)
                        setCurrentPage(response.entries.current_page)
                        setTotalPages(response.entries.last_page)
                        setTotalEntries(response.entries.total)
                      } catch (error: any) {
                        showErrorToast(
                          "Erro ao carregar diários",
                          error.response?.data?.message || "Tente novamente mais tarde"
                        )
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const newPage = Math.min(totalPages, currentPage + 1)
                      setCurrentPage(newPage)
                      setIsLoading(true)
                      try {
                        const response = await diaryService.getAllEntries({ 
                          ...filters,
                          page: newPage
                        })
                        setEntries(response.entries.data)
                        setCurrentPage(response.entries.current_page)
                        setTotalPages(response.entries.last_page)
                        setTotalEntries(response.entries.total)
                      } catch (error: any) {
                        showErrorToast(
                          "Erro ao carregar diários",
                          error.response?.data?.message || "Tente novamente mais tarde"
                        )
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

