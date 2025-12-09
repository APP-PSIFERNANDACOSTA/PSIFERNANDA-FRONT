"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Eye, Download, FileText, Loader2, Search, Calendar, DollarSign } from "lucide-react"
import paymentService from "@/services/payment-service"
import type { Payment, PaymentMethod } from "@/types/payment"
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from "@/types/payment"
import { showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMethod, setFilterMethod] = useState<string>("all")

  useEffect(() => {
    loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMethod])

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const paymentsList = await paymentService.getAll({
        payment_method: filterMethod !== "all" ? filterMethod : undefined,
      })
      setPayments(paymentsList)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pagamentos",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }


  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      await paymentService.downloadReceipt(payment.id)
    } catch (error: any) {
      showErrorToast(
        "Erro ao baixar recibo",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
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

  const filteredPayments = payments.filter((payment) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        payment.patient?.name.toLowerCase().includes(search) ||
        payment.receipt_number.toLowerCase().includes(search) ||
        payment.amount.includes(search)
      )
    }
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
            <p className="text-gray-600">Gerencie os pagamentos e recibos dos pacientes</p>
          </div>
          <Button onClick={() => router.push('/dashboard/payments/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Pagamento
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Paciente, recibo, valor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
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
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-600">Carregando pagamentos...</span>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum pagamento encontrado
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || filterMethod !== "all"
                  ? "Não há pagamentos correspondentes aos filtros aplicados."
                  : "Você ainda não cadastrou nenhum pagamento."}
              </p>
              {!searchTerm && filterMethod === "all" && (
                <Button onClick={() => router.push('/dashboard/payments/create')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Pagamento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant="outline"
                          className={PAYMENT_METHOD_COLORS[payment.payment_method]}
                        >
                          {PAYMENT_METHOD_LABELS[payment.payment_method]}
                        </Badge>
                        {payment.pdf_path && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                            <FileText className="h-3 w-3 mr-1" />
                            Recibo Disponível
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Paciente</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {payment.patient?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Valor</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Data do Pagamento</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(payment.payment_date)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Número do Recibo</p>
                          <p className="text-sm text-gray-900 font-mono">{payment.receipt_number}</p>
                        </div>
                        {payment.description && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Descrição</p>
                            <p className="text-sm text-gray-900">{payment.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {payment.pdf_path && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment)}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Baixar PDF
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </div>
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

