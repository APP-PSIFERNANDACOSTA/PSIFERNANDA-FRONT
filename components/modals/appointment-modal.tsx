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
import { AppointmentForm } from "@/components/forms/appointment-form"

interface AppointmentModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AppointmentModal({ trigger, open, onOpenChange }: AppointmentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Nova Sessão</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo agendamento</DialogDescription>
        </DialogHeader>
        <AppointmentForm onCancel={() => onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  )
}
