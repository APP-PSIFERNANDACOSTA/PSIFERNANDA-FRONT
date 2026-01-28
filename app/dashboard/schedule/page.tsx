"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarView } from "@/components/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { Session } from "@/types/session"
import sessionService from "@/services/session-service"
import googleOAuthService from "@/services/google-oauth-service"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { startOfMonth, endOfMonth } from "date-fns"
import { useSearchParams } from "next/navigation"

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionsStats, setSessionsStats] = useState({
    scheduled: 0,
    completed: 0,
    rescheduled: 0,
    no_show: 0,
    isLoading: true,
  })
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleExpired, setGoogleExpired] = useState(false)
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    loadSessionsStats()
    checkGoogleStatus()
    
    // Verificar se veio do callback do Google
    if (searchParams.get('google_connected') === 'true') {
      showSuccessToast("Google Calendar conectado!", "Suas sessões serão sincronizadas automaticamente")
      checkGoogleStatus()
      // Remover parâmetro da URL
      window.history.replaceState({}, '', '/dashboard/schedule')
    }
  }, [searchParams])

  const loadSessionsStats = async () => {
    try {
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      
      const sessions = await sessionService.getAllSessions({
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      })

      const stats = {
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        rescheduled: sessions.filter(s => s.status === 'rescheduled').length,
        no_show: sessions.filter(s => s.status === 'no_show').length,
        isLoading: false,
      }

      setSessionsStats(stats)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar estatísticas",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
      setSessionsStats(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
  }

  const checkGoogleStatus = async () => {
    try {
      setIsCheckingGoogle(true)
      const status = await googleOAuthService.getStatus()
      setGoogleConnected(status.connected)
      setGoogleExpired(status.expired)
    } catch (error: any) {
      console.error("Erro ao verificar status do Google:", error)
      setGoogleConnected(false)
      setGoogleExpired(false)
    } finally {
      setIsCheckingGoogle(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true)
      const authUrl = await googleOAuthService.getAuthUrl('dashboard/schedule')
      window.location.href = authUrl
    } catch (error: any) {
      console.error("Erro ao conectar Google Calendar:", error)
      showErrorToast(
        "Erro ao conectar",
        error?.message || "Não foi possível conectar com Google Calendar"
      )
      setIsConnecting(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm("Desconectar o Google Calendar? As sessões futuras não serão sincronizadas automaticamente.")) {
      return
    }
    try {
      setIsDisconnecting(true)
      await googleOAuthService.disconnect()
      setGoogleConnected(false)
      setGoogleExpired(false)
      showSuccessToast("Google Calendar desconectado", "A integração foi removida com sucesso")
    } catch (error: any) {
      console.error("Erro ao desconectar Google Calendar:", error)
      showErrorToast(
        "Erro ao desconectar",
        error?.message || "Não foi possível desconectar"
      )
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Agenda</h1>
              {!isCheckingGoogle && googleConnected && (
                <Badge variant="default" className="bg-green-500 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Google Calendar Conectado
                </Badge>
              )}
              {!isCheckingGoogle && googleExpired && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Conexão Expirada
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie todas as suas sessões em formato de calendário
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isCheckingGoogle && googleConnected && (
              <Button
                onClick={handleDisconnectGoogle}
                disabled={isDisconnecting}
                variant="outline"
                className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Desconectar Google Calendar
                  </>
                )}
              </Button>
            )}
            {!isCheckingGoogle && !googleConnected && (
              <Button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                variant="outline"
                className="gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Conectar Google Calendar
                  </>
                )}
              </Button>
            )}
            <Link href="/dashboard/patients">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Sessão
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats - Cards no topo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              {sessionsStats.isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">{sessionsStats.scheduled}</div>
                  <div className="text-sm font-medium text-blue-600 mt-1">Agendadas</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sessões confirmadas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {sessionsStats.isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">{sessionsStats.completed}</div>
                  <div className="text-sm font-medium text-green-600 mt-1">Realizadas</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sessões concluídas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {sessionsStats.isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-purple-600">{sessionsStats.rescheduled}</div>
                  <div className="text-sm font-medium text-purple-600 mt-1">Remarcadas</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sessões reagendadas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {sessionsStats.isLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-orange-600">{sessionsStats.no_show}</div>
                  <div className="text-sm font-medium text-orange-600 mt-1">Faltas</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pacientes que faltaram
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <CalendarView onSessionClick={handleSessionClick} />
      </div>
    </DashboardLayout>
  )
}

