"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  PatientNoteDetailContent,
  getPatientNoteDisplayTitle,
} from "@/components/patient-note-detail-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import patientNoteService from "@/services/patient-note-service"
import patientService from "@/services/patient-service"
import type { PatientNote } from "@/types/patient-note"
import type { Patient } from "@/types/patient"
import { showErrorToast } from "@/lib/toast-helpers"
import { usePrivacyMode } from "@/contexts/privacy-mode-context"
import { maskPatientName } from "@/lib/privacy-mask"

export default function PatientNoteViewPage() {
  const { privacyMode } = usePrivacyMode()
  const params = useParams()
  const router = useRouter()
  const patientId = Number(params.id)
  const noteId = Number(params.noteId)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [note, setNote] = useState<PatientNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patientId || !noteId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [n, p] = await Promise.all([
          patientNoteService.get(patientId, noteId),
          patientService.getById(patientId),
        ])
        if (cancelled) return
        setNote(n)
        setPatient(p)
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } }
        showErrorToast("Anotação não encontrada", err.response?.data?.message || "")
        router.replace(`/dashboard/patients/${patientId}?tab=notes`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [patientId, noteId, router])

  const backHref = `/dashboard/patients/${patientId}?tab=notes`

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" asChild>
              <Link href={backHref} aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {note ? getPatientNoteDisplayTitle(note) : "Anotação"}
              </h1>
              {patient && (
                <p className="text-sm text-muted-foreground mt-1">
                  Paciente:{" "}
                  <span className="font-medium text-foreground">
                    {maskPatientName(patient.name, privacyMode)}
                  </span>
                </p>
              )}
            </div>
          </div>
          {note && (
            <Button className="gap-2 shrink-0" asChild>
              <Link href={`/dashboard/patients/${patientId}/notes/${noteId}/edit`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : note ? (
          <Card className="w-full border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientNoteDetailContent note={note} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
