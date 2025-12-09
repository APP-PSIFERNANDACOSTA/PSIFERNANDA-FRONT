"use client"

import { Button } from "@/components/ui/button"
import { Clock, Video, MapPin } from "lucide-react"

interface SessionCardProps {
  session: {
    time: string
    patient: string
    type: "online" | "presencial"
    status: "confirmed" | "pending"
  }
  onViewDetails?: () => void
}

export function SessionCard({ session, onViewDetails }: SessionCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
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
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          Ver Detalhes
        </Button>
      </div>
    </div>
  )
}
