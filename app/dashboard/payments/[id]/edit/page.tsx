"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, DollarSign, FileText } from "lucide-react"
import paymentService from "@/services/payment-service"
import patientService from "@/services/patient-service"
import type { UpdatePaymentData, PaymentMethod, Payment } from "@/types/payment"
import type { Patient } from "@/types/patient"
import { PAYMENT_METHOD_LABELS } from "@/types/payment"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { format } from "date-fns"

export default function EditPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPayment, setIsLoadingPayment] = useState(true)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)

  const [formData, setFormData] = useState<UpdatePaymentData>({
    amount: 0,
    payment_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: 'pix',
    description: '',
  })

  useEffect(() => {
    if (paymentId) {
      loadPayment()
      loadActivePatients()
    }
  }, [paymentId])

  const loadPayment = async () => {
    setIsLoadingPayment(true)
    try {
      const paymentData = await paymentService.getById(parseInt(paymentId))
      setPayment(paymentData)
      setFormData({
        amount: Number(paymentData.amount),
        payment_date: paymentData.payment_date.split('T')[0],
        payment_method: paymentData.payment_method,
        description: paymentData.description || '',
      })
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pagamento",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      router.push("/dashboard/payments")
    } finally {
      setIsLoadingPayment(false)
    }
  }

  const loadActivePatients = async () => {
    setIsLoadingPatients(true)
    try {
      const response = await patientService.getAll({ status: 'active', per_page: 1000 })
      const patientsList = response.patients?.data || (Array.isArray(response.patients) ? response.patients : [])
      setPatients(patientsList)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pacientes",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      setPatients([])
    } finally {
      setIsLoadingPatients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.amount! <= 0) {
      showErrorToast("Erro", "O valor deve ser maior que zero")
      return
    }

    setIsLoading(true)
    try {
      await paymentService.update(parseInt(paymentId), formData)
      showSuccessToast(
        "Pagamento atualizado!",
        "O pagamento foi atualizado com sucesso e o recibo foi regenerado automaticamente."
      )
      router.push(`/dashboard/payments/${paymentId}`)
    } catch (error: any) {
      showErrorToast(
        "Erro ao atualizar pagamento",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingPayment) {
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
              onClick={() => router.push(`/dashboard/payments/${paymentId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Pagamento</h1>
              <p className="text-gray-600">Nº {payment.receipt_number}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Dados do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Info (Read-only) */}
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input
                  type="text"
                  value={payment.patient?.name || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  O paciente não pode ser alterado após o cadastro do pagamento.
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="0.00"
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment_date">Data do Pagamento *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date || ''}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pagamento *</Label>
                <Select
                  value={formData.payment_method || 'pix'}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição / Observações</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição ou observações sobre o pagamento"
                  rows={4}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/payments/${paymentId}`)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

