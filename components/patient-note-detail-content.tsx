"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Link2 } from "lucide-react"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS } from "@/types/session"
import type { PatientNote } from "@/types/patient-note"
import {
  DEFAULT_POST_THERAPY_TEMPLATE_LABEL,
  SESSION_META_FIELD_KEYS,
  STRUCTURED_FIELDS_ORDER,
  formatPostTherapyFieldLabel,
} from "@/types/patient-note"
import { cn } from "@/lib/utils"

export function getPatientNoteDisplayTitle(n: PatientNote): string {
  return (
    n.title?.trim() ||
    (n.kind === "structured"
      ? n.template_label || DEFAULT_POST_THERAPY_TEMPLATE_LABEL
      : "Anotação em texto livre")
  )
}

function formatSessionLine(s: Session) {
  const d = parseISO(s.session_date)
  const dt = format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
  const dur = s.duration != null ? ` · ${s.duration} min` : ""
  const st = SESSION_STATUS_LABELS[s.status] ?? String(s.status)
  return `${dt}${dur} (${st})`
}

/** Uma linha compacta (como na listagem): sessão ou textos salvos em data/hora/duração */
function getSessionMetaCompactLine(n: PatientNote): string | null {
  if (n.session_id && n.session) {
    return formatSessionLine(n.session as Session)
  }
  const b = n.body_structured
  if (!b) return null
  const parts = [b.session_date_label, b.session_time_label, b.duration_label]
    .map((s) => s?.trim())
    .filter(Boolean) as string[]
  return parts.length ? parts.join(" · ") : null
}

interface PatientNoteDetailContentProps {
  note: PatientNote
  className?: string
  /** Layout otimizado para o portal do paciente (mobile-first, uma coluna) */
  variant?: "default" | "portal"
}

/** Conteúdo completo da anotação (texto livre ou modelo), somente leitura */
export function PatientNoteDetailContent({
  note: n,
  className,
  variant = "default",
}: PatientNoteDetailContentProps) {
  const sessionLine = getSessionMetaCompactLine(n)
  const portal = variant === "portal"

  return (
    <div
      className={cn(
        portal ? "w-full min-w-0 space-y-5 text-base" : "space-y-4 text-sm",
        className
      )}
    >
      <p className={cn("text-muted-foreground", portal ? "text-sm" : "text-xs")}>
        {n.session_id ? "Sessão vinculada" : "Anotação geral"} · Atualizado{" "}
        {format(parseISO(n.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </p>

      {n.kind === "free_text" && n.session_id && n.session && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border border-primary/40 bg-background text-foreground leading-snug",
            portal ? "px-3.5 py-3 text-base" : "px-3 py-2 text-sm"
          )}
        >
          <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <span>{formatSessionLine(n.session as Session)}</span>
        </div>
      )}

      {n.kind === "free_text" && n.body_text && (
        <p
          className={cn(
            "whitespace-pre-wrap rounded-lg border border-border bg-background text-muted-foreground",
            portal ? "p-4 text-[15px] leading-relaxed" : "p-4"
          )}
        >
          {n.body_text}
        </p>
      )}

      {n.kind === "structured" && n.body_structured && (
        <>
          {sessionLine && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border border-primary/40 bg-background text-foreground leading-snug",
                portal ? "px-3.5 py-3 text-base" : "px-3 py-2 text-sm"
              )}
            >
              <Link2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              <span>{sessionLine}</span>
            </div>
          )}

          <div className={cn("grid gap-2", portal ? "grid-cols-1 gap-3" : "sm:grid-cols-2")}>
            {STRUCTURED_FIELDS_ORDER.filter((key) => !SESSION_META_FIELD_KEYS.has(key)).map(
              (key) => {
                const val = n.body_structured?.[key]
                if (!val?.trim()) return null
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-xl border bg-background",
                      portal
                        ? "border-primary/35 p-4 shadow-sm"
                        : "rounded-lg border-2 border-primary/40 p-3",
                      !portal && key === "discussion_summary" && "sm:col-span-2"
                    )}
                  >
                    <p
                      className={cn(
                        "font-medium text-foreground mb-2",
                        portal ? "text-sm text-primary" : "text-xs mb-1"
                      )}
                    >
                      {formatPostTherapyFieldLabel(key)}
                    </p>
                    <p
                      className={cn(
                        "whitespace-pre-wrap",
                        portal
                          ? "text-[15px] leading-relaxed text-foreground/90"
                          : "text-muted-foreground"
                      )}
                    >
                      {val}
                    </p>
                  </div>
                )
              }
            )}
          </div>
        </>
      )}
    </div>
  )
}
