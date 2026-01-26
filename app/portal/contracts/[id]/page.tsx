"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PortalDashboardLayout } from "@/components/portal-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, File, FileText, Download, Loader2, Calendar, DollarSign, Clock } from "lucide-react"
import contractService from "@/services/contract-service"
import type { Contract } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"
import { showErrorToast } from "@/lib/toast-helpers"

export default function PatientContractViewPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (contractId) {
      loadContract()
    }
  }, [contractId])

  const loadContract = async () => {
    setIsLoading(true)
    try {
      const response = await contractService.getById(parseInt(contractId))
      if (response.success) {
        setContract(response.contract)
      } else {
        showErrorToast("Erro ao carregar contrato")
        router.push("/portal/contracts")
      }
    } catch (error: any) {
      console.error("Erro ao carregar contrato:", error)
      showErrorToast("Erro ao carregar contrato")
      router.push("/portal/contracts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!contract) return
    
    setIsDownloading(true)
    try {
      await contractService.downloadPdf(contract.id)
    } catch (error) {
      console.error("Erro ao baixar PDF:", error)
      showErrorToast("Erro ao baixar PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'por_sessao': return 'Por Sessão'
      case 'quinzenal': return 'Quinzenal'
      case 'mensal': return 'Mensal'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <PortalDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PortalDashboardLayout>
    )
  }

  if (!contract) {
    return (
      <PortalDashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Contrato não encontrado</p>
          <Button onClick={() => router.push("/portal/contracts")} className="mt-4">
            Voltar para Contratos
          </Button>
        </div>
      </PortalDashboardLayout>
    )
  }

  return (
    <PortalDashboardLayout>
      <div className="space-y-8 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/portal/contracts")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Contrato #{contract.id}</h1>
              <p className="text-gray-500">Detalhes do seu contrato terapêutico</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(contract.status)}>
              {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Contrato */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <File className="h-5 w-5 mr-2" />
                  Informações do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Pagamento</label>
                      <p className="text-lg">{getPaymentTypeLabel(contract.payment_type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Valor da Sessão</label>
                      <p className="text-lg font-semibold">R$ {parseFloat(contract.price_session).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {contract.payment_day && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dia de Pagamento</label>
                      <p className="text-lg">Dia {contract.payment_day} de cada mês</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Criado em</label>
                      <p className="text-sm">{new Date(contract.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expira em</label>
                      <p className="text-sm">{new Date(contract.expires_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
                
                {contract.signed_at && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assinado em</label>
                      <p className="text-sm">{new Date(contract.signed_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Texto do Contrato */}
            <Card>
              <CardHeader>
                <CardTitle>Texto do Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: contract.contract_text }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações e Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.status === 'signed' && contract.pdf_path && (
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="w-full justify-start"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar PDF
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Status do Contrato */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                {contract.status === 'signed' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Contrato Assinado</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Seu contrato foi assinado com sucesso e está em vigor.
                    </p>
                    <p className="text-sm text-gray-600">
                      Você pode baixar o PDF a qualquer momento para seus registros.
                    </p>
                  </div>
                )}

                {contract.status === 'pending' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Contrato Pendente</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Este contrato ainda não foi assinado.
                    </p>
                    <p className="text-sm text-gray-600">
                      Entre em contato com a psicóloga para mais informações.
                    </p>
                  </div>
                )}

                {contract.status === 'expired' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Contrato Expirado</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Este contrato expirou e não pode mais ser assinado.
                    </p>
                    <p className="text-sm text-gray-600">
                      Entre em contato com a psicóloga para um novo contrato.
                    </p>
                  </div>
                )}

                {contract.status === 'inactive' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="font-medium">Contrato Inativo</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Este contrato foi desativado pela psicóloga.
                    </p>
                    <p className="text-sm text-gray-600">
                      Entre em contato para mais informações.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Psicóloga Fernanda Costa</p>
                  <p className="text-sm text-gray-500">CRP-08/43119</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-gray-500">(44) 9 9910-3847</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Instagram</p>
                  <p className="text-sm text-gray-500">@psicfernandacosta</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalDashboardLayout>
  )
}
