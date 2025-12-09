"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react"
import contractService from "@/services/contract-service"
import type { Contract, SignContractData } from "@/types/contract"
import { PAYMENT_DAY_OPTIONS } from "@/types/contract"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

export default function ContractSignPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  
  const [formData, setFormData] = useState<SignContractData>({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    patient_cpf: '',
    emergency_contact: '',
    payment_day: undefined,
    accept_terms: false,
  })

  useEffect(() => {
    if (token) {
      loadContract()
    }
  }, [token])

  const loadContract = async () => {
    setIsLoading(true)
    try {
      const response = await contractService.getByToken(token)
      if (response.success) {
        setContract(response.contract)
      } else {
        showErrorToast("Contrato não encontrado", "Este contrato não existe ou já foi processado")
        router.push('/')
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        showErrorToast("Contrato não encontrado", "Este contrato não existe ou já foi processado")
      } else if (error.response?.status === 410) {
        showErrorToast("Contrato expirado", "Este contrato expirou e não pode mais ser assinado")
      } else {
        showErrorToast("Erro ao carregar contrato", "Tente novamente mais tarde")
      }
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contract) return
    
    // Validar payment_day se for mensal
    if (contract.payment_type === 'mensal' && !formData.payment_day) {
      showErrorToast("Dia de pagamento obrigatório", "Selecione o dia de pagamento para contratos mensais")
      return
    }

    setIsSigning(true)
    try {
      const response = await contractService.sign(token, formData)
      if (response.success) {
        setIsSigned(true)
        showSuccessToast("Contrato assinado!", "Seu contrato foi assinado com sucesso")
        
        // Redirect após 3 segundos
        setTimeout(() => {
          router.push('/contract/success')
        }, 3000)
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors
        const firstError = Object.values(errors)[0] as string[]
        showErrorToast("Erro de validação", firstError[0])
      } else {
        showErrorToast(
          "Erro ao assinar contrato",
          error.response?.data?.message || "Tente novamente mais tarde"
        )
      }
    } finally {
      setIsSigning(false)
    }
  }

  const formatPrice = (price: string) => {
    return `R$ ${Number(price).toFixed(2).replace('.', ',')}`
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'por_sessao':
        return 'Por Sessão'
      case 'quinzenal':
        return 'Quinzenal'
      case 'mensal':
        return 'Mensal'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-gray-600">Carregando contrato...</span>
        </div>
      </div>
    )
  }

  if (isSigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contrato Assinado!</h2>
            <p className="text-gray-600 text-center mb-4">
              Seu contrato foi assinado com sucesso. Você receberá um email de confirmação em breve.
            </p>
            <p className="text-sm text-gray-500 text-center">
              Redirecionando para a página de sucesso...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contrato não encontrado</h2>
            <p className="text-gray-600 text-center mb-4">
              Este contrato não existe ou já foi processado.
            </p>
            <Button onClick={() => router.push('/')}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto flex h-24 w-48 sm:h-32 sm:w-60 items-center justify-center mb-3 sm:mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Contrato Terapêutico</h1>
          <p className="text-sm sm:text-base text-gray-600">Fernanda Costa - Psicóloga CRP-08/43119</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Contract Text */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Texto do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-mono break-words">
                  {contract.contract_text}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Sign Form */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Assinar Contrato</CardTitle>
              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Tipo:</span>
                    <p className="text-gray-900 break-words">{getPaymentTypeLabel(contract.payment_type)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Valor:</span>
                    <p className="text-gray-900">{formatPrice(contract.price_session)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Nome Completo *</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_email">Email *</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={formData.patient_email}
                    onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="patient_phone"
                    value={formData.patient_phone}
                    onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_cpf">CPF *</Label>
                  <Input
                    id="patient_cpf"
                    value={formData.patient_cpf}
                    onChange={(e) => setFormData({ ...formData, patient_cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Contato de Emergência *</Label>
                  <Textarea
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Nome, telefone e parentesco (ex: Maria — (11) 99999-9999 — irmã)"
                    required
                  />
                </div>

                {contract.payment_type === 'mensal' && (
                  <div className="space-y-2">
                    <Label htmlFor="payment_day">Dia de Pagamento *</Label>
                    <Select
                      value={formData.payment_day?.toString() || ''}
                      onValueChange={(value) => setFormData({ ...formData, payment_day: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_DAY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accept_terms"
                    checked={formData.accept_terms}
                    onCheckedChange={(checked) => setFormData({ ...formData, accept_terms: !!checked })}
                    required
                  />
                  <Label htmlFor="accept_terms" className="text-sm">
                    Li e aceito os termos deste contrato terapêutico *
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSigning || !formData.accept_terms} 
                  className="w-full gap-2"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Assinar Contrato
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
