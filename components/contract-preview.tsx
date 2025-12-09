"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { File, DollarSign, Calendar, Clock } from "lucide-react"
import type { Contract } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"

interface ContractPreviewProps {
  contract: Contract
  className?: string
}

export function ContractPreview({ contract, className }: ContractPreviewProps) {
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

  return (
    <Card className={className}>
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
        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Pagamento</label>
              <p className="text-sm">{getPaymentTypeLabel(contract.payment_type)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500">Valor da Sessão</label>
              <p className="text-sm font-semibold">R$ {parseFloat(contract.price_session).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {contract.payment_day && (
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500">Dia de Pagamento</label>
              <p className="text-sm">Dia {contract.payment_day} de cada mês</p>
            </div>
          </div>
        )}
        
        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500">Criado em</label>
              <p className="text-sm">{new Date(contract.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500">Expira em</label>
              <p className="text-sm">{new Date(contract.expires_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        {contract.signed_at && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <label className="text-sm font-medium text-gray-500">Assinado em</label>
              <p className="text-sm">{new Date(contract.signed_at).toLocaleDateString('pt-BR')}</p>
            </div>
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

        {/* Status específico */}
        {contract.status === 'pending' && (
          <div className="pt-4 border-t">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Contrato pendente:</strong> Aguardando assinatura do paciente.
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
                <strong>Contrato inativo:</strong> Este contrato foi desativado.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
