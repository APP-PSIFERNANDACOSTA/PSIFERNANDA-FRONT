"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, FileText, LayoutTemplate, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import patientNoteService from "@/services/patient-note-service"
import sessionService from "@/services/session-service"
import type { Session } from "@/types/session"
import { SESSION_STATUS_LABELS } from "@/types/session"
import type { PatientNoteKind, PostTherapyStructured } from "@/types/patient-note"
import {
  DEFAULT_POST_THERAPY_TEMPLATE_LABEL,
  formatPostTherapyFieldLabel,
  SESSION_META_FIELD_KEYS,
  STRUCTURED_FIELDS_ORDER,
  emptyPostTherapyBody,
} from "@/types/patient-note"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { cn } from "@/lib/utils"

export interface PatientNoteFormProps {
  patientId: number
  noteId?: number
  patientName?: string | null
}

function mergeStructured(raw: PostTherapyStructured | null | undefined): PostTherapyStructured {
  return { ...emptyPostTherapyBody(), ...(raw || {}) }
}

function prefillFromSession(s: Session, base: PostTherapyStructured): PostTherapyStructured {
  const d = parseISO(s.session_date)
  return {
    ...base,
    session_date_label: format(d, "EEEE, d 'de' MMMM yyyy", { locale: ptBR }),
    session_time_label: format(d, "HH:mm"),
    duration_label: s.duration != null ? `${s.duration} min` : base.duration_label,
  }
}

/** Linha do select: data/hora, duração e status em português */
function formatSessionOption(s: Session) {
  const d = parseISO(s.session_date)
  const dt = format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
  const dur = s.duration != null ? `${s.duration} min` : "—"
  const st = SESSION_STATUS_LABELS[s.status] ?? String(s.status)
  return `${dt} · ${dur} · ${st}`
}

/** Próxima sessão futura (agendada ou remarcada), ordenada por data */
function findNextScheduledSession(sessions: Session[]): Session | null {
  const now = Date.now()
  const eligible = sessions
    .filter((s) => s.status === "scheduled" || s.status === "rescheduled")
    .filter((s) => parseISO(s.session_date).getTime() >= now)
    .sort((a, b) => parseISO(a.session_date).getTime() - parseISO(b.session_date).getTime())
  return eligible[0] ?? null
}

export function PatientNoteForm({ patientId, noteId, patientName }: PatientNoteFormProps) {
  const router = useRouter()
  const isEdit = noteId != null

  const [loadingNote, setLoadingNote] = useState(isEdit)
  const [sessions, setSessions] = useState<Session[]>([])
  const [saving, setSaving] = useState(false)

  const [kind, setKind] = useState<PatientNoteKind>("free_text")
  const [title, setTitle] = useState("")
  const [templateLabel, setTemplateLabel] = useState(DEFAULT_POST_THERAPY_TEMPLATE_LABEL)
  const [sessionId, setSessionId] = useState<string>("none")
  const [bodyText, setBodyText] = useState("")
  const [structured, setStructured] = useState<PostTherapyStructured>(emptyPostTherapyBody())

  const loadSessions = useCallback(async () => {
    try {
      const data = await sessionService.getPatientSessions(patientId)
      setSessions(data)
    } catch {
      setSessions([])
    }
  }, [patientId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const nextScheduledSession = useMemo(() => findNextScheduledSession(sessions), [sessions])

  /** Próxima sessão vem da agenda — texto salvo acompanha o que é exibido (reaplica após carregar a nota) */
  useEffect(() => {
    setStructured((prev) => ({
      ...prev,
      next_session_label: nextScheduledSession ? formatSessionOption(nextScheduledSession) : "",
    }))
  }, [nextScheduledSession, loadingNote])

  useEffect(() => {
    if (!isEdit || !noteId) return
    let cancelled = false
    ;(async () => {
      setLoadingNote(true)
      try {
        const n = await patientNoteService.get(patientId, noteId)
        if (cancelled) return
        setKind(n.kind)
        setTitle(n.title || "")
        setTemplateLabel(n.template_label || DEFAULT_POST_THERAPY_TEMPLATE_LABEL)
        setSessionId(n.session_id ? String(n.session_id) : "none")
        setBodyText(n.body_text || "")
        setStructured(mergeStructured(n.body_structured))
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } }
        showErrorToast("Anotação não encontrada", err.response?.data?.message || "")
        router.replace(`/dashboard/patients/${patientId}?tab=notes`)
      } finally {
        if (!cancelled) setLoadingNote(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, noteId, patientId, router])

  const onSessionChange = (value: string) => {
    setSessionId(value)
    if (value === "none") {
      setStructured((prev) => ({
        ...prev,
        session_date_label: "",
        session_time_label: "",
        duration_label: "",
      }))
      return
    }
    const sid = Number(value)
    const s = sessions.find((x) => x.id === sid)
    if (s && kind === "structured") {
      setStructured((prev) => prefillFromSession(s, prev))
    }
  }

  const onKindChange = (k: PatientNoteKind) => {
    setKind(k)
    if (k === "structured" && sessionId !== "none") {
      const sid = Number(sessionId)
      const s = sessions.find((x) => x.id === sid)
      if (s) setStructured((prev) => prefillFromSession(s, prev))
    }
  }

  const handleSave = async () => {
    const sid = sessionId === "none" ? null : Number(sessionId)
    if (kind === "free_text" && !bodyText.trim()) {
      showErrorToast("Texto vazio", "Escreva o conteúdo da anotação ou escolha o modelo.")
      return
    }
    setSaving(true)
    try {
      let bodyStructuredOut = structured
      if (kind === "structured" && sessionId === "none") {
        bodyStructuredOut = {
          ...structured,
          session_date_label: "",
          session_time_label: "",
          duration_label: "",
        }
      }
      const payload = {
        title: title.trim() || null,
        kind,
        template_label:
          kind === "structured" ? templateLabel.trim() || DEFAULT_POST_THERAPY_TEMPLATE_LABEL : null,
        session_id: sid,
        body_text: kind === "free_text" ? bodyText : null,
        body_structured: kind === "structured" ? bodyStructuredOut : null,
      }
      if (isEdit && noteId) {
        await patientNoteService.update(patientId, noteId, payload)
        showSuccessToast("Anotação atualizada", "")
      } else {
        await patientNoteService.create(patientId, payload)
        showSuccessToast("Anotação salva", "")
      }
      router.push(`/dashboard/patients/${patientId}?tab=notes`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      showErrorToast("Não foi possível salvar", err.response?.data?.message || "Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (loadingNote) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Informações gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {patientName && (
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-medium text-foreground">{patientName}</span>
            </p>
          )}

          <div className="space-y-2">
            <Label>Título (opcional)</Label>
            <Input
              placeholder="Ex.: Retorno sobre ansiedade"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={kind === "free_text" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onKindChange("free_text")}
              >
                <FileText className="h-4 w-4" />
                Texto livre
              </Button>
              <Button
                type="button"
                variant={kind === "structured" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onKindChange("structured")}
              >
                <LayoutTemplate className="h-4 w-4" />
                Modelo pós-terapia
              </Button>
            </div>
          </div>

          {kind === "structured" && (
            <div className="space-y-2">
              <Label>Nome do modelo (opcional)</Label>
              <Input
                value={templateLabel}
                onChange={(e) => setTemplateLabel(e.target.value)}
                placeholder={DEFAULT_POST_THERAPY_TEMPLATE_LABEL}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Vincular a uma sessão (opcional)
            </Label>
            <Select value={sessionId} onValueChange={onSessionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sem vínculo — anotação geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (anotação geral)</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {formatSessionOption(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kind === "structured" && sessionId !== "none" && (
              <p className="text-xs text-muted-foreground">
                Os campos Data, Hora e Duração da sessão aparecem abaixo e são preenchidos com base nesta
                sessão (você pode editar).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">
            {kind === "free_text" ? "Conteúdo" : "Campos do modelo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          {kind === "free_text" ? (
            <Textarea
              className="min-h-[min(72vh,720px)] max-h-[min(85vh,900px)] w-full overflow-y-auto text-base"
              placeholder="Escreva suas observações..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          ) : (
            <div className="space-y-6">
              {sessionId !== "none" && (
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                  {(
                    ["session_date_label", "session_time_label", "duration_label"] as const
                  ).map((key) => (
                    <div key={key} className="space-y-2 min-w-0">
                      <Label className="text-sm font-medium text-foreground">
                        {formatPostTherapyFieldLabel(key)}
                      </Label>
                      <Input
                        className="h-10 border-2 border-primary/45 bg-background text-base focus-visible:border-primary focus-visible:ring-primary/20"
                        value={structured[key]}
                        onChange={(e) =>
                          setStructured((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                {STRUCTURED_FIELDS_ORDER.filter((key) => !SESSION_META_FIELD_KEYS.has(key)).map(
                  (key) =>
                    key === "next_session_label" ? (
                      <div
                        key={key}
                        className="space-y-2 min-w-0 md:col-span-2"
                      >
                        <Label className="text-sm font-medium text-foreground">
                          {formatPostTherapyFieldLabel(key)}
                        </Label>
                        {nextScheduledSession ? (
                          <div className="rounded-md border-2 border-primary/45 bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground">
                            {formatSessionOption(nextScheduledSession)}
                          </div>
                        ) : (
                          <p className="rounded-md border border-dashed border-muted-foreground/35 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                            Nenhuma próxima sessão agendada.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        key={key}
                        className={cn(
                          "space-y-2 min-w-0",
                          key === "discussion_summary" && "md:col-span-2"
                        )}
                      >
                        <Label className="text-sm font-medium text-foreground">
                          {formatPostTherapyFieldLabel(key)}
                        </Label>
                        <Textarea
                          className={cn(
                            "w-full min-h-[120px] overflow-y-auto bg-background text-base md:min-h-[100px]",
                            key === "discussion_summary"
                              ? "min-h-[200px] max-h-[min(50vh,480px)] md:min-h-[220px]"
                              : "max-h-[min(38vh,320px)]",
                            "border-2 border-primary/45 focus-visible:border-primary focus-visible:ring-primary/20"
                          )}
                          value={structured[key]}
                          onChange={(e) =>
                            setStructured((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                        />
                      </div>
                    )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end pb-4 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => router.push(`/dashboard/patients/${patientId}?tab=notes`)}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </div>
  )
}
