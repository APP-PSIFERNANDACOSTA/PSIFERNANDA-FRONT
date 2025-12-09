"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import sessionService from "@/services/session-service"
import type { Session } from "@/types/session"
import type { SessionReport } from "@/types/session-report"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RichTextEditor } from "@/components/rich-text-editor"

export default function SessionReportPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = Number(params.id)
  const sessionId = Number(params.sessionId)

  const [session, setSession] = useState<Session | null>(null)
  const [report, setReport] = useState<SessionReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadData()
  }, [patientId, sessionId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Carregar sessão
      const sessionData = await sessionService.getSession(patientId, sessionId)
      
      if (!sessionData) {
        throw new Error("Sessão não encontrada")
      }
      
      setSession(sessionData)

      // Gerar título padrão
      let defaultTitle = "Relatório da sessão"
      
      if (sessionData.session_date) {
        const sessionDate = new Date(sessionData.session_date)
        if (sessionDate && !isNaN(sessionDate.getTime())) {
          try {
            defaultTitle = `Relatório da sessão - ${format(sessionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
          } catch (error) {
            // Se houver erro ao formatar, usar título padrão
            console.error("Erro ao formatar data:", error)
          }
        }
      }
      
      setTitle(defaultTitle)

      // Importar e usar serviço de relatórios
      const { default: sessionReportService } = await import("@/services/session-report-service")
      
      if (!sessionReportService || typeof sessionReportService.exists !== 'function') {
        throw new Error("Serviço de relatórios não está disponível")
      }
      
      const { exists, reportId } = await sessionReportService.exists(patientId, sessionId)
      
      if (exists && reportId) {
        // Carregar relatório existente
        const reportData = await sessionReportService.get(patientId, sessionId)
        setReport(reportData)
        setTitle(reportData.title)
        setContent(reportData.content)
        setIsEditing(true)
      } else {
        // Novo relatório
        setIsEditing(false)
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
      showErrorToast(
        "Erro",
        error.response?.data?.message || "Não foi possível carregar os dados da sessão."
      )
      router.push(`/dashboard/patients/${patientId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showErrorToast("Erro", "O título é obrigatório.")
      return
    }

    if (!content.trim() || content === "<p><br></p>") {
      showErrorToast("Erro", "O conteúdo do relatório é obrigatório.")
      return
    }

    setIsSaving(true)
    try {
      // Importar e usar serviço de relatórios
      const { default: sessionReportService } = await import("@/services/session-report-service")
      
      if (!sessionReportService || typeof sessionReportService.create !== 'function') {
        throw new Error("Serviço de relatórios não está disponível")
      }
      
      if (isEditing && report) {
        // Atualizar relatório existente
        await sessionReportService.update(patientId, sessionId, {
          title: title.trim(),
          content,
        })
        showSuccessToast("Relatório atualizado", "O relatório foi atualizado com sucesso.")
      } else {
        // Criar novo relatório
        await sessionReportService.create(patientId, sessionId, {
          title: title.trim(),
          content,
        })
        showSuccessToast("Relatório criado", "O relatório foi criado com sucesso.")
      }
      router.push(`/dashboard/patients/${patientId}?tab=sessions`)
    } catch (error: any) {
      console.error("Erro ao salvar relatório:", error)
      showErrorToast(
        "Erro",
        error.response?.data?.message || "Não foi possível salvar o relatório."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Sessão não encontrada.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const sessionDate = session?.session_date ? new Date(session.session_date) : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/patients/${patientId}?tab=sessions`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                {isEditing ? "Editar Relatório" : "Criar Relatório"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                Sessão de {sessionDate && !isNaN(sessionDate.getTime()) ? format(sessionDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Relatório
              </>
            )}
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Relatório *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Relatório da sessão - 20/11/2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo do Relatório *</Label>
              <div className="border rounded-md">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Escreva o relatório da sessão aqui..."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use a barra de ferramentas para formatar o texto (negrito, itálico, listas, etc.)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {content && content !== "<p><br></p>" && (
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}



