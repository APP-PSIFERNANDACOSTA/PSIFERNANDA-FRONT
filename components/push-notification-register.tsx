"use client"

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

export default function PushNotificationRegister() {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isAuthenticated || (user?.role !== 'patient' && user?.role !== 'psychologist')) return

    // Registrar Service Worker automaticamente quando o paciente ou psicólogo acessar
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registrado:', registration)
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error)
        })
    }
  }, [isAuthenticated, user])

  return null
}

