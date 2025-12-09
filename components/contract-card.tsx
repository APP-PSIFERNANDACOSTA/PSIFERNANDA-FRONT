"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { File, FileText, Download, Eye, Copy, Mail, Loader2 } from "lucide-react"
import type { Contract } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"
import { showSuccessToast } from "@/lib/toast-helpers"

interface ContractCardProps {
  contract: Contract
  onView?: (contract: Contract) => void
  onCopyLink?: (contract: Contract) => void
  onDownloadPdf?: (contract: Contract) => void
  onResend?: (contract: Contract) => void
  onInactivate?: (contract: Contract) => void
  showActions?: boolean
}

export function ContractCard({
  contract,
  onView,
  onCopyLink,
  onDownloadPdf,
  onResend,
  onInactivate,
  showActions = true
}: ContractCardProps) {
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/contract/${contract.token}`
    navigator.clipboard.writeText(link).then(() => {
      showSuccessToast("Link copiado para a área de transferência!")
    })
    onCopyLink?.(contract)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Contrato #{contract.id}
          </CardTitle>
          <Badge className={getStatusColor(contract.status)}>
            {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do Contrato */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Tipo de Pagamento</label>
            <p className="text-sm">{getPaymentTypeLabel(contract.payment_type)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Valor da Sessão</label>
            <p className="text-sm font-semibold">R$ {parseFloat(contract.price_session).toFixed(2)}</p>
          </div>
        </div>
        
        {contract.payment_day && (
          <div>
            <label className="text-sm font-medium text-gray-500">Dia de Pagamento</label>
            <p className="text-sm">Dia {contract.payment_day} de cada mês</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
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

        {/* Informações do Paciente */}
        {contract.patient && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Paciente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-sm">{contract.patient.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{contract.patient.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        {showActions && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {onView && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(contract)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
              
              {contract.status === 'signed' && contract.pdf_path && onDownloadPdf && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadPdf(contract)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              )}
              
              {contract.status === 'pending' && onResend && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResend(contract)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reenviar
                </Button>
              )}
              
              {contract.status !== 'inactive' && onInactivate && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onInactivate(contract)}
                >
                  <File className="h-4 w-4 mr-2" />
                  Inativar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
