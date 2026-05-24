"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CopyField } from "@/components/copy-field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, Download, Loader2, Pencil, Upload, X } from "lucide-react"
import healthReceiptService from "@/services/health-receipt-service"
import type { HealthReceipt, HealthReceiptStatus } from "@/types/health-receipt"
import { HEALTH_RECEIPT_STATUS_LABELS } from "@/types/health-receipt"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function HealthReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const receiptId = Number(params.id)

  const [receipt, setReceipt] = useState<HealthReceipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isIssuing, setIsIssuing] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [editMode, setEditMode] = useState(false)

  const [form, setForm] = useState({
    payer_cpf: "",
    payer_is_beneficiary: true,
    beneficiary_cpf: "",
    service_date: "",
    description: "",
    status: "pending" as HealthReceiptStatus,
  })

  useEffect(() => {
    loadReceipt()
  }, [receiptId])

  const loadReceipt = async () => {
    setIsLoading(true)
    try {
      const data = await healthReceiptService.getById(receiptId)
      setReceipt(data)
      setForm({
        payer_cpf: data.payer_cpf || "",
        payer_is_beneficiary: data.payer_is_beneficiary,
        beneficiary_cpf: data.beneficiary_cpf || "",
        service_date: data.service_date.split("T")[0],
        description: data.description || "",
        status: data.status,
      })
    } catch (error: any) {
      showErrorToast("Erro", error.response?.data?.message || "Recibo não encontrado")
      router.push("/dashboard/receipts")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateBr = (dateString: string) =>
    format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount))

  const handleSave = async () => {
    if (!receipt) return

    setIsSaving(true)
    try {
      const updated = await healthReceiptService.update(receipt.id, {
        payer_cpf: form.payer_cpf || null,
        payer_is_beneficiary: form.payer_is_beneficiary,
        beneficiary_cpf: form.beneficiary_cpf || null,
        service_date: form.service_date,
        description: form.description || null,
        status: form.status,
      })
      setReceipt(updated)
      setForm((f) => ({ ...f, status: updated.status }))
      setEditMode(false)
      showSuccessToast("Salvo", "Recibo de Saúde atualizado com sucesso")
    } catch (error: any) {
      showErrorToast("Erro ao salvar", error.response?.data?.message || "Tente novamente")
    } finally {
      setIsSaving(false)
    }
  }

  const handleIssue = async () => {
    if (!receipt || !proofFile) {
      showErrorToast("Erro", "Selecione o comprovante do Carnê-leão")
      return
    }

    console.log("[Recibo Saúde] Iniciando emissão", {
      receiptId: receipt.id,
      fileName: proofFile.name,
      fileSize: proofFile.size,
      fileType: proofFile.type,
    })

    setIsIssuing(true)
    try {
      const updated = await healthReceiptService.issue(receipt.id, proofFile)
      console.log("[Recibo Saúde] Emissão concluída com sucesso", updated)
      setReceipt(updated)
      setProofFile(null)
      showSuccessToast("Emitido", "Recibo de Saúde marcado como emitido")
    } catch (error: any) {
      const status = error.response?.status
      const serverMessage = error.response?.data?.message
      const localMessage = error.message
      console.error("[Recibo Saúde] Erro ao emitir", {
        status,
        serverMessage,
        localMessage,
        responseData: error.response?.data,
        error,
      })
      showErrorToast(
        `Erro ao emitir${status ? ` (${status})` : ""}`,
        serverMessage || localMessage || "Erro desconhecido — verifique o console"
      )
      return
    } finally {
      setIsIssuing(false)
    }
  }

  const handleDownloadProof = async () => {
    if (!receipt) return
    try {
      await healthReceiptService.downloadProof(receipt.id)
    } catch (error: any) {
      showErrorToast("Erro", error.response?.data?.message || "Não foi possível baixar o comprovante")
    }
  }

  if (isLoading || !receipt) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  const isPending = receipt.status === "pending"
  const showEditForm = isPending || editMode

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/receipts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Recibo Saúde</h1>
            <p className="text-sm text-muted-foreground">
              {receipt.payment?.patient?.name} • {receipt.payment?.receipt_number}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={
              isPending
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }
          >
            {HEALTH_RECEIPT_STATUS_LABELS[receipt.status]}
          </Badge>
          {!isPending && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode((v) => !v)}
              className="gap-1.5"
            >
              {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editMode ? "Cancelar" : "Editar"}
            </Button>
          )}
        </div>

        {receipt.missing_cpf && isPending && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">CPF ausente</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Preencha o CPF do pagador e beneficiário antes de emitir no Carnê-leão.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Coluna esquerda — dados para copiar */}
          <Card>
            <CardHeader>
              <CardTitle>Dados para o Carnê-leão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CopyField label="CPF do Pagador" value={form.payer_cpf} />
              <CopyField
                label="Pagador é o beneficiário do serviço"
                value={form.payer_is_beneficiary ? "Sim" : "Não"}
              />
              <CopyField label="CPF do Beneficiário do Serviço" value={form.beneficiary_cpf} />
              <CopyField label="Valor (R$)" value={formatCurrency(receipt.amount)} />
              <CopyField label="Data do Pagamento" value={formatDateBr(receipt.payment_date)} />
            <CopyField label="Descrição" value={form.description} />
              <CopyField label="Data do Atendimento" value={formatDateBr(form.service_date)} />
            </CardContent>
          </Card>

          {/* Coluna direita — edição + upload */}
          <div className="space-y-6">
            {showEditForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Ajustar dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="payer_cpf">CPF do Pagador</Label>
                      <Input
                        id="payer_cpf"
                        value={form.payer_cpf}
                        onChange={(e) => setForm((f) => ({ ...f, payer_cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary_cpf">CPF do Beneficiário</Label>
                      <Input
                        id="beneficiary_cpf"
                        value={form.beneficiary_cpf}
                        onChange={(e) => setForm((f) => ({ ...f, beneficiary_cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                        disabled={form.payer_is_beneficiary}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="payer_is_beneficiary"
                      checked={form.payer_is_beneficiary}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({
                          ...f,
                          payer_is_beneficiary: checked === true,
                          beneficiary_cpf: checked === true ? f.payer_cpf : f.beneficiary_cpf,
                        }))
                      }
                    />
                    <Label htmlFor="payer_is_beneficiary">Pagador é o beneficiário do serviço</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_date">Data do Atendimento</Label>
                    <Input
                      id="service_date"
                      type="date"
                      value={form.service_date}
                      onChange={(e) => setForm((f) => ({ ...f, service_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  {/* Status — só aparece no modo edição de emitidos */}
                  {!isPending && editMode && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => setForm((f) => ({ ...f, status: v as HealthReceiptStatus }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="issued">Emitido</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.status === "pending" && receipt.status === "issued" && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Ao salvar como Pendente, o comprovante atual será removido.
                        </p>
                      )}
                    </div>
                  )}

                  <Button onClick={handleSave} disabled={isSaving} variant="outline" className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upload do comprovante */}
            {isPending && (
              <Card className="border-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Subir comprovante do Carnê-leão
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Após emitir no gov.br, selecione o arquivo aqui. O paciente poderá baixá-lo no portal como <strong>Recibo de Saúde</strong>.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/10 cursor-pointer"
                    onClick={() => document.getElementById("proof-upload")?.click()}
                  >
                    <Upload className="mb-3 h-8 w-8 text-primary/60" />
                    {proofFile ? (
                      <p className="text-sm font-medium text-foreground">{proofFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Clique para selecionar o arquivo</p>
                        <p className="mt-1 text-xs text-muted-foreground">PDF, JPG ou PNG • máx. 10 MB</p>
                      </>
                    )}
                  </div>
                  <input
                    id="proof-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    className="w-full"
                    onClick={handleIssue}
                    disabled={isIssuing || !proofFile}
                  >
                    {isIssuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar emissão e disponibilizar para o paciente
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isPending && receipt.proof_path && (
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">Comprovante emitido</p>
                    <p className="text-sm text-muted-foreground">
                      Emitido em {receipt.issued_at ? formatDateBr(receipt.issued_at) : "—"}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadProof}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar comprovante
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  )
}
