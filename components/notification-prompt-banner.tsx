"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useAuth } from "@/contexts/auth-context"

const STORAGE_KEY = "notification-prompt-dismissed"
const DISMISS_HOURS = 24

export function NotificationPromptBanner() {
  const { user, isAuthenticated } = useAuth()
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    isLoading: isPushLoading,
  } = usePushNotifications()
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY)
      if (!dismissedAt) {
        setIsDismissed(false)
        return
      }
      const diff = Date.now() - parseInt(dismissedAt, 10)
      setIsDismissed(diff < DISMISS_HOURS * 60 * 60 * 1000)
    } catch {
      setIsDismissed(false)
    }
  }, [])

  const shouldShow =
    isAuthenticated &&
    (user?.role === "psychologist" || user?.role === "patient") &&
    isSupported &&
    permission !== "denied" &&
    !isSubscribed &&
    !isDismissed

  const handleActivate = async () => {
    const ok = await subscribe()
    if (ok) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    }
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch {}
    setIsDismissed(true)
  }

  if (!shouldShow) return null

  const message =
    user?.role === "psychologist"
      ? "Receba lembretes quando pacientes postarem diários, responderem quizzes e outras atualizações."
      : "Receba lembretes de sessão, mensagens da psicóloga e outras atualizações importantes."

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Ative as notificações</p>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleDismiss}
        >
          Depois
        </Button>
        <Button
          size="sm"
          onClick={handleActivate}
          disabled={isPushLoading}
        >
          {isPushLoading ? "Ativando..." : "Ativar"}
        </Button>
      </div>
    </div>
  )
}
