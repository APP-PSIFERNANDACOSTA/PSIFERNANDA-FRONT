"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AppointmentFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export function AppointmentForm({ onSubmit, onCancel }: AppointmentFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patient">Paciente</Label>
        <Select>
          <SelectTrigger id="patient">
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Ana Paula Santos</SelectItem>
            <SelectItem value="2">Carlos Eduardo Lima</SelectItem>
            <SelectItem value="3">Beatriz Oliveira</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Horário</Label>
          <Input id="time" type="time" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Atendimento</Label>
        <Select>
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" placeholder="Notas adicionais (opcional)" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Confirmar Agendamento</Button>
      </div>
    </form>
  )
}
