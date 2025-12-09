"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw } from 'lucide-react'

export function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    let refreshing = false
    let intervalId: NodeJS.Timeout | null = null

    // Detectar quando uma nova versão está disponível
    const handleControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Verificar atualizações periodicamente
    const checkForUpdates = async () => {
      try {
        // Registrar service worker se ainda não estiver registrado
        let reg = await navigator.serviceWorker.getRegistration()
        if (!reg) {
          reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          console.log('[PWA Update] Service Worker registrado')
        }
        
        await navigator.serviceWorker.ready
        setRegistration(reg)

        // Verificar atualizações a cada 60 segundos
        intervalId = setInterval(async () => {
          try {
            await reg.update()
          } catch (error) {
            console.error('Erro ao verificar atualizações:', error)
          }
        }, 60000)

        // Verificar se há uma nova versão esperando
        const handleUpdateFound = () => {
          const newWorker = reg.installing
          if (!newWorker) return

          const handleStateChange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              setUpdateAvailable(true)
            }
          }

          newWorker.addEventListener('statechange', handleStateChange)
        }

        reg.addEventListener('updatefound', handleUpdateFound)

        // Verificar atualização imediatamente
        await reg.update()
      } catch (error) {
        console.error('Erro ao verificar service worker:', error)
      }
    }

    checkForUpdates()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [mounted])

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return

    setIsUpdating(true)

    // Enviar mensagem para o service worker para pular a espera
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // Forçar reload
    window.location.reload()
  }

  if (!mounted || !updateAvailable) return null

  return (
    <Dialog open={updateAvailable} onOpenChange={setUpdateAvailable}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova versão disponível!</DialogTitle>
          <DialogDescription>
            Uma nova versão do aplicativo está disponível. Deseja atualizar agora?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setUpdateAvailable(false)}
            disabled={isUpdating}
          >
            Depois
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Agora
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

