"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import expenseService from "@/services/expense-service"
import type { Expense } from "@/types/expense"
import { EXPENSE_STATUS_LABELS } from "@/types/expense"
import { PAYMENT_METHOD_LABELS } from "@/types/payment"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const STATUS_COLORS = {
  pago: "bg-green-50 text-green-700 border-green-200",
}

export default function CostsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadExpenses = async () => {
    setIsLoading(true)
    try {
      const data = await expenseService.getAll({
        search: search || undefined,
      })
      setExpenses(data)
    } catch (error: any) {
      showErrorToast("Erro ao carregar custos", error.response?.data?.message || "Tente novamente mais tarde")
      setExpenses([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount))

  const formatDate = (dateString: string) =>
    format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })

  const filteredExpenses = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    if (!searchTerm) return expenses
    return expenses.filter(
      (expense) =>
        expense.title.toLowerCase().includes(searchTerm) ||
        expense.description.toLowerCase().includes(searchTerm)
    )
  }, [expenses, search])

  const handleDelete = async (expense: Expense) => {
    try {
      await expenseService.delete(expense.id)
      showSuccessToast("Custo removido", "O lançamento foi excluído com sucesso.")
      await loadExpenses()
    } catch (error: any) {
      showErrorToast("Erro ao remover custo", error.response?.data?.message || "Tente novamente")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custos de Saída</h1>
          <p className="text-muted-foreground mt-2">Acompanhe e filtre os lançamentos de custos.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Lançamentos</CardTitle>
              <div className="flex items-center gap-2">
                <Button asChild className="gap-2">
                  <Link href="/dashboard/costs/create">
                    <Plus className="h-4 w-4" />
                    Novo custo
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={loadExpenses} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Buscar título ou descrição"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="secondary" onClick={loadExpenses}>Aplicar filtros</Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">Nenhum custo encontrado.</p>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{expense.title}</p>
                          <Badge variant="outline" className={STATUS_COLORS[expense.status]}>
                            {EXPENSE_STATUS_LABELS[expense.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {expense.description}
                        </p>
                        {expense.payment_method && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Forma: {PAYMENT_METHOD_LABELS[expense.payment_method as keyof typeof PAYMENT_METHOD_LABELS] ?? expense.payment_method}
                          </p>
                        )}
                        {expense.payment_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Pago em: {formatDate(expense.payment_date)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="font-semibold min-w-[120px] text-right">{formatCurrency(expense.amount)}</p>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(expense)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
