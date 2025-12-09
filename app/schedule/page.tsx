"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock, Filter } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const weekSchedule = [
  {
    day: "Segunda, 15 Jan",
    sessions: [
      { time: "09:00", patient: "Ana Paula Santos", type: "presencial", status: "confirmed" },
      { time: "10:30", patient: "Carlos Eduardo Lima", type: "online", status: "confirmed" },
      { time: "14:00", patient: "Beatriz Oliveira", type: "presencial", status: "pending" },
    ],
  },
  {
    day: "Terça, 16 Jan",
    sessions: [
      { time: "09:00", patient: "João Pedro Costa", type: "online", status: "confirmed" },
      { time: "15:30", patient: "Maria Fernanda Silva", type: "presencial", status: "confirmed" },
    ],
  },
  {
    day: "Quarta, 17 Jan",
    sessions: [
      { time: "10:00", patient: "Ricardo Alves", type: "online", status: "confirmed" },
      { time: "14:00", patient: "Juliana Martins", type: "presencial", status: "pending" },
      { time: "16:00", patient: "Pedro Henrique", type: "presencial", status: "confirmed" },
    ],
  },
]

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground text-balance">Agenda</h1>
            <p className="mt-1 text-muted-foreground">Gerencie suas consultas e horários</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Agendar Sessão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Agendar Nova Sessão</DialogTitle>
                <DialogDescription>Preencha os dados para criar um novo agendamento</DialogDescription>
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
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input id="time" type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Atendimento</Label>
                  <Select>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input id="notes" placeholder="Notas adicionais (opcional)" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Confirmar Agendamento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-foreground">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
                  <TabsList>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {view === "week" ? (
          <div className="space-y-4">
            {weekSchedule.map((day, dayIndex) => (
              <Card key={dayIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">{day.day}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.sessions.map((session, sessionIndex) => (
                      <div
                        key={sessionIndex}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary/10">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="mt-1 text-sm font-semibold text-primary">{session.time}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{session.patient}</p>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              {session.type === "online" ? (
                                <>
                                  <Video className="h-4 w-4" />
                                  <span>Teleconsulta</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4" />
                                  <span>Presencial</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              session.status === "confirmed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {session.status === "confirmed" ? "Confirmada" : "Aguardando"}
                          </span>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                    {day.sessions.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
                        <p className="text-sm text-muted-foreground">Nenhuma sessão agendada</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentDate).map((day, index) => (
                  <div
                    key={index}
                    className={`relative min-h-24 rounded-lg border border-border p-2 ${
                      day ? "bg-card hover:bg-accent/50" : "bg-transparent"
                    }`}
                  >
                    {day && (
                      <>
                        <span className="text-sm font-medium text-foreground">{day}</span>
                        {(day === 15 || day === 16 || day === 17) && (
                          <div className="mt-1 space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-primary" />
                            {day === 17 && <div className="h-1.5 w-full rounded-full bg-secondary" />}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
