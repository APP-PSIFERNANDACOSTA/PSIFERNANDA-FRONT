"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Cake, Loader2, Calendar, User, Mail, Phone, Gift } from "lucide-react"
import patientService from "@/services/patient-service"
import type { UpcomingBirthday } from "@/types/patient"
import { showErrorToast } from "@/lib/toast-helpers"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function BirthdaysPage() {
  const [days, setDays] = useState(60)
  const [items, setItems] = useState<UpcomingBirthday[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = async (windowDays: number) => {
    setIsLoading(true)
    try {
      const res = await patientService.getUpcomingBirthdays(windowDays)
      if (res.success) {
        setItems(res.birthdays)
      }
    } catch (e: any) {
      showErrorToast(
        "Erro ao carregar aniversariantes",
        e?.response?.data?.message || "Tente novamente."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load(days)
  }, [days])

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Cake className="h-7 w-7 text-primary" />
              Aniversariantes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Só entram pacientes ativos com data de nascimento cadastrada.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Próximos</span>
            <Select
              value={String(days)}
              onValueChange={(v) => setDays(Number(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card className="w-full border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/10">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">Nenhum aniversário neste período</p>
              <p className="text-sm mt-1 max-w-2xl mx-auto text-center">
                Cadastre a data de nascimento nos pacientes para aparecerem aqui. Pacientes sem data não entram
                na lista.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((row) => (
              <Card
                key={`${row.patient_id}-${row.next_birthday}`}
                className={cn(
                  "w-full",
                  row.days_until === 0
                    ? "border-primary/55 bg-primary/15 dark:border-primary/50 dark:bg-primary/25"
                    : row.days_until <= 7
                      ? "border-primary/40 bg-primary/10 dark:border-primary/35 dark:bg-primary/18"
                      : "border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/10"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Link
                          href={`/dashboard/patients/${row.patient_id}`}
                          className="font-semibold text-foreground hover:underline truncate"
                        >
                          {row.name}
                        </Link>
                        {row.days_until === 0 ? (
                          <Badge className="bg-primary text-primary-foreground">Hoje</Badge>
                        ) : row.days_until <= 7 ? (
                          <Badge variant="secondary">Em {row.days_until} dia(s)</Badge>
                        ) : (
                          <Badge variant="outline">Em {row.days_until} dias</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(row.next_birthday), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Cake className="h-3.5 w-3.5" />
                          Completa {row.age_turning} anos
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {row.email && (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-full">
                            <Mail className="h-3 w-3 shrink-0" />
                            {row.email}
                          </span>
                        )}
                        {row.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {row.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 w-full sm:w-auto">
                      <Link href={`/dashboard/patients/${row.patient_id}`}>Ver paciente</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
