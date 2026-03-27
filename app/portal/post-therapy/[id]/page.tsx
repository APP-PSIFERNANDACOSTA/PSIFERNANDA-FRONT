"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import patientNoteService from "@/services/patient-note-service"
import type { PatientNote } from "@/types/patient-note"
import { PatientNoteDetailContent, getPatientNoteDisplayTitle } from "@/components/patient-note-detail-content"
import { showErrorToast } from "@/lib/toast-helpers"

export default function PortalPostTherapyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = params.id
  const id = Number(typeof rawId === "string" ? rawId : rawId?.[0])
  const [note, setNote] = useState<PatientNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      router.replace("/portal/post-therapy")
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await patientNoteService.getMyPortalPostTherapy(id)
        if (!cancelled) setNote(data)
      } catch {
        if (!cancelled) {
          showErrorToast("Não encontrado", "Este registro não está disponível ou foi removido.")
          router.push("/portal/post-therapy")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Abrindo…</span>
      </div>
    )
  }

  if (!note) {
    return null
  }

  const title = getPatientNoteDisplayTitle(note)

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 sm:space-y-8 pb-4">
      <div className="flex flex-col gap-4 w-full">
        <Button variant="ghost" className="w-fit -ml-2 gap-2 px-2 min-h-[44px]" asChild>
          <Link href="/portal/post-therapy">
            <ArrowLeft className="h-5 w-5" />
            Voltar à lista
          </Link>
        </Button>

        <div className="w-full min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">Pós-terapia</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight break-words">
            {title}
          </h1>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6 lg:p-8 shadow-sm">
        <PatientNoteDetailContent note={note} variant="portal" />
      </div>
    </div>
  )
}
