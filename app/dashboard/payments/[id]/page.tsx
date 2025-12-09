"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Loader2, DollarSign, Calendar, User, CreditCard } from "lucide-react"
import paymentService from "@/services/payment-service"
import type { Payment } from "@/types/payment"
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS } from "@/types/payment"
import { showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PaymentViewPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string

  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (paymentId) {
      loadPayment()
    }
  }, [paymentId])

  const loadPayment = async () => {
    setIsLoading(true)
    try {
      const paymentData = await paymentService.getById(parseInt(paymentId))
      setPayment(paymentData)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pagamento",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      router.push("/dashboard/payments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!payment) return

    setIsDownloading(true)
    try {
      await paymentService.downloadReceipt(payment.id)
    } catch (error: any) {
      showErrorToast(
        "Erro ao baixar PDF",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsDownloading(false)
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-gray-600">Carregando pagamento...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pagamento não encontrado
            </h3>
            <Button onClick={() => router.push('/dashboard/payments')} variant="outline">
              Voltar para Pagamentos
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/payments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalhes do Pagamento</h1>
              <p className="text-gray-600">Nº {payment.receipt_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {payment.pdf_path && (
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Baixando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Baixar PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Informações do Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Valor</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Método de Pagamento</p>
                    <Badge
                      variant="outline"
                      className={PAYMENT_METHOD_COLORS[payment.payment_method]}
                    >
                      {PAYMENT_METHOD_LABELS[payment.payment_method]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Data do Pagamento</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Número do Recibo</p>
                    <p className="text-sm text-gray-900 font-mono">{payment.receipt_number}</p>
                  </div>
                </div>

                {payment.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Descrição / Observações</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {payment.description}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">Status do Recibo</p>
                  {payment.pdf_path ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <FileText className="h-3 w-3 mr-1" />
                      PDF Disponível
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      PDF em processamento
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payment.patient ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-sm text-gray-900 font-semibold">{payment.patient.name}</p>
                    </div>
                    {payment.patient.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{payment.patient.email}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Paciente não encontrado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                  <p className="text-sm text-gray-900">{formatDate(payment.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Última Atualização</p>
                  <p className="text-sm text-gray-900">{formatDate(payment.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

