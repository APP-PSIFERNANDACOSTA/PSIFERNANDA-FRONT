"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PatientFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
  initialData?: any
}

export function PatientForm({ onSubmit, onCancel, initialData }: PatientFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" placeholder="Nome do paciente" defaultValue={initialData?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthdate">Data de Nascimento</Label>
          <Input id="birthdate" type="date" defaultValue={initialData?.birthdate} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(00) 00000-0000" defaultValue={initialData?.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="email@exemplo.com" defaultValue={initialData?.email} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insurance">Plano de Saúde</Label>
          <Select defaultValue={initialData?.insurance}>
            <SelectTrigger id="insurance">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="unimed">Unimed</SelectItem>
              <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
              <SelectItem value="sulamerica">SulAmérica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_session">Valor da Sessão (R$)</Label>
          <Input 
            id="price_session" 
            type="number" 
            step="0.01" 
            min="0"
            placeholder="150.00" 
            defaultValue={initialData?.price_session} 
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency">Contato de Emergência</Label>
          <Input id="emergency" placeholder="(00) 00000-0000" defaultValue={initialData?.emergency} />
        </div>
        <div className="space-y-2">
          {/* Espaço vazio para manter o layout */}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" placeholder="Rua, número, bairro, cidade" defaultValue={initialData?.address} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações Iniciais</Label>
        <Input id="notes" placeholder="Motivo da consulta, preferências, etc." defaultValue={initialData?.notes} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{initialData ? "Atualizar" : "Cadastrar"} Paciente</Button>
      </div>
    </form>
  )
}
