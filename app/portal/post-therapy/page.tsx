"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, NotebookPen, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import patientNoteService from "@/services/patient-note-service"
import type { PatientNote, PatientNotesListMeta } from "@/types/patient-note"
import { getPatientNoteDisplayTitle } from "@/components/patient-note-detail-content"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS } from "@/types/session"
import { showErrorToast } from "@/lib/toast-helpers"

const PER_PAGE = 15

function formatSessionLine(s: Session) {
  const d = parseISO(s.session_date)
  const dt = format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
  const dur = s.duration != null ? ` · ${s.duration} min` : ""
  const st = SESSION_STATUS_LABELS[s.status] ?? String(s.status)
  return `${dt}${dur} (${st})`
}

export default function PortalPostTherapyPage() {
  const [notes, setNotes] = useState<PatientNote[]>([])
  const [meta, setMeta] = useState<PatientNotesListMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, meta: m } = await patientNoteService.listMyPortalPostTherapy({
        page,
        per_page: PER_PAGE,
      })
      setNotes(data)
      setMeta(m)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      showErrorToast(
        "Não foi possível carregar",
        err.response?.data?.message || "Tente novamente em instantes."
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="w-full min-w-0 max-w-none space-y-5 sm:space-y-6 pb-2">
      <div className="w-full">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Pós-terapia
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Resumos após suas sessões. Toque em{" "}
          <span className="font-medium text-foreground">Ver</span> para o conteúdo completo.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando…</span>
        </div>
      ) : meta && meta.total === 0 ? (
        <Card className="border-border/60 bg-muted/20 shadow-none">
          <CardContent className="py-8 sm:py-10 px-4 text-center">
            <NotebookPen className="h-9 w-9 mx-auto mb-3 text-primary/45" />
            <p className="text-sm font-medium text-foreground">Nenhuma pós-terapia ainda</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
              Quando sua psicóloga registrar um resumo após uma sessão, ele aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="space-y-2 sm:space-y-2.5 w-full">
            {notes.map((n) => (
              <li key={n.id} className="w-full min-w-0">
                <Card className="overflow-hidden border-border/50 bg-card shadow-none transition-colors hover:bg-muted/30 active:bg-muted/40 rounded-lg w-full">
                  <CardContent className="p-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center w-full min-w-0">
                      <div className="flex-1 min-w-0 px-3 py-3 sm:px-4 sm:py-3 md:pr-3">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <NotebookPen className="h-4 w-4 text-primary" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-[15px] text-foreground leading-snug break-words">
                              {getPatientNoteDisplayTitle(n)}
                            </p>
                            {n.session && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-snug">
                                {formatSessionLine(n.session as Session)}
                              </p>
                            )}
                            <p className="text-[11px] sm:text-xs text-muted-foreground/90 mt-1">
                              Atualizado{" "}
                              {format(parseISO(n.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-t sm:border-t-0 sm:border-l border-border/60 px-3 py-2.5 sm:px-3 sm:py-3 md:pl-3 shrink-0 sm:items-center sm:justify-end bg-muted/10 sm:bg-transparent sm:min-w-[5.5rem]">
                        <Button
                          size="sm"
                          className="w-full sm:w-auto h-8 gap-1 rounded-md px-3 text-xs font-medium"
                          asChild
                        >
                          <Link href={`/portal/post-therapy/${n.id}`}>
                            Ver
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          {meta && meta.last_page > 1 && (
            <div className="pt-2 w-full overflow-x-auto">
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onPageChange={setPage}
                totalItems={meta.total}
                itemsPerPage={meta.per_page}
                showInfo
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
