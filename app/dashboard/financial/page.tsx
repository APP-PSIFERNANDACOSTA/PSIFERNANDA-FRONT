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
import expenseService from "@/services/expense-service"
import contractService from "@/services/contract-service"
import type { Payment } from "@/types/payment"
import type { Contract } from "@/types/contract"
import type { Expense } from "@/types/expense"
import { EXPENSE_STATUS_LABELS } from "@/types/expense"
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from "@/types/payment"
import { showErrorToast } from "@/lib/toast-helpers"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import apiClient from "@/lib/api-client"
import { usePrivacyMode } from "@/contexts/privacy-mode-context"
import { maskLongText, maskMoneyBr, maskPatientName } from "@/lib/privacy-mask"

export default function FinancialReportPage() {
  const { privacyMode } = usePrivacyMode()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPeriod, setFilterPeriod] = useState<string>("current_month")
  const [filterMethod, setFilterMethod] = useState<string>("all")
  const [isDownloading, setIsDownloading] = useState<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [signedContracts, setSignedContracts] = useState<Contract[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<{
    cash: { total_received: string; total_paid_expenses: string; net_profit: string }
    forecast: { pending_expenses: string }
  } | null>(null)

  useEffect(() => {
    loadPayments()
  }, [filterPeriod, filterMethod])

  useEffect(() => {
    loadSignedContracts()
  }, [])

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

      const [summaryData, expenseData] = await Promise.all([
        expenseService.getFinancialSummary(params),
        expenseService.getAll(params),
      ])

      setSummary(summaryData)
      setExpenses(expenseData || [])
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pagamentos",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      setPayments([])
      setExpenses([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSignedContracts = async () => {
    try {
      const response = await contractService.getAll("signed")
      if (response.success) {
        const activePatientContracts = (response.contracts || []).filter(
          (contract) => contract.patient?.status === "active"
        )
        setSignedContracts(activePatientContracts)
      }
    } catch {
      // Não bloqueia a tela de financeiro se a projeção falhar
      setSignedContracts([])
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

  const displayCurrency = (amount: string) =>
    privacyMode ? maskMoneyBr(amount, true) : formatCurrency(amount)

  const countMonthlyDayOccurrencesInRange = (daysOfMonth: number[], start: Date, end: Date) => {
    const daySet = new Set(daysOfMonth)
    let count = 0

    const rangeStart = new Date(start)
    rangeStart.setHours(0, 0, 0, 0)
    const rangeEnd = new Date(end)
    rangeEnd.setHours(0, 0, 0, 0)

    const cursor = new Date(rangeStart)
    while (cursor <= rangeEnd) {
      if (daySet.has(cursor.getDate())) {
        count += 1
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    return count
  }

  const getOccurrencesForPeriod = (contract: Contract, start: Date, end: Date) => {
    const periodStart = new Date(start)
    periodStart.setHours(0, 0, 0, 0)
    const periodEnd = new Date(end)
    periodEnd.setHours(0, 0, 0, 0)
    const periodDays = Math.max(1, Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    switch (contract.payment_type) {
      case "por_sessao":
        // Estimativa padrão de 1 sessão por semana por contrato.
        return Math.max(1, Math.ceil(periodDays / 7))
      case "quinzenal":
        // Contrato quinzenal usa ciclos de cobrança nos dias 15 e 30.
        return countMonthlyDayOccurrencesInRange([15, 30], periodStart, periodEnd)
      case "mensal": {
        const paymentDay = contract.payment_day
        if (!paymentDay) {
          return periodDays >= 30 ? 1 : 0
        }
        return countMonthlyDayOccurrencesInRange([paymentDay], periodStart, periodEnd)
      }
      default:
        return 0
    }
  }

  const getProjectedRevenue = (windowDays: number) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = addDays(start, windowDays)

    return signedContracts.reduce((sum, contract) => {
      const amount = Number(contract.price_session || 0)
      const occurrences = getOccurrencesForPeriod(contract, start, end)
      return sum + amount * occurrences
    }, 0)
  }

  const getProjectedRevenueForPeriod = (start: Date, end: Date) => {
    return signedContracts.reduce((sum, contract) => {
      const amount = Number(contract.price_session || 0)
      const occurrences = getOccurrencesForPeriod(contract, start, end)
      return sum + amount * occurrences
    }, 0)
  }

  // Calcular totais
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const totalPaidExpenses = summary ? Number(summary.cash.total_paid_expenses) : 0
  const netProfit = summary ? Number(summary.cash.net_profit) : totalAmount
  const projectedWeekly = getProjectedRevenue(7)
  const projectedFortnight = getProjectedRevenue(15)
  const projectedMonthly = getProjectedRevenue(30)
  const projectedCurrentMonth = getProjectedRevenueForPeriod(startOfMonth(new Date()), endOfMonth(new Date()))
  
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

        {/* Projeção de Recebimentos por Contrato */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Média Semanal (estimada)</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    {displayCurrency(projectedWeekly.toFixed(2))}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projeção Quinzenal (15 dias)</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">
                    {displayCurrency(projectedFortnight.toFixed(2))}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projeção Mensal (30 dias)</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {displayCurrency(projectedMonthly.toFixed(2))}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Potencial do Mês (dia 1 ao fim)</p>
                  <p className="text-3xl font-bold text-teal-600 mt-1">
                    {displayCurrency(projectedCurrentMonth.toFixed(2))}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entradas Recebidas</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {displayCurrency(totalAmount.toFixed(2))}
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
                  <p className="text-sm font-medium text-gray-600">Saídas Pagas</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-red-600 mt-1">
                      {displayCurrency(totalPaidExpenses.toFixed(2))}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lucro Líquido Real</p>
                  <p className="text-xs text-gray-500 mt-1">Entradas recebidas - saídas pagas</p>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {displayCurrency(netProfit.toFixed(2))}
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
                      {displayCurrency(data.total.toFixed(2))}
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
                            {payment.patient?.name
                              ? maskPatientName(payment.patient.name, privacyMode)
                              : "N/A"}
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
                          <p className="text-sm text-gray-600 mt-1">
                            {maskLongText(payment.description ?? "", privacyMode, 20)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end md:min-w-[180px]">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {displayCurrency(payment.amount)}
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

        {/* Expense List */}
        <Card>
          <CardHeader>
            <CardTitle>Custos de Saída</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum custo lançado para este período.</p>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <p className="font-medium text-gray-900">{expense.title}</p>
                      <p className="text-sm text-gray-600">
                        {expense.description}
                      </p>
                      {expense.payment_method ? (
                        <p className="text-sm text-gray-600">
                          Forma: {PAYMENT_METHOD_LABELS[expense.payment_method as keyof typeof PAYMENT_METHOD_LABELS] ?? expense.payment_method}
                        </p>
                      ) : null}
                      {expense.payment_date ? (
                        <p className="text-sm text-gray-600">
                          Pago em: {formatDate(expense.payment_date)}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{EXPENSE_STATUS_LABELS[expense.status]}</Badge>
                      <p className="text-lg font-semibold text-red-600 mt-1">
                        {displayCurrency(expense.amount)}
                      </p>
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

