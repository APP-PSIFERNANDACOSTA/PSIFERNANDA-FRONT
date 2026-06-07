"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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

interface FormState {
  title: string
  description: string
  amount: string
  payment_method: PaymentMethod
  payment_date: string
}

export default function EditCostPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    amount: "",
    payment_method: "pix",
    payment_date: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        const expense = await expenseService.getById(id)
        setForm({
          title: expense.title,
          description: expense.description,
          amount: expense.amount,
          payment_method: (expense.payment_method as PaymentMethod) || "pix",
          payment_date: expense.payment_date ?? new Date().toISOString().split("T")[0],
        })
      } catch (error: any) {
        showErrorToast("Erro ao carregar custo", error.response?.data?.message || "Tente novamente mais tarde")
        router.push("/dashboard/costs")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleUpdateExpense = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      await expenseService.update(id, {
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        payment_method: form.payment_method || "pix",
        payment_date: form.payment_date || null,
      })
      showSuccessToast("Custo atualizado", "As alterações foram salvas com sucesso.")
      router.push("/dashboard/costs")
    } catch (error: any) {
      showErrorToast("Erro ao atualizar custo", error.response?.data?.message || "Verifique os dados e tente novamente")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Custo</h1>
          <p className="text-muted-foreground mt-2">Atualize os dados do lançamento.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edição de custo</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleUpdateExpense}>
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
                <Label htmlFor="payment_date">Data da saída</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, payment_date: e.target.value }))}
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
                  Salvar alterações
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
