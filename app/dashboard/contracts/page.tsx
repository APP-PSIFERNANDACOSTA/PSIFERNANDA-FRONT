"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye, Copy, Mail, FileText, Loader2 } from "lucide-react"
import contractService from "@/services/contract-service"
import type { Contract, ContractStatus } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ContractStatus | 'all'>('pending')

  useEffect(() => {
    loadContracts()
  }, [activeTab])

  const loadContracts = async () => {
    setIsLoading(true)
    try {
      const response = await contractService.getAll(activeTab === 'all' ? undefined : activeTab)
      if (response.success) {
        setContracts(response.contracts)
      }
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar contratos",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/contract/${token}`
    try {
      await navigator.clipboard.writeText(link)
      showSuccessToast("Link copiado!", "O link do contrato foi copiado para a área de transferência")
    } catch (error) {
      showErrorToast("Erro ao copiar", "Não foi possível copiar o link")
    }
  }

  const handleResend = async (id: number) => {
    try {
      await contractService.resend(id)
      showSuccessToast("Email reenviado!", "O link do contrato foi reenviado por email")
    } catch (error: any) {
      showErrorToast(
        "Erro ao reenviar",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const handleInactivate = async (id: number) => {
    try {
      await contractService.inactivate(id)
      showSuccessToast("Contrato inativado!", "O contrato foi inativado com sucesso")
      loadContracts()
    } catch (error: any) {
      showErrorToast(
        "Erro ao inativar",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    }
  }

  const getStatusBadgeColor = (status: ContractStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'signed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Contratos Terapêuticos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie os contratos dos seus pacientes</p>
          </div>
          <Button onClick={() => router.push('/dashboard/contracts/create')} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar Novo Contrato</span>
            <span className="sm:hidden">Novo Contrato</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContractStatus | 'all')}>
          <TabsList className="grid w-full grid-cols-4 gap-1">
            <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-4">Pendentes</TabsTrigger>
            <TabsTrigger value="signed" className="text-xs sm:text-sm px-2 sm:px-4">Assinados</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs sm:text-sm px-2 sm:px-4">Inativos</TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-4">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-8 sm:mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-gray-600">Carregando contratos...</span>
                </div>
              </div>
            ) : contracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum contrato encontrado
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    {activeTab === 'pending' && "Não há contratos pendentes de assinatura."}
                    {activeTab === 'signed' && "Não há contratos assinados."}
                    {activeTab === 'inactive' && "Não há contratos inativos."}
                    {activeTab === 'all' && "Você ainda não criou nenhum contrato."}
                  </p>
                  {activeTab === 'all' && (
                    <Button onClick={() => router.push('/dashboard/contracts/create')} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Contrato
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge 
                              variant="outline" 
                              className={`${getStatusBadgeColor(contract.status)} font-medium text-xs`}
                            >
                              {CONTRACT_STATUS_LABELS[contract.status]}
                            </Badge>
                            {contract.status === 'signed' && contract.pdf_path && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF Disponível
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-gray-500">Tipo de Pagamento</p>
                              <p className="text-sm sm:text-base text-gray-900 break-words">{getPaymentTypeLabel(contract.payment_type)}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-gray-500">Valor da Sessão</p>
                              <p className="text-sm sm:text-base text-gray-900">{formatPrice(contract.price_session)}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-gray-500">Data de Criação</p>
                              <p className="text-xs sm:text-sm text-gray-900">{formatDate(contract.created_at)}</p>
                            </div>
                          </div>

                          {contract.patient && (
                            <div className="mb-3 sm:mb-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-500">Paciente</p>
                              <p className="text-sm sm:text-base text-gray-900 break-words">{contract.patient.name}</p>
                            </div>
                          )}

                          {contract.signed_at && (
                            <div className="mb-3 sm:mb-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-500">Assinado em</p>
                              <p className="text-xs sm:text-sm text-gray-900">{formatDate(contract.signed_at)}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-4 sm:flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                            className="gap-1 w-full sm:w-auto"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden sm:inline">Ver</span>
                            <span className="sm:hidden">Ver Detalhes</span>
                          </Button>
                          
                          {contract.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyLink(contract.token)}
                                className="gap-1 w-full sm:w-auto"
                              >
                                <Copy className="h-3 w-3" />
                                <span className="hidden sm:inline">Copiar Link</span>
                                <span className="sm:hidden">Copiar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResend(contract.id)}
                                className="gap-1 w-full sm:w-auto"
                              >
                                <Mail className="h-3 w-3" />
                                Reenviar
                              </Button>
                            </>
                          )}
                          
                          {contract.status === 'signed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInactivate(contract.id)}
                              className="gap-1 w-full sm:w-auto"
                            >
                              Inativar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
