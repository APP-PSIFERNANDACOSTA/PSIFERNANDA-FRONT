"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { showSuccessToast } from "@/lib/toast-helpers"

interface CopyFieldProps {
  label: string
  value: string
  emptyLabel?: string
}

export function CopyField({ label, value, emptyLabel = "Não informado" }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)
  const displayValue = value?.trim() ? value : emptyLabel
  const canCopy = Boolean(value?.trim())

  const handleCopy = async () => {
    if (!canCopy) return

    await navigator.clipboard.writeText(value)
    setCopied(true)
    showSuccessToast("Copiado!", `${label} copiado para a área de transferência`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-1 break-all text-sm ${canCopy ? "text-foreground" : "text-muted-foreground italic"}`}>
            {displayValue}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!canCopy}
          className="shrink-0 gap-1"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copiar
        </Button>
      </div>
    </div>
  )
}
