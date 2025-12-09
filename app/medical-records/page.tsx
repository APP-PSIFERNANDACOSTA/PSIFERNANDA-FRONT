"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download, Send, FileText, Calendar, User, Loader2, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import recordService from "@/services/record-service"
import type { Record } from "@/types/record"
import { showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  casal: "Casal",
  familia: "Família",
  grupo: "Grupo",
}

export default function ProntuariosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    setIsLoading(true)
    try {
      const params = searchTerm ? { search: searchTerm } : {}
      const data = await recordService.getAll(params)
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground text-balance">Prontuários</h1>
            <p className="mt-1 text-muted-foreground">Registros clínicos e evolução dos pacientes</p>
          </div>
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => router.push('/medical-records/new')}
          >
            <Plus className="h-5 w-5" />
            Novo Prontuário
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente ou conteúdo..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum prontuário encontrado</p>
                <p>{searchTerm ? "Tente buscar com outros termos" : "Comece criando seu primeiro prontuário"}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {record.patient?.name || "Paciente"}
                          </h3>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(record.session_date)}
                            </span>
                            {record.session_number && <span>Sessão #{record.session_number}</span>}
                            {record.duration && <span>{record.duration} min</span>}
                            <Badge variant="secondary" className="text-xs">
                              {SESSION_TYPE_LABELS[record.session_type] || record.session_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {record.complaints && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {record.complaints}
                        </p>
                      )}
                      {record.session_report && (
                        <div className="text-xs text-muted-foreground">
                          📄 Relatório vinculado: {record.session_report.title}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedRecord(record)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Completo
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Record Details Dialog */}
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prontuário Completo</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {selectedRecord.patient?.name || "Paciente"}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        {selectedRecord.session_number && <span>Sessão #{selectedRecord.session_number}</span>}
                        {selectedRecord.session_number && <span>•</span>}
                        <span>{formatDate(selectedRecord.session_date)}</span>
                        {selectedRecord.duration && (
                          <>
                            <span>•</span>
                            <span>{selectedRecord.duration} min</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {SESSION_TYPE_LABELS[selectedRecord.session_type] || selectedRecord.session_type}
                  </Badge>
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  {selectedRecord.diagnosis && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Diagnóstico</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground">{selectedRecord.diagnosis}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedRecord.complaints && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Queixa Principal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedRecord.complaints }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {selectedRecord.observations && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Observações Clínicas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedRecord.observations }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {selectedRecord.interventions && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Intervenções Realizadas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedRecord.interventions }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {selectedRecord.evolution && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Evolução do Quadro</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedRecord.evolution }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {selectedRecord.therapeutic_plan && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Plano Terapêutico</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="text-sm leading-relaxed text-foreground prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedRecord.therapeutic_plan }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {selectedRecord.session_report && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Relatório de Sessão Vinculado</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{selectedRecord.session_report.title}</p>
                          <div 
                            className="text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedRecord.session_report.content }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground">
                    <p>Criado em: {format(new Date(selectedRecord.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    {selectedRecord.updated_at !== selectedRecord.created_at && (
                      <p>Última edição: {format(new Date(selectedRecord.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => router.push(`/medical-records/${selectedRecord.id}/edit`)}
                    >
                      Editar
                    </Button>
                    <Button className="gap-2">
                      <Download className="h-4 w-4" />
                      Gerar PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}