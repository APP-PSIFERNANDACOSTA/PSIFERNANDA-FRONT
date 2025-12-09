import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, FileText, TrendingUp, Users, Calendar } from "lucide-react"

export default function RelatoriosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground text-balance">Relatórios</h1>
            <p className="mt-1 text-muted-foreground">Análises e estatísticas da sua prática clínica</p>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-base">Relatório de Pacientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Estatísticas de pacientes ativos, novos e inativos</p>
              <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/20">
                  <Calendar className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-base">Relatório de Atendimentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Análise de sessões realizadas e taxa de comparecimento</p>
              <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-base">Relatório Financeiro</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Receitas, despesas e análise de faturamento</p>
              <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-base">Relatório Clínico</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Evolução de tratamentos e diagnósticos</p>
              <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/20">
                  <BarChart3 className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-base">Relatório de Produtividade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Horas trabalhadas e eficiência de agenda</p>
              <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-base">Relatório Personalizado</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Crie relatórios customizados com filtros específicos</p>
              <Button variant="outline" className="mt-4 w-full gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Criar Relatório
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Relatório Financeiro - Janeiro 2025</p>
                    <p className="text-sm text-muted-foreground">Gerado em 10/01/2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Relatório de Atendimentos - Dezembro 2024</p>
                    <p className="text-sm text-muted-foreground">Gerado em 05/01/2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
