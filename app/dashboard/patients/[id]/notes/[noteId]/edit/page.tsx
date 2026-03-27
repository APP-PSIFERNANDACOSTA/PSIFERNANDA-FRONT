"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PatientNoteForm } from "@/components/patient-note-form"
import { Button } from "@/components/ui/button"
import patientService from "@/services/patient-service"
import type { Patient } from "@/types/patient"

export default function EditPatientNotePage() {
  const params = useParams()
  const patientId = Number(params.id)
  const noteId = Number(params.noteId)
  const [patient, setPatient] = useState<Patient | null>(null)

  useEffect(() => {
    if (!patientId) return
    patientService
      .getById(patientId)
      .then(setPatient)
      .catch(() => setPatient(null))
  }, [patientId])

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" asChild>
              <Link href={`/dashboard/patients/${patientId}?tab=notes`} aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Editar anotação</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Altere o conteúdo, o tipo ou o vínculo com a sessão.
              </p>
            </div>
          </div>
        </div>

        <PatientNoteForm patientId={patientId} noteId={noteId} patientName={patient?.name} />
      </div>
    </DashboardLayout>
  )
}
