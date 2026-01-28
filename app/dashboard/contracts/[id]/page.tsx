"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Download, Mail, Copy, Loader2, Eye } from "lucide-react"
import contractService from "@/services/contract-service"
import type { Contract } from "@/types/contract"
import { CONTRACT_STATUS_LABELS, CONTRACT_PAYMENT_TYPES } from "@/types/contract"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

export default function ContractViewPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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
        router.push("/dashboard/contracts")
      }
    } catch (error) {
      console.error("Erro ao carregar contrato:", error)
      showErrorToast("Erro ao carregar contrato")
      router.push("/dashboard/contracts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!contract) return
    
    setIsDownloading(true)
    try {
      await contractService.downloadPdf(contract.id)
      showSuccessToast("PDF baixado com sucesso!")
    } catch (error: any) {
      console.error("Erro ao baixar PDF:", error)
      const errorMessage = error?.message || error?.response?.data?.message || "Erro ao baixar PDF"
      showErrorToast("Erro ao baixar PDF", errorMessage)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!contract) return
    
    const link = `${window.location.origin}/contract/${contract.token}`
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      showSuccessToast("Link copiado para a área de transferência!")
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar link:", error)
      showErrorToast("Erro ao copiar link")
    }
  }

  const handleResend = async () => {
    if (!contract) return
    
    try {
      await contractService.resend(contract.id)
      showSuccessToast("Link reenviado com sucesso!")
    } catch (error) {
      console.error("Erro ao reenviar:", error)
      showErrorToast("Erro ao reenviar link")
    }
  }

  const handleInactivate = async () => {
    if (!contract) return
    
    if (confirm("Tem certeza que deseja inativar este contrato?")) {
      try {
        await contractService.inactivate(contract.id)
        showSuccessToast("Contrato inativado com sucesso!")
        loadContract() // Recarregar dados
      } catch (error) {
        console.error("Erro ao inativar contrato:", error)
        showErrorToast("Erro ao inativar contrato")
      }
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    const paymentType = CONTRACT_PAYMENT_TYPES.find(pt => pt.value === type)
    return paymentType?.label || type
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
    
    // Substituir quebras de linha duplas por parágrafos
    // Primeiro, normalizar todas as quebras de linha
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Dividir por quebras de linha duplas ou simples para criar parágrafos
    const paragraphs = normalized.split(/\n\n+/).filter(p => p.trim())
    
    return paragraphs.map((paragraph, index) => {
      // Verificar se o parágrafo começa com um número (ex: "1. Pagamento")
      const isNumbered = /^\d+\.\s/.test(paragraph.trim())
      
      // Dividir parágrafos longos em linhas individuais se necessário
      const lines = paragraph.split('\n').filter(l => l.trim())
      
      return (
        <div key={index} className={isNumbered ? "mb-4" : "mb-3"}>
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim()
            // Se a linha começa com "- ", é um item de lista
            if (trimmedLine.startsWith('- ')) {
              return (
                <div key={lineIndex} className="ml-4 mb-1 text-sm leading-relaxed">
                  {trimmedLine}
                </div>
              )
            }
            // Se é uma linha numerada (ex: "1. Pagamento")
            if (/^\d+\.\s/.test(trimmedLine)) {
              return (
                <h4 key={lineIndex} className="font-semibold text-base mb-2 mt-4 first:mt-0">
                  {trimmedLine}
                </h4>
              )
            }
            // Linha normal
            return (
              <p key={lineIndex} className="text-sm leading-relaxed mb-2">
                {trimmedLine}
              </p>
            )
          })}
        </div>
      )
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Contrato não encontrado</p>
          <Button onClick={() => router.push("/dashboard/contracts")} className="mt-4">
            Voltar para Contratos
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/contracts")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Contrato #{contract.id}</h1>
              <p className="text-gray-500">Visualizar detalhes do contrato</p>
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
                  <FileText className="h-5 w-5 mr-2" />
                  Informações do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Pagamento</label>
                    <p className="text-lg">{getPaymentTypeLabel(contract.payment_type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor da Sessão</label>
                    <p className="text-lg font-semibold">R$ {parseFloat(contract.price_session).toFixed(2)}</p>
                  </div>
                </div>
                
                {contract.payment_day && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dia de Pagamento</label>
                    <p className="text-lg">Dia {contract.payment_day} de cada mês</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Criado em</label>
                    <p className="text-sm">{new Date(contract.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expira em</label>
                    <p className="text-sm">{new Date(contract.expires_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                {contract.signed_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assinado em</label>
                    <p className="text-sm">{new Date(contract.signed_at).toLocaleDateString('pt-BR')}</p>
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
                <div className="prose max-w-none text-gray-700">
                  {formatContractText(contract.contract_text)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {linkCopied ? "Copiado!" : "Copiar Link"}
                </Button>
                
                {contract.status === 'signed' && (
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="w-full justify-start"
                    variant={contract.pdf_path ? "default" : "outline"}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {contract.pdf_path ? "Baixar PDF" : "Gerar e Baixar PDF"}
                  </Button>
                )}
                
                {contract.status === 'pending' && (
                  <Button
                    onClick={handleResend}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar Link
                  </Button>
                )}
                
                {contract.status !== 'inactive' && (
                  <Button
                    onClick={handleInactivate}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Inativar Contrato
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Informações do Paciente */}
            {contract.patient && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <p className="text-sm">{contract.patient.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{contract.patient.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-sm">{contract.patient.phone}</p>
                  </div>
                  {contract.patient.cpf && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">CPF</label>
                      <p className="text-sm">{contract.patient.cpf}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
