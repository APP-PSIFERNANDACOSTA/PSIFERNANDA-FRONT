"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import googleOAuthService from "@/services/google-oauth-service"

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleExpired, setGoogleExpired] = useState(false)

  useEffect(() => {
    checkGoogleStatus()
    
    // Verificar se veio do callback do Google
    const googleConnected = searchParams.get('google_connected')
    const googleError = searchParams.get('google_error')
    
    if (googleConnected === 'true') {
      showSuccessToast("Google Calendar conectado!", "Suas sessões serão sincronizadas automaticamente")
      setGoogleConnected(true)
      setGoogleExpired(false)
      // Remover parâmetro da URL
      window.history.replaceState({}, '', '/settings/integrations')
    } else if (googleError) {
      showErrorToast("Erro ao conectar", decodeURIComponent(googleError))
      // Remover parâmetro da URL
      window.history.replaceState({}, '', '/settings/integrations')
    }
  }, [searchParams])

  const checkGoogleStatus = async () => {
    try {
      setIsLoading(true)
      const status = await googleOAuthService.getStatus()
      setGoogleConnected(status.connected)
      setGoogleExpired(status.expired)
    } catch (error: any) {
      console.error("Erro ao verificar status do Google:", error)
      setGoogleConnected(false)
      setGoogleExpired(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true)
      const authUrl = await googleOAuthService.getAuthUrl()
      
      // Redirecionar para a URL de autenticação
      // O Google redirecionará de volta para /api/google/oauth/callback
      // que então redirecionará para o frontend com sucesso
      window.location.href = authUrl
    } catch (error: any) {
      console.error("Erro ao conectar Google Calendar:", error)
      showErrorToast(
        "Erro ao conectar",
        error?.message || "Não foi possível conectar com Google Calendar"
      )
      setIsConnecting(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm("Tem certeza que deseja desconectar o Google Calendar? As sessões futuras não serão sincronizadas automaticamente.")) {
      return
    }

    try {
      setIsDisconnecting(true)
      await googleOAuthService.disconnect()
      setGoogleConnected(false)
      setGoogleExpired(false)
      showSuccessToast("Google Calendar desconectado", "A integração foi removida com sucesso")
    } catch (error: any) {
      console.error("Erro ao desconectar Google Calendar:", error)
      showErrorToast(
        "Erro ao desconectar",
        error?.message || "Não foi possível desconectar"
      )
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Integrações</h1>
          <p className="mt-1 text-muted-foreground">
            Conecte seus serviços externos para sincronizar automaticamente
          </p>
        </div>

        {/* Google Calendar Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Google Calendar</CardTitle>
                  <CardDescription>
                    Sincronize suas sessões automaticamente com o Google Calendar e Google Meet
                  </CardDescription>
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : googleConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Funcionalidades</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Criação automática de eventos no Google Calendar ao criar sessões</li>
                <li>Atualização automática quando você editar ou remarcar sessões</li>
                <li>Exclusão automática quando você deletar sessões</li>
                <li>Links do Google Meet gerados automaticamente para cada sessão</li>
                <li>Convites enviados automaticamente para você e o paciente</li>
                <li>Lembretes configurados automaticamente</li>
              </ul>
            </div>

            {googleExpired && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Sua conexão com o Google Calendar expirou. Reconecte para continuar sincronizando.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {googleConnected ? (
                <Button
                  onClick={handleDisconnectGoogle}
                  disabled={isDisconnecting}
                  variant="destructive"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Desconectar
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Conectar com Google Calendar
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Ao conectar, você será redirecionado para o Google para autorizar o acesso ao seu calendário.
                O sistema precisará de permissão para criar, editar e excluir eventos em seu nome.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como configurar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Criar credenciais no Google Cloud Console</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                <li>Acesse <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Crie um novo projeto ou selecione um existente</li>
                <li>Ative a API do Google Calendar</li>
                <li>Vá em "Credenciais" e crie credenciais OAuth 2.0</li>
                <li>Configure o tipo de aplicativo como "Aplicativo da Web"</li>
                <li>Adicione a URL de redirecionamento: <code className="bg-muted px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/google/oauth/callback</code></li>
                <li>Copie o Client ID e Client Secret</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Configurar no sistema</h4>
              <p className="text-muted-foreground">
                Adicione as credenciais no arquivo <code className="bg-muted px-1 rounded">.env</code> do backend:
              </p>
              <pre className="bg-muted p-3 rounded mt-2 text-xs overflow-x-auto">
{`GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000'}/api/google/oauth/callback`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Conectar sua conta</h4>
              <p className="text-muted-foreground">
                Clique no botão "Conectar com Google Calendar" acima e autorize o acesso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
