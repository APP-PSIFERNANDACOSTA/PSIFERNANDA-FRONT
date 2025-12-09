"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, Check, Loader2, FileText } from "lucide-react"
import contractService from "@/services/contract-service"
import type { CreateContractData, ContractPaymentType } from "@/types/contract"
import { CONTRACT_PAYMENT_TYPES } from "@/types/contract"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

export default function CreateContractPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [contract, setContract] = useState<any>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  
  const [formData, setFormData] = useState<CreateContractData>({
    payment_type: 'por_sessao',
    price_session: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.price_session <= 0) {
      showErrorToast("Valor inválido", "O valor da sessão deve ser maior que zero")
      return
    }

    setIsLoading(true)
    try {
      const response = await contractService.create(formData)
      if (response.success) {
        setContract(response.contract)
        showSuccessToast(
          "Contrato criado!",
          "O contrato foi gerado com sucesso. Copie o link para enviar ao paciente."
        )
      }
    } catch (error: any) {
      showErrorToast(
        "Erro ao criar contrato",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!contract) return
    
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/contract/${contract.token}`)
      setLinkCopied(true)
      showSuccessToast("Link copiado!", "O link do contrato foi copiado para a área de transferência")
      
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      showErrorToast("Erro ao copiar", "Não foi possível copiar o link")
    }
  }

  const generateContractPreview = () => {
    const baseText = `Contrato Terapêutico – Psicóloga Fernanda Costa (CRP-08/43119)

Bem-vinda(o) ao processo terapêutico!

Sou Fernanda Gabriela Bezerra da Costa, psicóloga, CRP-08/43119, e este documento tem o objetivo de garantir clareza, transparência e segurança no nosso trabalho conjunto. Abaixo os principais pontos sobre o funcionamento das sessões, pagamentos e aspectos éticos da terapia.

1. Pagamento
- O valor acordado para as sessões é de R$ ${formData.price_session.toFixed(2).replace('.', ',')}.
- O pagamento `

    const paymentDetails = formData.payment_type === 'por_sessao' 
      ? 'deve ser realizado até 30 minutos antes do horário de cada sessão'
      : formData.payment_type === 'quinzenal'
      ? 'deve ser realizado quinzenalmente nos dias 15 e 30 de cada mês'
      : 'deve ser feito mensalmente até o dia de cada mês que selecionar no formulário abaixo'

    return baseText + paymentDetails + `.
- O pagamento é feito via Pix.
- O não pagamento até a data combinada poderá implicar na suspensão temporária dos atendimentos até a regularização.

2. Faltas e Cancelamentos
- O cancelamento ou reagendamento de sessão deverá ser informado com pelo menos 12 horas de antecedência.
- Caso o aviso não seja feito dentro desse prazo, será cobrado 50% do valor da sessão.
- Em casos de emergência, problemas de saúde ou imprevistos graves, a cobrança poderá ser isentada, mediante comunicação.
- Em caso de atraso, o tempo de sessão será reduzido proporcionalmente, sem extensão do horário.

3. Confidencialidade
- Todo o conteúdo abordado nas sessões é confidencial e protegido pelo Código de Ética Profissional do Psicólogo.
- A quebra de sigilo só poderá ocorrer em situações previstas na lei, como risco iminente à vida do(a) paciente ou de terceiros, ou mediante ordem judicial.

4. Compromisso Terapêutico
A terapia é um espaço de autoconhecimento, responsabilidade e crescimento emocional.

O comprometimento com presença, pontualidade e continuidade do processo é essencial para os resultados.

5. Reajuste de Valor
O valor das sessões poderá ser reajustado semestralmente, mediante aviso prévio e acordo entre ambas as partes.

6. Proteção de Dados – LGPD
Em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), todos os dados pessoais e clínicos fornecidos pelo(a) paciente serão usados exclusivamente para fins relacionados à prática psicológica, respeitando os princípios de confidencialidade, sigilo e segurança da informação.

Todos os dados armazenados na plataforma são altamente criptografados e seguem rigorosamente as normas da LGPD e o Código de Ética Profissional da Psicologia. O acesso aos seus dados será mantido somente durante o período em que houver atendimento terapêutico ativo.

Estou à disposição para esclarecer qualquer dúvida que possa surgir.

Peço que preencha o formulário abaixo para o cadastro completo.`
  }

  if (contract) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/contracts')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contrato Criado!</h1>
              <p className="text-gray-600">Seu contrato foi gerado com sucesso</p>
            </div>
          </div>

          {/* Success Card */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Contrato Gerado com Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Link do Contrato:</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                    {`${window.location.origin}/contract/${contract.token}`}
                  </code>
                  <Button
                    onClick={handleCopyLink}
                    className="gap-2"
                    variant={linkCopied ? "default" : "outline"}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Informações do Contrato:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Tipo de Pagamento:</span>
                    <p className="text-gray-900">
                      {CONTRACT_PAYMENT_TYPES.find(t => t.value === contract.payment_type)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Valor da Sessão:</span>
                    <p className="text-gray-900">R$ {Number(contract.price_session).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status:</span>
                    <p className="text-gray-900">Pendente de Assinatura</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Expira em:</span>
                    <p className="text-gray-900">
                      {new Date(contract.expires_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => router.push('/dashboard/contracts')} className="flex-1">
                  Ver Lista de Contratos
                </Button>
                <Button 
                  onClick={() => {
                    setContract(null)
                    setFormData({ payment_type: 'por_sessao', price_session: 0 })
                  }} 
                  variant="outline"
                  className="flex-1"
                >
                  Gerar Outro Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/contracts')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerar Novo Contrato</h1>
            <p className="text-gray-600">Configure os dados do contrato terapêutico</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Tipo de Pagamento</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value: ContractPaymentType) =>
                      setFormData({ ...formData, payment_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_PAYMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_session">Valor da Sessão (R$)</Label>
                  <Input
                    id="price_session"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_session || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price_session: Number(e.target.value) })
                    }
                    placeholder="Ex: 120.00"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando Contrato...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Gerar Contrato
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview do Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {generateContractPreview()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
