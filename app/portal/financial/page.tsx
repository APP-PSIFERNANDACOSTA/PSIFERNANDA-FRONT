"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Download, Eye, CheckCircle2, Calendar, Loader2, FileText, AlertCircle } from "lucide-react"
import paymentService from "@/services/payment-service"
import apiClient from "@/lib/api-client"
import sessionService from "@/services/session-service"
import type { Payment } from "@/types/payment"
import type { Session } from "@/types/session"
import { PAYMENT_METHOD_LABELS } from "@/types/payment"
import { showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState<number | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [paymentsData, sessionsData] = await Promise.all([
        paymentService.getMyPayments(),
        sessionService.getMySessions(),
      ])
      setPayments(paymentsData || [])
      setSessions(sessionsData || [])
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
      showErrorToast("Erro", "Não foi possível carregar os dados financeiros")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReceipt = async (paymentId: number) => {
    setIsDownloading(paymentId)
    try {
      await paymentService.downloadMyReceipt(paymentId)
    } catch (error: any) {
      showErrorToast("Erro ao baixar recibo", error.response?.data?.message || "Tente novamente mais tarde")
    } finally {
      setIsDownloading(null)
    }
  }

  const handleViewReceipt = async (paymentId: number) => {
    setIsDownloading(paymentId)
    try {
      // Usar apiClient para buscar o blob
      const response = await apiClient.getAxiosInstance().get(`/patient/payments/${paymentId}/download`, {
        responseType: 'blob',
      })

      // Criar blob URL e abrir em nova aba para visualizar
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Limpar URL após um tempo
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (error: any) {
      showErrorToast("Erro ao visualizar recibo", error.response?.data?.message || "Tente novamente mais tarde")
    } finally {
      setIsDownloading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(amount))
  }

  const formatCpf = (cpf: string | null | undefined) => {
    if (!cpf) return ""
    const digits = cpf.replace(/\D/g, "")
    if (digits.length !== 11) return cpf
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Contar sessões completadas
  const completedSessionsCount = sessions.filter((s) => s.status === "completed").length

  // Opções de meses disponíveis nos pagamentos
  const monthOptions = Array.from(
    new Set(
      payments.map((p) => {
        const d = new Date(p.payment_date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
      }),
    ),
  ).sort((a, b) => (a > b ? -1 : 1)) // mais recentes primeiro

  const formatMonthLabel = (value: string) => {
    const date = new Date(`${value}-01T00:00:00`)
    const label = format(date, "MMMM yyyy", { locale: ptBR })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  // Filtrar por mês selecionado
  const paymentsFilteredByMonth = payments.filter((p) => {
    if (filterMonth === "all") return true
    const d = new Date(p.payment_date)
    const [year, month] = filterMonth.split("-")
    return d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
  })

  // Ordenar pagamentos por data (mais recente primeiro)
  const sortedPayments = [...paymentsFilteredByMonth].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe seus pagamentos e recibos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : completedSessionsCount}
              </p>
              <p className="text-xs text-muted-foreground">Total de Sessões Feitas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : payments.length}
              </p>
              <p className="text-xs text-muted-foreground">Total de Pagamentos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Histórico de Pagamentos</h2>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Filtrar por mês:</span>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {monthOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatMonthLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : sortedPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">Nenhum pagamento encontrado</p>
              <p className="text-sm text-gray-600">Você ainda não possui pagamentos registrados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
                  {/* Informações principais */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground leading-snug">
                        {payment.description || "Pagamento de sessão"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.payment_date)} • {PAYMENT_METHOD_LABELS[payment.payment_method]}
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {payment.receipt_number && <span>Recibo: {payment.receipt_number}</span>}
                        {payment.patient?.cpf && <span>CPF: {formatCpf(payment.patient.cpf)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Valor e ações */}
                  <div className="flex flex-col gap-2 sm:items-end sm:min-w-[180px]">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                      <Badge
                        variant="secondary"
                        className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      >
                        Pago
                      </Badge>
                    </div>
                    {payment.pdf_path && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReceipt(payment.id)}
                          disabled={isDownloading === payment.id}
                          className="gap-1"
                        >
                          {isDownloading === payment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment.id)}
                          disabled={isDownloading === payment.id}
                          className="gap-1"
                        >
                          {isDownloading === payment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          Baixar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">Formas de Pagamento</p>
            <p className="mt-1 text-muted-foreground">
              Aceitamos PIX, cartão de crédito e débito. O pagamento pode ser realizado antes ou após a sessão. Em caso
              de dúvidas, entre em contato.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
