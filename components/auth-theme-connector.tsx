"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useThemeWithSession } from '@/hooks/use-theme-session'
import dynamic from 'next/dynamic'

const PushNotificationRegister = dynamic(
  () => import('@/components/push-notification-register'),
  { ssr: false }
)

/**
 * Componente que conecta logout com reset de tema e registra push notifications
 */
export function AuthThemeConnector() {
  const { isAuthenticated } = useAuth()
  const { resetThemeOnLogout } = useThemeWithSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Só executa após o componente estar montado no cliente
    if (mounted && !isAuthenticated) {
      resetThemeOnLogout()
    }
  }, [mounted, isAuthenticated, resetThemeOnLogout])

  return mounted ? <PushNotificationRegister /> : null
}
