"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarView } from "@/components/calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { Session } from "@/types/session"
import sessionService from "@/services/session-service"
import { showErrorToast } from "@/lib/toast-helpers"
import { startOfMonth, endOfMonth } from "date-fns"

export default function SchedulePage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionsStats, setSessionsStats] = useState({
    scheduled: 0,
    completed: 0,
    rescheduled: 0,
    no_show: 0,
    isLoading: true,
  })

  useEffect(() => {
    loadSessionsStats()
  }, [])

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie todas as suas sessões em formato de calendário
            </p>
          </div>
          <Link href="/dashboard/patients">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Sessão
            </Button>
          </Link>
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

