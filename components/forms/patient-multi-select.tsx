"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover as CalendarPopover,
  PopoverContent as CalendarPopoverContent,
  PopoverTrigger as CalendarPopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import patientService from "@/services/patient-service"
import { Patient } from "@/types/patient"

interface PatientMultiSelectProps {
  selectedPatientIds: number[]
  onSelectionChange: (patientIds: number[]) => void
  dueDate?: string
  onDueDateChange: (date?: string) => void
  notes?: string
  onNotesChange: (notes: string) => void
  disabled?: boolean
}

export function PatientMultiSelect({
  selectedPatientIds,
  onSelectionChange,
  dueDate,
  onDueDateChange,
  notes,
  onNotesChange,
  disabled = false,
}: PatientMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  // Atualizar estado "selectAll" quando selectedPatientIds mudar
  useEffect(() => {
    const patientsWithUserId = Array.isArray(patients) ? patients.filter(patient => patient.user_id) : []
    const allUserIds = patientsWithUserId.map(patient => patient.user_id!).filter(Boolean) as number[]
    if (selectedPatientIds.length === allUserIds.length && allUserIds.length > 0) {
      const allSelected = allUserIds.every(id => selectedPatientIds.includes(id))
      setSelectAll(allSelected)
    } else {
      setSelectAll(false)
    }
  }, [selectedPatientIds, patients])

  const loadPatients = async () => {
    try {
      setIsLoading(true)
      const response = await patientService.getAll({ status: 'active' })
      // A estrutura correta é: { success: true, patients: { data: [...] } }
      const patientsData = response.patients?.data || (Array.isArray(response.patients) ? response.patients : [])
      setPatients(patientsData)
    } catch (error) {
      console.error('Error loading patients:', error)
      setPatients([]) // Garantir que seja um array vazio em caso de erro
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar pacientes com user_id válido
  const patientsWithUserId = Array.isArray(patients) ? patients.filter(patient => patient.user_id) : []
  
  const selectedPatients = patientsWithUserId.filter(patient => 
    selectedPatientIds.includes(patient.user_id!)
  )

  const handleSelect = (userId: number) => {
    if (selectedPatientIds.includes(userId)) {
      onSelectionChange(selectedPatientIds.filter(id => id !== userId))
      if (selectAll && selectedPatientIds.length === patientsWithUserId.length) {
        setSelectAll(false)
      }
    } else {
      onSelectionChange([...selectedPatientIds, userId])
      // Se todos estão selecionados, marcar "Todos"
      const newSelection = [...selectedPatientIds, userId]
      if (newSelection.length === patientsWithUserId.length) {
        setSelectAll(true)
      }
    }
  }

  const handleRemove = (userId: number) => {
    onSelectionChange(selectedPatientIds.filter(id => id !== userId))
    setSelectAll(false)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      // Desmarcar todos
      onSelectionChange([])
      setSelectAll(false)
    } else {
      // Selecionar todos (usando user_id)
      const allUserIds = patientsWithUserId.map(patient => patient.user_id!).filter(Boolean) as number[]
      onSelectionChange(allUserIds)
      setSelectAll(true)
    }
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  }

  return (
    <div className="space-y-4">
      {/* Patient Selection */}
      <div className="space-y-2">
        <Label>Pacientes</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedPatientIds.length > 0 
                ? `${selectedPatientIds.length} paciente(s) selecionado(s)`
                : "Selecionar pacientes..."
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar pacientes..." />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Carregando..." : "Nenhum paciente encontrado."}
                </CommandEmpty>
                <CommandGroup>
                  {/* Opção "Todos" */}
                  {patientsWithUserId.length > 0 && (
                    <CommandItem
                      value="__select_all__"
                      onSelect={() => handleSelectAll()}
                      className="font-semibold border-b border-border"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectAll && selectedPatientIds.length === patientsWithUserId.length
                            ? "opacity-100" 
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold">Selecionar Todos ({patientsWithUserId.length} pacientes)</span>
                        <span className="text-xs text-muted-foreground">Atribuir quiz para todos os pacientes ativos</span>
                      </div>
                    </CommandItem>
                  )}
                  {/* Lista de pacientes */}
                  {patientsWithUserId.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={`${patient.name} ${patient.email}`}
                      onSelect={() => patient.user_id && handleSelect(patient.user_id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          patient.user_id && selectedPatientIds.includes(patient.user_id)
                            ? "opacity-100" 
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{patient.name}</span>
                        <span className="text-sm text-muted-foreground">{patient.email}</span>
                        {!patient.user_id && (
                          <span className="text-xs text-red-500">Sem acesso ao portal</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Patients */}
      {selectedPatients.length > 0 && (
        <div className="space-y-2">
          <Label>Pacientes Selecionados ({selectedPatients.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedPatients.map((patient) => (
              <Badge key={patient.id} variant="secondary" className="flex items-center gap-1">
                {patient.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => patient.user_id && handleRemove(patient.user_id)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Data Limite (Opcional)</Label>
        <CalendarPopover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <CalendarPopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? formatDate(dueDate) : "Selecionar data limite"}
            </Button>
          </CalendarPopoverTrigger>
          <CalendarPopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate ? new Date(dueDate) : undefined}
              onSelect={(date) => {
                onDueDateChange(date ? date.toISOString().split('T')[0] : undefined)
                setCalendarOpen(false)
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </CalendarPopoverContent>
        </CalendarPopover>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Observações (Opcional)</Label>
        <Textarea
          placeholder="Adicione observações para os pacientes..."
          value={notes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          rows={3}
        />
      </div>
    </div>
  )
}
