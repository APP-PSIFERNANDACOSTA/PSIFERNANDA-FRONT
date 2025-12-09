"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { ArrowLeft, Save, Loader2, Search, X, Check, ChevronsUpDown } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import patientService from "@/services/patient-service"
import sessionReportService from "@/services/session-report-service"
import recordService from "@/services/record-service"
import type { Patient } from "@/types/patient"
import type { SessionReport } from "@/types/session-report"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function NewRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientParam = searchParams?.get("patient_id")
  
  const [isSaving, setIsSaving] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [searchReportTerm, setSearchReportTerm] = useState("")
  const [availableReports, setAvailableReports] = useState<SessionReport[]>([])
  const [isSearchingReports, setIsSearchingReports] = useState(false)
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([])
  const [reportsPopoverOpen, setReportsPopoverOpen] = useState(false)

  // Form data
  const [patientId, setPatientId] = useState<string>(patientParam || "")
  const [sessionDate, setSessionDate] = useState("")
  const [sessionNumber, setSessionNumber] = useState("")
  const [duration, setDuration] = useState("")
  const [sessionType, setSessionType] = useState<"individual" | "casal" | "familia" | "grupo">("individual")
  const [diagnosis, setDiagnosis] = useState("")
  const [complaints, setComplaints] = useState("")
  const [observations, setObservations] = useState("")
  const [interventions, setInterventions] = useState("")
  const [evolution, setEvolution] = useState("")
  const [therapeuticPlan, setTherapeuticPlan] = useState("")

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    setIsLoadingPatients(true)
    try {
      const response = await patientService.getAll({ status: "active" })
      setPatients(response.patients.data)
    } catch (error: any) {
      showErrorToast("Erro", "Não foi possível carregar os pacientes.")
    } finally {
      setIsLoadingPatients(false)
    }
  }

  const loadPatientReports = async () => {
    if (!patientId) {
      setAvailableReports([])
      return
    }

    setIsSearchingReports(true)
    try {
      // Buscar todos os relatórios do paciente usando o novo endpoint
      const reports = await sessionReportService.getAll(Number(patientId))
      setAvailableReports(reports)
    } catch (error: any) {
      console.error("Erro ao buscar relatórios:", error)
      setAvailableReports([])
    } finally {
      setIsSearchingReports(false)
    }
  }

  // Carregar relatórios automaticamente quando selecionar um paciente
  useEffect(() => {
    if (patientId) {
      loadPatientReports()
    } else {
      setAvailableReports([])
      setSelectedReportIds([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  // Filtrar relatórios quando pesquisar
  const filteredReports = searchReportTerm.trim()
    ? (availableReports || []).filter(report => 
        report.title.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
        format(new Date(report.created_at), "dd/MM/yyyy", { locale: ptBR }).includes(searchReportTerm)
      )
    : (availableReports || [])

  const handleToggleReport = (reportId: number) => {
    if (selectedReportIds.includes(reportId)) {
      setSelectedReportIds(selectedReportIds.filter(id => id !== reportId))
    } else {
      setSelectedReportIds([...selectedReportIds, reportId])
    }
  }

  const handleRemoveReport = (reportId: number) => {
    setSelectedReportIds(selectedReportIds.filter(id => id !== reportId))
  }

  const selectedReports = (availableReports || []).filter(report => selectedReportIds.includes(report.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patientId) {
      showErrorToast("Erro", "Selecione um paciente.")
      return
    }

    if (!sessionDate) {
      showErrorToast("Erro", "A data da sessão é obrigatória.")
      return
    }

    setIsSaving(true)
    try {
      await recordService.create({
        patient_id: Number(patientId),
        session_id: null,
        session_report_id: null,
        session_report_ids: selectedReportIds.length > 0 ? selectedReportIds : undefined,
        session_date: sessionDate,
        session_number: sessionNumber ? Number(sessionNumber) : null,
        duration: duration ? Number(duration) : null,
        session_type: sessionType,
        diagnosis: diagnosis || null,
        complaints: complaints || null,
        observations: observations || null,
        interventions: interventions || null,
        evolution: evolution || null,
        therapeutic_plan: therapeuticPlan || null,
      })

      showSuccessToast("Prontuário criado", "O prontuário foi criado com sucesso.")
      router.push("/medical-records")
    } catch (error: any) {
      showErrorToast(
        "Erro",
        error.response?.data?.message || "Não foi possível criar o prontuário."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/medical-records")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Novo Prontuário</h1>
              <p className="mt-1 text-muted-foreground">Criar um novo registro de prontuário</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient">Paciente *</Label>
                    <Select value={patientId} onValueChange={setPatientId} required>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPatients ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                            Carregando...
                          </div>
                        ) : patients.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                            Nenhum paciente encontrado
                          </div>
                        ) : (
                          patients.map((patient) => (
                            <SelectItem key={patient.id} value={String(patient.id)}>
                              {patient.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_date">Data da Sessão *</Label>
                    <Input
                      id="session_date"
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session_number">Número da Sessão</Label>
                    <Input
                      id="session_number"
                      type="number"
                      min="1"
                      value={sessionNumber}
                      onChange={(e) => setSessionNumber(e.target.value)}
                      placeholder="Ex: 12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Ex: 50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_type">Tipo de Sessão</Label>
                    <Select value={sessionType} onValueChange={(v: any) => setSessionType(v)}>
                      <SelectTrigger id="session_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="casal">Casal</SelectItem>
                        <SelectItem value="familia">Família</SelectItem>
                        <SelectItem value="grupo">Grupo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Buscar e Vincular Relatórios de Sessão */}
                <div className="space-y-2">
                  <Label htmlFor="session_reports">Vincular Relatórios de Sessão (opcional)</Label>
                  {!patientId ? (
                    <p className="text-sm text-muted-foreground">
                      Selecione um paciente primeiro para ver os relatórios disponíveis
                    </p>
                  ) : (
                    <>
                      <Popover open={reportsPopoverOpen} onOpenChange={setReportsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={reportsPopoverOpen}
                            className="w-full justify-between"
                            disabled={isSearchingReports}
                          >
                            {selectedReportIds.length > 0 
                              ? `${selectedReportIds.length} relatório(s) selecionado(s)`
                              : "Selecionar relatórios..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar relatórios..." 
                              value={searchReportTerm}
                              onValueChange={setSearchReportTerm}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isSearchingReports ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Carregando...
                                  </div>
                                ) : (availableReports || []).length === 0 ? (
                                  "Nenhum relatório encontrado para este paciente"
                                ) : (
                                  "Nenhum relatório encontrado com o termo pesquisado"
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredReports.map((report) => (
                                  <CommandItem
                                    key={report.id}
                                    value={`${report.title} ${format(new Date(report.created_at), "dd/MM/yyyy", { locale: ptBR })}`}
                                    onSelect={() => handleToggleReport(report.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedReportIds.includes(report.id)
                                          ? "opacity-100" 
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{report.title}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Relatórios Selecionados */}
                      {selectedReports.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Relatórios Selecionados ({selectedReports.length})</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedReports.map((report) => (
                              <Badge key={report.id} variant="secondary" className="flex items-center gap-1">
                                {report.title}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => handleRemoveReport(report.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Clínicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Clínicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico / CID-10</Label>
                  <Input
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Ex: F41.1 - Transtorno de ansiedade generalizada"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complaints">Queixa Principal</Label>
                  <Textarea
                    id="complaints"
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                    placeholder="Descreva a queixa principal apresentada pelo paciente..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações Clínicas</Label>
                  <RichTextEditor
                    value={observations}
                    onChange={setObservations}
                    placeholder="Estado emocional, comportamento, aspectos relevantes da sessão..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interventions">Intervenções Realizadas</Label>
                  <RichTextEditor
                    value={interventions}
                    onChange={setInterventions}
                    placeholder="Técnicas aplicadas, abordagens utilizadas, exercícios propostos..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evolution">Evolução do Quadro</Label>
                  <RichTextEditor
                    value={evolution}
                    onChange={setEvolution}
                    placeholder="Progresso observado, mudanças comportamentais, resposta ao tratamento..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="therapeutic_plan">Plano Terapêutico</Label>
                  <RichTextEditor
                    value={therapeuticPlan}
                    onChange={setTherapeuticPlan}
                    placeholder="Objetivos para próximas sessões, tarefas para casa, encaminhamentos..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/medical-records")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Prontuário
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
