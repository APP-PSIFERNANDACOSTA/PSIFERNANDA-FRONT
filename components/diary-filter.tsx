"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, Search, Users } from "lucide-react"
import type { DiaryFilters, MoodType } from "@/types/diary"
import { MOOD_OPTIONS } from "@/types/diary"
import type { Patient } from "@/types/patient"

interface DiaryFilterProps {
  onFiltersChange: (filters: DiaryFilters) => void
  onSearch: () => void
  isLoading?: boolean
  patients?: Patient[]
  showPatientFilter?: boolean
  showDateFilters?: boolean
  showMoodFilter?: boolean
  showSearchFilter?: boolean
  title?: string
  className?: string
}

export function DiaryFilter({
  onFiltersChange,
  onSearch,
  isLoading = false,
  patients = [],
  showPatientFilter = false,
  showDateFilters = true,
  showMoodFilter = true,
  showSearchFilter = false,
  title = "Filtros",
  className = ""
}: DiaryFilterProps) {
  const [filters, setFilters] = useState<DiaryFilters>({
    date_from: "",
    date_to: "",
    mood: undefined,
    patient_id: undefined,
    search: "",
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
      date_from: "",
      date_to: "",
      mood: undefined,
      patient_id: undefined,
      search: "",
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onSearch()
  }

  // Determinar quantas colunas usar baseado nos filtros ativos
  const activeFilters = [
    showDateFilters,
    showDateFilters,
    showMoodFilter,
    showPatientFilter,
    showSearchFilter
  ].filter(Boolean).length

  const gridCols = activeFilters <= 2 ? "md:grid-cols-2" : 
                   activeFilters <= 3 ? "md:grid-cols-3" : 
                   activeFilters <= 4 ? "md:grid-cols-4" : "md:grid-cols-5"

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-pink-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className={`grid grid-cols-1 ${gridCols} gap-4 items-end`}>
        {/* Data Inicial */}
        {showDateFilters && (
          <div className="space-y-2">
            <Label htmlFor="date_from" className="text-sm font-medium text-gray-700">
              Data Inicial
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="date_from"
                type="date"
                value={filters.date_from || ""}
                onChange={(e) => handleFilterChange("date_from", e.target.value || undefined)}
                className="pl-10 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                placeholder="Data inicial"
              />
            </div>
          </div>
        )}

        {/* Data Final */}
        {showDateFilters && (
          <div className="space-y-2">
            <Label htmlFor="date_to" className="text-sm font-medium text-gray-700">
              Data Final
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="date_to"
                type="date"
                value={filters.date_to || ""}
                onChange={(e) => handleFilterChange("date_to", e.target.value || undefined)}
                className="pl-10 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                placeholder="Data final"
              />
            </div>
          </div>
        )}

        {/* Humor */}
        {showMoodFilter && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Humor
            </Label>
            <Select 
              value={filters.mood || "all"} 
              onValueChange={(value) => handleFilterChange("mood", value === "all" ? undefined : value as MoodType)}
            >
              <SelectTrigger className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500">
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

        {/* Paciente */}
        {showPatientFilter && patients.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Paciente
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select 
                value={filters.patient_id?.toString() || "all"} 
                onValueChange={(value) => handleFilterChange("patient_id", value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger className="pl-10 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500">
                  <SelectValue placeholder="Todos os pacientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Busca por texto */}
        {showSearchFilter && (
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value || undefined)}
                className="pl-10 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                placeholder="Buscar no conteúdo..."
              />
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-pink-600 hover:bg-pink-700 text-white border-0 flex-1"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
          <Button 
            onClick={clearFilters}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Limpar
          </Button>
        </div>
      </div>
    </Card>
  )
}