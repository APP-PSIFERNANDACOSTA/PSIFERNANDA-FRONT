"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock, Download, Filter, Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const payments = [
  {
    id: 1,
    patient: "Ana Paula Santos",
    date: "10/01/2025",
    amount: 200,
    status: "paid",
    method: "Pix",
    type: "particular",
  },
  {
    id: 2,
    patient: "Carlos Eduardo Lima",
    date: "12/01/2025",
    amount: 180,
    status: "paid",
    method: "Cartão",
    type: "convenio",
  },
  {
    id: 3,
    patient: "Beatriz Oliveira",
    date: "15/01/2025",
    amount: 200,
    status: "pending",
    method: "Transferência",
    type: "particular",
  },
  {
    id: 4,
    patient: "João Pedro Costa",
    date: "08/01/2025",
    amount: 180,
    status: "overdue",
    method: "Pix",
    type: "convenio",
  },
  {
    id: 5,
    patient: "Maria Fernanda Silva",
    date: "16/01/2025",
    amount: 200,
    status: "pending",
    method: "Dinheiro",
    type: "particular",
  },
]

export default function FinanceiroPage() {
  const totalReceived = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground text-balance">Financeiro</h1>
            <p className="mt-1 text-muted-foreground">Controle de pagamentos e faturamento</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-5 w-5" />
              Exportar Relatório
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Registrar Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Pagamento</DialogTitle>
                  <DialogDescription>Adicione um novo registro de pagamento</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient">Paciente</Label>
                    <Select>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ana Paula Santos</SelectItem>
                        <SelectItem value="2">Carlos Eduardo Lima</SelectItem>
                        <SelectItem value="3">Beatriz Oliveira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor</Label>
                      <Input id="amount" type="number" placeholder="R$ 0,00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input id="date" type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Forma de Pagamento</Label>
                    <Select>
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particular">Particular</SelectItem>
                        <SelectItem value="convenio">Convênio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Confirmar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recebido (Mês)</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">R$ {totalReceived.toFixed(2)}</div>
              <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                +12% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">R$ {totalPending.toFixed(2)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {payments.filter((p) => p.status === "pending").length} pagamentos pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atrasados</CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">R$ {totalOverdue.toFixed(2)}</div>
              <p className="mt-1 text-xs text-red-600">
                {payments.filter((p) => p.status === "overdue").length} pagamentos em atraso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Previsto</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                R$ {(totalReceived + totalPending + totalOverdue).toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Total do mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução de Receita
              </CardTitle>
              <Tabs defaultValue="6months">
                <TabsList>
                  <TabsTrigger value="3months">3 meses</TabsTrigger>
                  <TabsTrigger value="6months">6 meses</TabsTrigger>
                  <TabsTrigger value="year">Ano</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border">
              <p className="text-muted-foreground">Gráfico de evolução de receita</p>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pagamentos Recentes</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="paid">Pagos</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        payment.status === "paid"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : payment.status === "overdue"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-yellow-100 dark:bg-yellow-900/30"
                      }`}
                    >
                      {payment.status === "paid" ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : payment.status === "overdue" ? (
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payment.patient}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{payment.date}</span>
                        <span>•</span>
                        <span>{payment.method}</span>
                        <span>•</span>
                        <span className="capitalize">{payment.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">R$ {payment.amount.toFixed(2)}</p>
                      <p
                        className={`text-xs font-medium ${
                          payment.status === "paid"
                            ? "text-green-600 dark:text-green-400"
                            : payment.status === "overdue"
                              ? "text-red-600 dark:text-red-400"
                              : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {payment.status === "paid" ? "Pago" : payment.status === "overdue" ? "Atrasado" : "Pendente"}
                      </p>
                    </div>
                    {payment.status !== "paid" && (
                      <Button variant="outline" size="sm">
                        Marcar como Pago
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insurance Reimbursements */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Convênios vs Particular</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-border">
                <p className="text-muted-foreground">Gráfico de pizza - Distribuição de receita</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reembolsos de Convênio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Unimed - Janeiro</p>
                    <p className="text-xs text-muted-foreground">5 sessões</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">R$ 900,00</p>
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Aguardando</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Bradesco - Janeiro</p>
                    <p className="text-xs text-muted-foreground">3 sessões</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">R$ 540,00</p>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Recebido</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
