"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, FileText, Calendar, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PatientCardProps {
  patient: {
    id: number
    name: string
    age: number
    phone: string
    email: string
    status: string
    lastSession: string
  }
  onViewDetails?: (patient: any) => void
  onEdit?: (patient: any) => void
  onSchedule?: (patient: any) => void
}

export function PatientCard({ patient, onViewDetails, onEdit, onSchedule }: PatientCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-semibold text-primary">
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
            <div>
              <CardTitle className="text-base">{patient.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{patient.age} anos</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(patient)}>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(patient)}>Editar Cadastro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSchedule?.(patient)}>Agendar Sessão</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="truncate">{patient.email}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-xs text-muted-foreground">
            <p>Última sessão</p>
            <p className="mt-0.5 font-medium text-foreground">{patient.lastSession}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              patient.status === "active"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {patient.status === "active" ? "Ativo" : "Inativo"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
            <FileText className="mr-2 h-4 w-4" />
            Prontuário
          </Button>
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onSchedule?.(patient)}>
            <Calendar className="mr-2 h-4 w-4" />
            Agendar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
