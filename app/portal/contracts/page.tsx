"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { File, FileText, Download, Loader2, Calendar, DollarSign, Eye } from "lucide-react"
import contractService from "@/services/contract-service"
import type { Contract } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"
import { showErrorToast } from "@/lib/toast-helpers"

export default function PatientContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    setIsLoading(true)
    try {
      const response = await contractService.getMyContracts()
      if (response.success) {
        setContracts(response.contracts)
      }
    } catch (error: any) {
      console.error("Erro ao carregar contratos:", error)
      showErrorToast("Erro ao carregar contratos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = async (contractId: number) => {
    try {
      await contractService.downloadMyContractPdf(contractId)
    } catch (error) {
      console.error("Erro ao baixar PDF:", error)
      showErrorToast("Erro ao baixar PDF")
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

  const formatContractText = (text: string) => {
    if (!text) return ''
    
    // Dividir o texto em parágrafos baseado em quebras de linha duplas
    const paragraphs = text.split('\n\n').filter(p => p.trim())
    
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-4 text-sm leading-relaxed">
        {paragraph.trim()}
      </p>
    ))
  }

  return (
    <div className="space-y-8 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Meus Contratos</h1>
          <p className="text-gray-500">Visualize seus contratos terapêuticos assinados</p>
        </div>

        {/* Contratos */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : contracts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum contrato encontrado</p>
                <p>Você ainda não possui contratos assinados</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5 sm:space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <File className="h-4 w-4 sm:h-5 sm:w-5" />
                      Contrato #{contract.id}
                    </CardTitle>
                    <Badge className={`${getStatusColor(contract.status)} text-xs sm:text-sm w-fit`}>
                      {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informações do Contrato */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">Tipo de Pagamento</p>
                        <p className="text-sm sm:text-base font-medium break-words">{getPaymentTypeLabel(contract.payment_type)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start sm:items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500">Valor da Sessão</p>
                        <p className="text-sm sm:text-base font-medium">R$ {parseFloat(contract.price_session).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {contract.payment_day && (
                      <div className="flex items-start sm:items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-gray-500">Dia de Pagamento</p>
                          <p className="text-sm sm:text-base font-medium">Dia {contract.payment_day}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Criado em</p>
                      <p className="text-sm sm:text-base">{new Date(contract.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    {contract.signed_at && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Assinado em</p>
                        <p className="text-sm sm:text-base">{new Date(contract.signed_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedContract(contract)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Contrato
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
                          <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">Contrato #{contract.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                              <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-2">Informações do Contrato</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                  <span className="font-medium">Tipo de Pagamento:</span> {getPaymentTypeLabel(contract.payment_type)}
                                </div>
                                <div>
                                  <span className="font-medium">Valor da Sessão:</span> R$ {parseFloat(contract.price_session).toFixed(2)}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span> 
                                  <Badge className={`ml-2 ${getStatusColor(contract.status)}`}>
                                    {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="font-medium">Assinado em:</span> {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('pt-BR') : 'Não assinado'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="border rounded-lg p-4">
                              <h3 className="font-semibold text-gray-800 mb-3">Texto do Contrato</h3>
                              <div className="prose prose-sm max-w-none">
                                {formatContractText(contract.contract_text)}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {contract.status === 'signed' && contract.pdf_path && (
                        <Button
                          onClick={() => handleDownloadPdf(contract.id)}
                          className="w-full sm:w-auto"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Status específico */}
                  {contract.status === 'pending' && (
                    <div className="pt-4 border-t">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Contrato pendente:</strong> Este contrato ainda não foi assinado.
                        </p>
                      </div>
                    </div>
                  )}

                  {contract.status === 'expired' && (
                    <div className="pt-4 border-t">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                          <strong>Contrato expirado:</strong> Este contrato expirou e não pode mais ser assinado.
                        </p>
                      </div>
                    </div>
                  )}

                  {contract.status === 'inactive' && (
                    <div className="pt-4 border-t">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-800">
                          <strong>Contrato inativo:</strong> Este contrato foi desativado pela psicóloga.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

    </div>
  )
}
