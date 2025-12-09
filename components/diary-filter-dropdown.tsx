"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react"
import type { DiaryFilters, MoodType } from "@/types/diary"
import { MOOD_OPTIONS } from "@/types/diary"
import type { Patient } from "@/types/patient"

interface DiaryFilterDropdownProps {
  onFiltersChange: (filters: DiaryFilters) => void
  onSearch: () => void
  isLoading?: boolean
  patients?: Patient[]
  showPatientFilter?: boolean
  showDateFilters?: boolean
  showMoodFilter?: boolean
  showSearchFilter?: boolean
  title?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DiaryFilterDropdown({
  onFiltersChange,
  onSearch,
  isLoading = false,
  patients = [],
  showPatientFilter = true,
  showDateFilters = true,
  showMoodFilter = true,
  showSearchFilter = true,
  title = "Filtros",
  isOpen = false,
  onOpenChange
}: DiaryFilterDropdownProps) {
  const [filters, setFilters] = useState<DiaryFilters>({
    patient_id: undefined,
    start_date: undefined,
    end_date: undefined,
    mood: undefined,
    search: undefined
  })

  const handleFilterChange = (key: keyof DiaryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleSearch = () => {
    onSearch()
  }

  const clearFilters = () => {
    const clearedFilters: DiaryFilters = {
      patient_id: undefined,
      start_date: undefined,
      end_date: undefined,
      mood: undefined,
      search: undefined
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onSearch()
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== "")

  return (
    <Card className="border-gray-200">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Filter className="h-5 w-5" />
                {title}
                {hasActiveFilters && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    Filtros ativos
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFilters()
                    }}
                    className="text-xs bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                  >
                    Limpar
                  </Button>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Filtros em linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro de Paciente */}
                {showPatientFilter && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Paciente</label>
                    <Select 
                      value={filters.patient_id?.toString() || "all"} 
                      onValueChange={(value) => handleFilterChange("patient_id", value === "all" ? undefined : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os pacientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os pacientes</SelectItem>
                        {Array.isArray(patients) && patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro de Humor */}
                {showMoodFilter && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Humor</label>
                    <Select 
                      value={filters.mood || "all"} 
                      onValueChange={(value) => handleFilterChange("mood", value === "all" ? undefined : value as MoodType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os humores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os humores</SelectItem>
                        {MOOD_OPTIONS.map((mood) => (
                          <SelectItem key={mood.value} value={mood.value}>
                            {mood.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtro de Data Inicial */}
                {showDateFilters && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Data Inicial</label>
                    <Input
                      type="date"
                      value={filters.start_date || ""}
                      onChange={(e) => handleFilterChange("start_date", e.target.value || undefined)}
                    />
                  </div>
                )}

                {/* Filtro de Data Final */}
                {showDateFilters && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Data Final</label>
                    <Input
                      type="date"
                      value={filters.end_date || ""}
                      onChange={(e) => handleFilterChange("end_date", e.target.value || undefined)}
                    />
                  </div>
                )}
              </div>

              {/* Filtro de Busca */}
              {showSearchFilter && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Buscar no conteúdo</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar por palavras-chave..."
                        value={filters.search || ""}
                        onChange={(e) => handleFilterChange("search", e.target.value || undefined)}
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      disabled={isLoading}
                      className="gap-2"
                      style={{ backgroundColor: 'var(--color-primaryDark-fixed)', color: 'white' }}
                    >
                      <Search className="h-4 w-4" />
                      Buscar
                    </Button>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                  {hasActiveFilters ? "Filtros aplicados" : "Nenhum filtro ativo"}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSearch}
                    disabled={isLoading}
                    style={{ backgroundColor: 'var(--color-primaryDark-fixed)', color: 'white' }}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
