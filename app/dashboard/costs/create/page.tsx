"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import expenseService from "@/services/expense-service"
import type { PaymentMethod } from "@/types/payment"
import { PAYMENT_METHOD_LABELS } from "@/types/payment"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

const initialForm = {
  title: "",
  description: "",
  amount: "",
  payment_method: "pix" as PaymentMethod,
}

export default function CreateCostPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  const handleCreateExpense = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      await expenseService.create({
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        payment_method: form.payment_method || "pix",
      })
      showSuccessToast("Custo cadastrado", "O lançamento foi salvo com sucesso.")
      router.push("/dashboard/costs")
    } catch (error: any) {
      showErrorToast("Erro ao salvar custo", error.response?.data?.message || "Verifique os dados e tente novamente")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Custo</h1>
          <p className="text-muted-foreground mt-2">Cadastre uma saída para refletir no financeiro.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastro de custo</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateExpense}>
              <div className="space-y-2">
                <Label htmlFor="title">Título do custo</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do custo</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de pagamento</Label>
                <Select
                  value={form.payment_method}
                  onValueChange={(value: PaymentMethod) => setForm((prev) => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <Button type="submit" className="gap-2" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar custo
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/costs")}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
