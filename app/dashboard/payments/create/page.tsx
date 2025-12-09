"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Loader2, DollarSign, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import paymentService from "@/services/payment-service"
import patientService from "@/services/patient-service"
import type { CreatePaymentData, PaymentMethod } from "@/types/payment"
import type { Patient } from "@/types/patient"
import { PAYMENT_METHOD_LABELS } from "@/types/payment"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

export default function CreatePaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)

  const [formData, setFormData] = useState<CreatePaymentData>({
    patient_id: 0,
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'pix',
    description: '',
  })

  useEffect(() => {
    loadActivePatients()
  }, [])

  const loadActivePatients = async () => {
    setIsLoadingPatients(true)
    try {
      const response = await patientService.getAll({ status: 'active', per_page: 1000 })
      // Se a resposta for paginada, pegar os dados da paginação
      const patientsList = response.patients?.data || (Array.isArray(response.patients) ? response.patients : [])
      setPatients(patientsList)
      
      // Pré-selecionar o primeiro paciente se houver
      if (patientsList.length > 0 && formData.patient_id === 0) {
        setFormData(prev => ({ ...prev, patient_id: patientsList[0].id }))
      }
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

    if (!formData.patient_id || formData.patient_id === 0) {
      showErrorToast("Erro", "Selecione um paciente")
      return
    }

    if (formData.amount <= 0) {
      showErrorToast("Erro", "O valor deve ser maior que zero")
      return
    }

    setIsLoading(true)
    try {
      await paymentService.create(formData)
      showSuccessToast(
        "Pagamento cadastrado!",
        "O pagamento foi cadastrado com sucesso e o recibo foi gerado automaticamente."
      )
      router.push('/dashboard/payments')
    } catch (error: any) {
      showErrorToast(
        "Erro ao cadastrar pagamento",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Cadastrar Pagamento</h1>
              <p className="text-gray-600">Registre um novo pagamento e gere o recibo automaticamente</p>
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
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente *</Label>
                {isLoadingPatients ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando pacientes ativos...
                  </div>
                ) : patients.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    Não há pacientes ativos cadastrados.
                  </p>
                ) : (
                  <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={patientSearchOpen}
                        className="w-full justify-between"
                      >
                        {formData.patient_id
                          ? patients.find((patient) => patient.id === formData.patient_id)?.name || "Selecione um paciente"
                          : "Selecione um paciente"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar paciente..." />
                        <CommandList>
                          <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {patients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={`${patient.name} ${patient.email || ''}`}
                                onSelect={() => {
                                  setFormData({ ...formData, patient_id: patient.id })
                                  setPatientSearchOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.patient_id === patient.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{patient.name}</span>
                                  {patient.email && (
                                    <span className="text-sm text-muted-foreground">{patient.email}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
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
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  placeholder="Ex: 180.00"
                  required
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment_date">Data do Pagamento *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_date: e.target.value })
                  }
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pagamento *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value: PaymentMethod) =>
                    setFormData({ ...formData, payment_method: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ex: Pagamento referente a sessão de terapia realizada em 15/11/2025"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.patient_id || formData.amount <= 0}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Cadastrar Pagamento
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/payments')}
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

