"use client"

import { Badge } from "@/components/ui/badge"
import type { ContractStatus } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"

interface ContractStatusBadgeProps {
  status: ContractStatus
  className?: string
}

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Badge className={`${getStatusColor(status)} ${className || ''}`}>
      {CONTRACT_STATUS_LABELS[status]}
    </Badge>
  )
}
