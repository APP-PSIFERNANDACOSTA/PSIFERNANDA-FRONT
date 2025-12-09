"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Plus, Eye, Loader2 } from "lucide-react"
import recordService from "@/services/record-service"
import type { Record } from "@/types/record"
import { showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PatientRecordsProps {
  patientId: number
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  casal: "Casal",
  familia: "Família",
  grupo: "Grupo",
}

export function PatientRecords({ patientId }: PatientRecordsProps) {
  const router = useRouter()
  const [records, setRecords] = useState<Record[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [patientId])

  const loadRecords = async () => {
    setIsLoading(true)
    try {
      const data = await recordService.getPatientRecords(patientId)
      setRecords(data)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar prontuários",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum prontuário encontrado</p>
            <p>Este paciente ainda não possui prontuários cadastrados</p>
            <Button
              className="mt-4 gap-2"
              onClick={() => router.push(`/medical-records/new?patient_id=${patientId}`)}
            >
              <Plus className="h-4 w-4" />
              Criar Prontuário
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prontuários do Paciente</h3>
          <p className="text-sm text-muted-foreground">
            {records.length} {records.length === 1 ? "prontuário" : "prontuários"} cadastrado{records.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => router.push(`/medical-records/new?patient_id=${patientId}`)}
        >
          <Plus className="h-4 w-4" />
          Novo Prontuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => (
          <Card key={record.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {formatDate(record.session_date)}
                </CardTitle>
                <Badge variant="secondary">
                  {SESSION_TYPE_LABELS[record.session_type] || record.session_type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                {record.session_number && <span>Sessão #{record.session_number}</span>}
                {record.duration && <span>• {record.duration} min</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {record.diagnosis && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Diagnóstico</p>
                  <p className="text-sm">{record.diagnosis}</p>
                </div>
              )}
              {record.complaints && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Queixa Principal</p>
                  <p className="text-sm line-clamp-2">{record.complaints}</p>
                </div>
              )}
              {record.session_report && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Relatório Vinculado</p>
                  <p className="text-sm line-clamp-1">{record.session_report.title}</p>
                </div>
              )}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => router.push(`/medical-records/${record.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

