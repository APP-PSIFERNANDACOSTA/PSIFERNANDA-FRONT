"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, TrendingUp, DollarSign, CheckCircle2, Clock, BookOpen, Loader2, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import patientService from "@/services/patient-service"
import sessionService from "@/services/session-service"
import paymentService from "@/services/payment-service"
import { showErrorToast } from "@/lib/toast-helpers"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isSameDay, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Session } from "@/types/session"
import type { Payment } from "@/types/payment"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activePatientsCount, setActivePatientsCount] = useState(0)
  const [thisMonthPatientsCount, setThisMonthPatientsCount] = useState(0)
  const [thisWeekSessionsCount, setThisWeekSessionsCount] = useState(0)
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0)
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [monthSessionsStats, setMonthSessionsStats] = useState({
    completed: 0,
    cancelled: 0,
    no_show: 0,
    rescheduled: 0,
  })
  const [averageSessionValue, setAverageSessionValue] = useState(0)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [privacyMode, setPrivacyMode] = useState(false)

  useEffect(() => {
    loadDashboardData()
    // Carregar preferência de privacidade do localStorage (apenas no cliente)
    if (typeof window !== 'undefined') {
      try {
        const savedPrivacyMode = localStorage.getItem('dashboard-privacy-mode') === 'true'
        setPrivacyMode(savedPrivacyMode)
      } catch (error) {
        console.error('Erro ao carregar preferência de privacidade:', error)
      }
    }
  }, [])

  // Função helper para mascarar nomes (mostrar apenas 2 primeiras letras)
  const maskName = (name: string | undefined | null): string => {
    if (!name) return 'N/A'
    if (privacyMode && name.length > 2) {
      return name.substring(0, 2) + '*'.repeat(Math.min(name.length - 2, 10))
    }
    return name
  }

  // Função para mascarar valores monetários
  const maskValue = (value: string | number): string => {
    if (privacyMode) return 'R$ •••'
    return typeof value === 'number' ? formatCurrency(value) : value
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // Função helper para tratar erros individualmente
    const handleError = (error: any, context: string) => {
      console.error(`❌ Erro ao carregar ${context}:`, error)
      if (error?.response?.status === 500) {
        const url = error?.config?.url || 'URL desconhecida'
        const method = error?.config?.method?.toUpperCase() || 'GET'
        console.error(`🔴 Erro 500 em ${context}:`, {
          url: url,
          method: method,
          endpoint: `${method} ${url}`,
          responseData: error?.response?.data,
          fullError: error,
        })
        
        // Mostrar toast apenas para erros críticos
        if (context === 'sessões do mês' || context === 'pagamentos do mês') {
          showErrorToast(
            `Erro ao carregar ${context}`,
            `Erro 500 no endpoint: ${method} ${url}. Verifique os logs do backend.`
          )
        }
      } else if (error?.response?.status) {
        console.error(`⚠️ Erro ${error.response.status} em ${context}:`, {
          url: error?.config?.url,
          method: error?.config?.method,
          message: error?.response?.data?.message,
        })
      }
    }

    // Carregar pacientes ativos (com tratamento individual de erro)
    try {
      const patientsResponse = await patientService.getAll({ status: 'active', per_page: 1000 })
      const activePatients = patientsResponse.patients?.data || (Array.isArray(patientsResponse.patients) ? patientsResponse.patients : [])
      setActivePatientsCount(activePatients.length)

      // Calcular pacientes criados este mês
      const thisMonthPatients = activePatients.filter((p: any) => {
        const createdAt = new Date(p.created_at)
        return createdAt >= thisMonthStart
      })
      setThisMonthPatientsCount(thisMonthPatients.length)
    } catch (error: any) {
      handleError(error, 'pacientes')
      setActivePatientsCount(0)
      setThisMonthPatientsCount(0)
    }

    // Carregar sessões desta semana (com tratamento individual de erro)
    try {
      const weekSessions = await sessionService.getAllSessions({
        start_date: weekStart.toISOString(),
        end_date: weekEnd.toISOString(),
      })
      setThisWeekSessionsCount(weekSessions.length)
    } catch (error: any) {
      handleError(error, 'sessões da semana')
      setThisWeekSessionsCount(0)
    }

    // Carregar sessões do mês (com tratamento individual de erro)
    let lastMonthSessions: Session[] = []
    try {
      lastMonthSessions = await sessionService.getAllSessions({
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
      })
      
      // Calcular taxa de comparecimento
      const completedSessions = lastMonthSessions.filter(s => s.status === 'completed').length
      const scheduledSessions = lastMonthSessions.filter(s => s.status === 'scheduled' || s.status === 'completed').length
      const rate = scheduledSessions > 0 ? Math.round((completedSessions / scheduledSessions) * 100) : 0
      setAttendanceRate(rate)

      // Calcular estatísticas de sessões do mês
      const completedCount = lastMonthSessions.filter(s => s.status === 'completed').length
      const cancelledCount = lastMonthSessions.filter(s => s.status === 'cancelled').length
      const noShowCount = lastMonthSessions.filter(s => s.status === 'no_show').length
      const rescheduledCount = lastMonthSessions.filter(s => s.status === 'rescheduled').length
      
      setMonthSessionsStats({
        completed: completedCount,
        cancelled: cancelledCount,
        no_show: noShowCount,
        rescheduled: rescheduledCount,
      })
    } catch (error: any) {
      handleError(error, 'sessões do mês')
      setAttendanceRate(0)
      setMonthSessionsStats({
        completed: 0,
        cancelled: 0,
        no_show: 0,
        rescheduled: 0,
      })
    }

    // Carregar faturamento mensal (com tratamento individual de erro)
    let revenue = 0
    try {
      const payments = await paymentService.getAll({
        start_date: monthStart.toISOString().split('T')[0],
        end_date: monthEnd.toISOString().split('T')[0],
      })
      revenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      setMonthlyRevenue(revenue)
    } catch (error: any) {
      handleError(error, 'pagamentos do mês')
      setMonthlyRevenue(0)
    }

    // Carregar faturamento do mês anterior (com tratamento individual de erro)
    try {
      const lastMonthPayments = await paymentService.getAll({
        start_date: lastMonthStart.toISOString().split('T')[0],
        end_date: lastMonthEnd.toISOString().split('T')[0],
      })
      const lastRevenue = lastMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      setLastMonthRevenue(lastRevenue)
    } catch (error: any) {
      handleError(error, 'pagamentos do mês anterior')
      setLastMonthRevenue(0)
    }

    // Calcular média de valor por sessão
    const completedCount = lastMonthSessions.filter(s => s.status === 'completed').length
    const avgValue = completedCount > 0 ? revenue / completedCount : 0
    setAverageSessionValue(avgValue)

    // Carregar sessões de hoje (com tratamento individual de erro)
    try {
      const allSessions = await sessionService.getAllSessions({
        start_date: now.toISOString().split('T')[0],
      })
      const today = allSessions.filter(s => {
        const sessionDate = new Date(s.session_date)
        return isSameDay(sessionDate, now) && (s.status === 'scheduled' || s.status === 'rescheduled')
      }).sort((a, b) => {
        return new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
      })
      setTodaySessions(today)
    } catch (error: any) {
      handleError(error, 'sessões de hoje')
      setTodaySessions([])
    }

    setIsLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: ptBR })
  }
  const kpis = [
    {
      title: "Pacientes Ativos",
      value: isLoading ? "..." : (privacyMode ? "•••" : activePatientsCount.toString()),
      change: privacyMode ? "" : (thisMonthPatientsCount > 0 ? `+${thisMonthPatientsCount} este mês` : "Sem novos pacientes"),
      icon: Users,
      color: "var(--color-primary-fixed)",
    },
    {
      title: "Consultas na Semana",
      value: isLoading ? "..." : (privacyMode ? "•••" : thisWeekSessionsCount.toString()),
      change: privacyMode ? "" : "Esta semana",
      icon: Calendar,
      color: "var(--color-primaryDark-fixed)",
    },
    {
      title: "Taxa de Comparecimento",
      value: isLoading ? "..." : (privacyMode ? "•••" : `${attendanceRate}%`),
      change: privacyMode ? "" : "Último mês",
      icon: TrendingUp,
      color: "#10B981",
    },
    {
      title: "Faturamento Mensal",
      value: isLoading ? "..." : (privacyMode ? "R$ •••" : formatCurrency(monthlyRevenue)),
      change: privacyMode ? "" : "Este mês",
      icon: DollarSign,
      color: "var(--color-primary-fixed)",
    },
  ]

  const quickActions = [
    {
      title: "Ver Diários",
      description: "Acessar diários de todos os pacientes",
      icon: BookOpen,
      href: "/dashboard/diary",
      color: "var(--color-primary-fixed)",
    },
    {
      title: "Agenda",
      description: "Gerenciar consultas e horários",
      icon: Calendar,
      href: "/schedule",
      color: "var(--color-primaryDark-fixed)",
    },
    {
      title: "Pacientes",
      description: "Visualizar e gerenciar pacientes",
      icon: Users,
      href: "/dashboard/patients",
      color: "#10B981",
    },
  ]


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground text-balance">Bem-vinda, Psi Fernanda!</h1>
            <p className="mt-1 text-muted-foreground">Aqui está um resumo da sua agenda e atividades de hoje</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const newPrivacyMode = !privacyMode
                setPrivacyMode(newPrivacyMode)
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.setItem('dashboard-privacy-mode', newPrivacyMode.toString())
                  } catch (error) {
                    console.error('Erro ao salvar preferência de privacidade:', error)
                  }
                }
              }}
              className="gap-2"
              title={privacyMode ? "Mostrar dados sensíveis" : "Ocultar dados sensíveis"}
            >
              {privacyMode ? (
                <>
                  <EyeOff className="h-5 w-5" />
                  Modo Privacidade
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  Ocultar Dados
                </>
              )}
            </Button>
            <Link href="/dashboard/schedule">
              <Button 
                size="lg" 
                className="gap-2"
                style={{ 
                  backgroundColor: 'var(--color-primary-fixed)',
                  color: 'white',
                  borderColor: 'var(--color-primary-fixed)'
                }}
              >
                <Calendar className="h-5 w-5" />
                Ver Agenda Completa
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <kpi.icon 
                  className="h-5 w-5" 
                  style={{ color: kpi.color }}
                />
              </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-semibold text-foreground">{kpi.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.change}</p>
                </>
              )}
            </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Tasks */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="border-border">
            <Collapsible open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Ações Rápidas
                    </CardTitle>
                    {quickActionsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-3 grid-cols-1">
                    {quickActions.map((action) => (
                      <Link key={action.title} href={action.href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                                style={{ backgroundColor: action.color }}
                              >
                                <action.icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-foreground text-sm">{action.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Tasks & Reminders */}
          <Card className="border-border">
            <Collapsible open={tasksOpen} onOpenChange={setTasksOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Tarefas & Lembretes
                    </CardTitle>
                    {tasksOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">Atualizar prontuário - Ana Paula</p>
                        <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Alta
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">Enviar relatório para convênio</p>
                        <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Média
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">Retornar contato - Novo paciente</p>
                        <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Alta
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">Preparar material para sessão de grupo</p>
                        <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          Baixa
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full bg-transparent">
                    Ver Todas as Tarefas
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2 border-border">
            <Collapsible open={sessionsOpen} onOpenChange={setSessionsOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                      <Calendar className="h-5 w-5 text-primary" />
                      Próximas Sessões - Hoje
                      {!isLoading && todaySessions.length > 0 && !privacyMode && (
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium ml-2">
                          {todaySessions.length} {todaySessions.length === 1 ? 'sessão' : 'sessões'}
                        </span>
                      )}
                    </CardTitle>
                    {sessionsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : todaySessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma sessão agendada para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {formatTime(session.session_date)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {maskName(session.patient?.name)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session.duration ? `${session.duration} min` : "Duração não definida"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end sm:min-w-[160px]">
                        {session.status === "scheduled" || session.status === "rescheduled" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <Link href={`/dashboard/patients/${session.patient_id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Additional Stats Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground dark:text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estatísticas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{privacyMode ? "•••" : monthSessionsStats.completed}</div>
                    <p className="text-xs text-muted-foreground">Sessões Realizadas</p>
                  </div>
                  {!privacyMode && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Faltas:</span>
                        <span className="font-semibold text-orange-600">{monthSessionsStats.no_show}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Canceladas:</span>
                        <span className="font-semibold text-red-600">{monthSessionsStats.cancelled}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Remarcadas:</span>
                        <span className="font-semibold text-purple-600">{monthSessionsStats.rescheduled}</span>
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-1">Receita do Mês Anterior</div>
                    <div className="text-lg font-semibold">{privacyMode ? "R$ •••" : formatCurrency(lastMonthRevenue)}</div>
                    {!privacyMode && lastMonthRevenue > 0 && (
                      <div className={`text-xs mt-1 ${
                        monthlyRevenue > lastMonthRevenue ? 'text-green-600' : 
                        monthlyRevenue < lastMonthRevenue ? 'text-red-600' : 
                        'text-muted-foreground'
                      }`}>
                        {monthlyRevenue > lastMonthRevenue ? '↑' : monthlyRevenue < lastMonthRevenue ? '↓' : '→'} 
                        {' '}
                        {((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Cards Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Sessões Realizadas */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground dark:text-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Sessões Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">{privacyMode ? "•••" : monthSessionsStats.completed}</div>
                  <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                  {!privacyMode && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Faltas:</span>
                        <span className="font-medium text-orange-600">{monthSessionsStats.no_show}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Canceladas:</span>
                        <span className="font-medium text-red-600">{monthSessionsStats.cancelled}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Receita Comparativa */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground dark:text-foreground">
                <DollarSign className="h-5 w-5 text-green-600" />
                Receita Comparativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">{privacyMode ? "R$ •••" : formatCurrency(monthlyRevenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mês anterior:</span>
                      <span className="font-medium">{privacyMode ? "R$ •••" : formatCurrency(lastMonthRevenue)}</span>
                    </div>
                    {!privacyMode && lastMonthRevenue > 0 && (
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Variação:</span>
                        <span className={`font-medium ${
                          monthlyRevenue > lastMonthRevenue ? 'text-green-600' : 
                          monthlyRevenue < lastMonthRevenue ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {monthlyRevenue > lastMonthRevenue ? '+' : ''}
                          {((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Média por Sessão */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground dark:text-foreground">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Média por Sessão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">{privacyMode ? "R$ •••" : formatCurrency(averageSessionValue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Receita média</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    {!privacyMode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sessões realizadas:</span>
                        <span className="font-medium">{monthSessionsStats.completed}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Total recebido:</span>
                      <span className="font-medium text-green-600">{privacyMode ? "R$ •••" : formatCurrency(monthlyRevenue)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
