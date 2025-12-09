"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Loader2, 
  Search,
  FileText,
  Download,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import paymentService from "@/services/payment-service"
import type { Payment } from "@/types/payment"
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from "@/types/payment"
import { showErrorToast } from "@/lib/toast-helpers"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"

export default function FinancialReportPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPeriod, setFilterPeriod] = useState<string>("current_month")
  const [filterMethod, setFilterMethod] = useState<string>("all")
  const [isDownloading, setIsDownloading] = useState<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [filterPeriod, filterMethod])

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      let startDate: string | undefined
      let endDate: string | undefined

      const now = new Date()
      
      switch (filterPeriod) {
        case "current_month":
          startDate = startOfMonth(now).toISOString().split('T')[0]
          endDate = endOfMonth(now).toISOString().split('T')[0]
          break
        case "last_month":
          const lastMonth = subMonths(now, 1)
          startDate = startOfMonth(lastMonth).toISOString().split('T')[0]
          endDate = endOfMonth(lastMonth).toISOString().split('T')[0]
          break
        case "current_year":
          startDate = startOfYear(now).toISOString().split('T')[0]
          endDate = endOfYear(now).toISOString().split('T')[0]
          break
        case "all":
        default:
          startDate = undefined
          endDate = undefined
          break
      }

      const params: any = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (filterMethod !== "all") params.payment_method = filterMethod

      const paymentsData = await paymentService.getAll(params)
      setPayments(paymentsData || [])
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pagamentos",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReceipt = async (paymentId: number) => {
    setIsDownloading(paymentId)
    try {
      await paymentService.downloadReceipt(paymentId)
    } catch (error: any) {
      showErrorToast(
        "Erro ao baixar recibo",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsDownloading(null)
    }
  }

  const handleViewReceipt = async (paymentId: number) => {
    setIsDownloading(paymentId)
    try {
      const response = await apiClient.getAxiosInstance().get(`/payments/${paymentId}/download`, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

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

  // Calcular totais
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const totalPayments = payments.length
  
  // Filtrar por termo de busca
  const filteredPayments = payments.filter((payment) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        payment.patient?.name.toLowerCase().includes(search) ||
        payment.receipt_number.toLowerCase().includes(search) ||
        payment.description?.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Agrupar por método de pagamento
  const paymentsByMethod = payments.reduce((acc, payment) => {
    const method = payment.payment_method
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 }
    }
    acc[method].count += 1
    acc[method].total += Number(payment.amount)
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatório Financeiro</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe seus recebimentos e análise financeira</p>
        </div>

        {/* Filters Dropdown */}
        <Card>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Filter className="h-5 w-5" />
                    Filtros
                    {(filterPeriod !== "current_month" || filterMethod !== "all" || searchTerm) && (
                      <Badge variant="outline" className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                        Filtros ativos
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {(filterPeriod !== "current_month" || filterMethod !== "all" || searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFilterPeriod("current_month")
                          setFilterMethod("all")
                          setSearchTerm("")
                        }}
                        className="text-xs"
                      >
                        Limpar
                      </Button>
                    )}
                    {filtersOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por paciente, recibo ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_month">Este Mês</SelectItem>
                      <SelectItem value="last_month">Mês Anterior</SelectItem>
                      <SelectItem value="current_year">Este Ano</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterMethod} onValueChange={setFilterMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Método de Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {formatCurrency(totalAmount.toFixed(2))}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pagamentos</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {totalPayments}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {totalPayments > 0 
                        ? formatCurrency((totalAmount / totalPayments).toFixed(2))
                        : formatCurrency("0.00")}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Breakdown */}
        {Object.keys(paymentsByMethod).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recebimentos por Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(paymentsByMethod).map(([method, data]) => (
                  <div key={method} className="p-4 border rounded-lg">
                    <Badge
                      variant="outline"
                      className={PAYMENT_METHOD_COLORS[method as keyof typeof PAYMENT_METHOD_COLORS]}
                    >
                      {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]}
                    </Badge>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(data.total.toFixed(2))}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.count} {data.count === 1 ? 'pagamento' : 'pagamentos'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum pagamento encontrado
                </p>
                <p className="text-sm text-gray-600">
                  {searchTerm || filterPeriod !== "all" || filterMethod !== "all"
                    ? "Não há pagamentos correspondentes aos filtros aplicados."
                    : "Ainda não há pagamentos registrados."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {payment.patient?.name || 'N/A'}
                          </p>
                          <Badge
                            variant="outline"
                            className={PAYMENT_METHOD_COLORS[payment.payment_method]}
                          >
                            {PAYMENT_METHOD_LABELS[payment.payment_method]}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.payment_date)}
                          </span>
                          {payment.receipt_number && (
                            <span>Recibo: {payment.receipt_number}</span>
                          )}
                        </div>
                        {payment.description && (
                          <p className="text-sm text-gray-600 mt-1">{payment.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end md:min-w-[180px]">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                      {payment.pdf_path && (
                        <div className="flex items-center gap-2">
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

