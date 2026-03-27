"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  NotebookPen,
  Plus,
  Trash2,
  Loader2,
  FileText,
  LayoutTemplate,
  Eye,
  Pencil,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import patientNoteService from "@/services/patient-note-service"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS } from "@/types/session"
import type { PatientNote, PatientNotesListMeta } from "@/types/patient-note"
import { getPatientNoteDisplayTitle } from "@/components/patient-note-detail-content"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

const NOTES_PER_PAGE = 15

interface PatientNotesProps {
  patientId: number
}

function formatSessionLine(s: Session) {
  const d = parseISO(s.session_date)
  const dt = format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
  const dur = s.duration != null ? ` · ${s.duration} min` : ""
  const st = SESSION_STATUS_LABELS[s.status] ?? String(s.status)
  return `${dt}${dur} (${st})`
}

export function PatientNotes({ patientId }: PatientNotesProps) {
  const [notes, setNotes] = useState<PatientNote[]>([])
  const [meta, setMeta] = useState<PatientNotesListMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
    setMeta(null)
    setNotes([])
  }, [patientId])

  const loadNotes = useCallback(async () => {
    setLoading(true)
    try {
      const { data, meta: m } = await patientNoteService.list(patientId, {
        page,
        per_page: NOTES_PER_PAGE,
      })
      setNotes(data)
      setMeta(m)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      showErrorToast("Erro ao carregar anotações", err.response?.data?.message || "Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [patientId, page])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await patientNoteService.delete(patientId, deleteId)
      showSuccessToast("Anotação excluída", "")
      setDeleteId(null)
      const { data, meta: m } = await patientNoteService.list(patientId, {
        page,
        per_page: NOTES_PER_PAGE,
      })
      if (data.length === 0 && page > 1) {
        setPage((p) => p - 1)
      } else {
        setNotes(data)
        setMeta(m)
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      showErrorToast("Erro ao excluir", err.response?.data?.message || "Tente novamente.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            Anotações
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lista resumida. <strong className="font-medium text-foreground">Ver</strong> para leitura,{" "}
            <strong className="font-medium text-foreground">Editar</strong> para alterar.
          </p>
        </div>
        <Button className="gap-2 shrink-0" asChild>
          <Link href={`/dashboard/patients/${patientId}/notes/new`}>
            <Plus className="h-4 w-4" />
            Nova anotação
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : meta && meta.total === 0 ? (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="py-12 text-center text-muted-foreground">
            <NotebookPen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground">Nenhuma anotação ainda</p>
            <p className="text-sm mt-1 max-w-md mx-auto">
              Crie uma anotação em texto livre ou use o modelo com campos (síntese, frase, recursos, etc.).
            </p>
            <Button variant="outline" className="mt-4 gap-2" asChild>
              <Link href={`/dashboard/patients/${patientId}/notes/new`}>
                <Plus className="h-4 w-4" />
                Criar primeira anotação
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Título</TableHead>
                <TableHead className="w-[120px]">Tipo</TableHead>
                <TableHead className="min-w-[200px] hidden md:table-cell">Sessão</TableHead>
                <TableHead className="w-[130px] hidden lg:table-cell">Atualizado</TableHead>
                <TableHead className="min-w-[200px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="max-w-[min(100vw,280px)] sm:max-w-[220px]">
                    <div className="font-medium truncate">{getPatientNoteDisplayTitle(n)}</div>
                    {n.session_id && n.session && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2 md:hidden">
                        {formatSessionLine(n.session as Session)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1 font-normal whitespace-nowrap">
                      {n.kind === "structured" ? (
                        <>
                          <LayoutTemplate className="h-3 w-3" />
                          Modelo
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3" />
                          Texto livre
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {n.session_id && n.session ? (
                      <span className="line-clamp-2">{formatSessionLine(n.session as Session)}</span>
                    ) : (
                      <span className="text-muted-foreground/80">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                    {format(parseISO(n.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" className="gap-1 h-8" asChild>
                        <Link href={`/dashboard/patients/${patientId}/notes/${n.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 h-8" asChild>
                        <Link href={`/dashboard/patients/${patientId}/notes/${n.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(n.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meta && meta.last_page > 1 && (
            <CardContent className="pt-4 pb-4 border-t">
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onPageChange={setPage}
                totalItems={meta.total}
                itemsPerPage={meta.per_page}
                showInfo
              />
            </CardContent>
          )}
        </Card>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A anotação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
