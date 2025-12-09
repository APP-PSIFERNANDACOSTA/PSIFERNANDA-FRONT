"use client"

import type React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PatientForm } from "@/components/forms/patient-form"

interface PatientModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: any
}

export function PatientModal({ trigger, open, onOpenChange, initialData }: PatientModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar" : "Cadastrar Novo"} Paciente</DialogTitle>
          <DialogDescription>
            {initialData ? "Atualize" : "Preencha"} os dados do paciente para{" "}
            {initialData ? "salvar" : "criar o cadastro"}
          </DialogDescription>
        </DialogHeader>
        <PatientForm initialData={initialData} onCancel={() => onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  )
}
