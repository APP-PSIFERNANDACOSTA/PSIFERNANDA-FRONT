"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Eye, FileCheck, Loader2, X } from "lucide-react"
import healthReceiptService from "@/services/health-receipt-service"
import patientService from "@/services/patient-service"
import type { HealthReceipt } from "@/types/health-receipt"
import type { Patient } from "@/types/patient"
import { HEALTH_RECEIPT_STATUS_LABELS } from "@/types/health-receipt"
import { showErrorToast } from "@/lib/toast-helpers"
import { usePrivacyMode } from "@/contexts/privacy-mode-context"
import { maskMoneyBr, maskPatientName } from "@/lib/privacy-mask"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function HealthReceiptsPage() {
  const router = useRouter()
  const { privacyMode } = usePrivacyMode()
  const [receipts, setReceipts] = useState<HealthReceipt[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])

  const [filterStatus, setFilterStatus] = useState<string>("pending")
  const [filterPatientId, setFilterPatientId] = useState<string>("all")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    loadReceipts()
  }, [filterStatus, filterPatientId, filterStartDate, filterEndDate])

  const loadPatients = async () => {
    try {
      const response = await patientService.getAll({ status: "active", per_page: 1000 })
      const list = response.patients?.data || (Array.isArray(response.patients) ? response.patients : [])
      setPatients(list)
    } catch {
      // silencioso — select fica vazio
    }
  }

  const loadReceipts = async () => {
    setIsLoading(true)
    try {
      const data = await healthReceiptService.getAll({
        status: filterStatus !== "all" ? (filterStatus as "pending" | "issued") : undefined,
        patient_id: filterPatientId !== "all" ? Number(filterPatientId) : undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      })
      setReceipts(data.receipts)
      setPendingCount(data.pending_count)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar recibos",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const hasActiveFilters =
    filterPatientId !== "all" || filterStartDate !== "" || filterEndDate !== ""

  const clearFilters = () => {
    setFilterPatientId("all")
    setFilterStartDate("")
    setFilterEndDate("")
  }

  const formatDate = (dateString: string) =>
    format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recibo Saúde</h1>
            <p className="mt-1 text-muted-foreground">
              Recibos para emissão no Carnê-leão
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="w-fit bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Filtros</p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Paciente</Label>
                <Select value={filterPatientId} onValueChange={setFilterPatientId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os pacientes</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {privacyMode ? maskPatientName(p.name) : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="issued">Emitidos</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data de</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data até</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : receipts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">Nenhum recibo encontrado</p>
              <p className="text-sm text-muted-foreground">
                {filterStatus === "pending"
                  ? "Todos os recibos foram emitidos."
                  : hasActiveFilters
                  ? "Nenhum recibo corresponde aos filtros aplicados."
                  : "Cadastre um pagamento para gerar um recibo automaticamente."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <Card key={receipt.id} className="transition-colors hover:bg-muted/30">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {privacyMode
                          ? maskPatientName(receipt.payment?.patient?.name || "Paciente")
                          : receipt.payment?.patient?.name || "Paciente"}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          receipt.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }
                      >
                        {HEALTH_RECEIPT_STATUS_LABELS[receipt.status]}
                      </Badge>
                      {receipt.missing_cpf && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          CPF ausente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pagamento: {formatDate(receipt.payment_date)} • Atendimento: {formatDate(receipt.service_date)}
                    </p>
                    {receipt.payment?.receipt_number && (
                      <p className="text-xs text-muted-foreground">Recibo: {receipt.payment.receipt_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <p className="font-semibold">
                      {privacyMode ? maskMoneyBr(receipt.amount) : formatCurrency(receipt.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Ver detalhes do recibo"
                      onClick={() => router.push(`/dashboard/receipts/${receipt.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
