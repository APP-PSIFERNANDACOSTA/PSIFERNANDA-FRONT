"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar suporte e permissão
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkSupport = async () => {
      // Verificar suporte básico
      const hasBasicSupport = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      // Verificar se é Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      // Verificar se está em modo privado (Safari e alguns navegadores)
      let isPrivateMode = false
      if (isSafari || isIOS) {
        try {
          const db = indexedDB.open('test')
          await new Promise<void>((resolve) => {
            db.onerror = () => {
              isPrivateMode = true
              resolve()
            }
            db.onsuccess = () => {
              indexedDB.deleteDatabase('test')
              resolve()
            }
            setTimeout(() => resolve(), 100) // Timeout de segurança
          })
        } catch {
          isPrivateMode = true
        }
      }

      // Safari em modo privado não suporta Service Workers
      if (isPrivateMode) {
        setIsSupported(false)
        setError('Safari em modo privado não suporta notificações push. Use o modo normal ou outro navegador (Chrome/Firefox).')
        setIsLoading(false)
        return
      }

      // Verificar se está no simulador do iOS
      const isSimulator = isIOS && (
        navigator.userAgent.includes('Simulator') ||
        navigator.userAgent.includes('iPhone Simulator') ||
        navigator.userAgent.includes('iPad Simulator') ||
        (window as any).navigator.standalone === undefined && !window.matchMedia('(display-mode: standalone)').matches && isIOS
      )

      // Safari iOS tem suporte limitado (iOS 16.4+)
      if (isIOS && hasBasicSupport) {
        setIsSupported(true)
        setPermission(Notification.permission)
        
        // Verificar se está em modo standalone (PWA instalado)
        const isStandalone = (window.navigator as any).standalone === true || 
                            window.matchMedia('(display-mode: standalone)').matches
        
        if (isSimulator) {
          setError('⚠️ Simulador iOS: Push notifications podem não funcionar corretamente. Teste em um dispositivo físico.')
        } else if (!isStandalone) {
          setError('No iOS, adicione o app à tela inicial e abra pelo ícone para receber notificações push.')
        }
      } else if (isIOS && !hasBasicSupport) {
        setIsSupported(false)
        if (isSimulator) {
          setError('⚠️ Simulador iOS: Push notifications não são totalmente suportadas. Teste em um dispositivo físico com iOS 16.4+.')
        } else {
          setError('Safari iOS não suporta push notifications nesta versão. Use iOS 16.4+ ou Chrome/Firefox no iOS.')
        }
      } else {
        setIsSupported(hasBasicSupport)
        if (hasBasicSupport) {
          setPermission(Notification.permission)
        } else {
          setError('Push notifications não são suportadas neste navegador. Use Chrome, Firefox ou Safari em modo normal.')
        }
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [])

  // Verificar se já está inscrito
  useEffect(() => {
    if (!isSupported || !isAuthenticated || (user?.role !== 'patient' && user?.role !== 'psychologist')) {
      setIsLoading(false)
      return
    }

    checkSubscription()
  }, [isSupported, isAuthenticated, user])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('Erro ao verificar subscription:', err)
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Registrar Service Worker
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers não são suportados neste navegador')
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('Service Worker registrado:', registration)
      return registration
    } catch (err) {
      console.error('Erro ao registrar Service Worker:', err)
      throw err
    }
  }

  // Solicitar permissão
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notificações não são suportadas neste navegador')
    }

    // Verificar permissão atual primeiro
    const currentPermission = Notification.permission
    
    // Se já foi negada, não tentar pedir novamente (navegador não permite)
    if (currentPermission === 'denied') {
      setPermission('denied')
      throw new Error('Permissão de notificações negada. Ative nas configurações do navegador')
    }

    const permission = await Notification.requestPermission()
    setPermission(permission)
    return permission
  }

  // Converter subscription para formato enviável
  const subscriptionToJSON = (subscription: PushSubscription): PushSubscriptionData => {
    const key = subscription.getKey('p256dh')
    const auth = subscription.getKey('auth')

    if (!key || !auth) {
      throw new Error('Chaves de subscription não encontradas')
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
        auth: btoa(String.fromCharCode(...new Uint8Array(auth)))
      }
    }
  }

  // Salvar subscription no backend
  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      const subscriptionData = subscriptionToJSON(subscription)
      console.log('[Push] Enviando subscription para backend:', {
        endpoint: subscriptionData.endpoint.substring(0, 50) + '...',
        hasKeys: !!subscriptionData.keys.p256dh && !!subscriptionData.keys.auth
      })
      
      const response = await apiClient.getAxiosInstance().post('/push/subscribe', subscriptionData)
      console.log('[Push] Resposta do backend:', response.data)
      console.log('[Push] Subscription salva no backend com sucesso!')
    } catch (err: any) {
      console.error('[Push] Erro ao salvar subscription:', err)
      console.error('[Push] Erro detalhado:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      throw new Error(err.response?.data?.message || 'Erro ao salvar subscription')
    }
  }

  // Remover subscription do backend
  const removeSubscription = async (subscription: PushSubscription) => {
    try {
      const subscriptionData = subscriptionToJSON(subscription)
      await apiClient.getAxiosInstance().post('/push/unsubscribe', {
        endpoint: subscriptionData.endpoint
      })
      console.log('Subscription removida do backend')
    } catch (err: any) {
      console.error('Erro ao remover subscription:', err)
      // Não lançar erro, pois a subscription local já foi removida
    }
  }

  // Converter VAPID key de base64 URL para Uint8Array
  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    if (!base64String) {
      throw new Error('VAPID public key não configurada')
    }
    
    // Remove espaços e quebras de linha
    const cleanKey = base64String.trim().replace(/\s/g, '')
    
    // Adiciona padding se necessário
    const padding = '='.repeat((4 - (cleanKey.length % 4)) % 4)
    
    // Converte de base64 URL-safe para base64 padrão
    const base64 = (cleanKey + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    try {
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      console.log('[Push] Chave VAPID convertida. Tamanho:', outputArray.length, 'bytes')
      return outputArray
    } catch (error) {
      console.error('[Push] Erro ao converter chave VAPID:', error)
      console.error('[Push] Chave recebida:', cleanKey.substring(0, 50) + '...')
      throw new Error('Erro ao converter chave VAPID: ' + (error as Error).message)
    }
  }, [])

  // Inscrever para push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log('[Push] Iniciando subscribe...')
    
    if (!isSupported) {
      console.error('[Push] Não suportado')
      setError('Push notifications não são suportadas neste navegador')
      return false
    }

    if (user?.role !== 'patient' && user?.role !== 'psychologist') {
      console.error('[Push] Apenas pacientes e psicólogos podem receber')
      setError('Apenas pacientes e psicólogos podem receber notificações push')
      return false
    }

    try {
      setError(null)
      setIsLoading(true)

      // 3. Verificar se VAPID key está configurada PRIMEIRO
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log('[Push] VAPID Key:', vapidPublicKey ? `Configurada (${vapidPublicKey.substring(0, 20)}...)` : 'NÃO CONFIGURADA')
      console.log('[Push] VAPID Key completa:', vapidPublicKey)
      if (!vapidPublicKey) {
        throw new Error('VAPID public key não configurada. Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY no .env.local e faça rebuild')
      }
      
      // Validar formato da chave (deve ter 88 caracteres para base64 URL-safe)
      if (vapidPublicKey.length < 80 || vapidPublicKey.length > 100) {
        console.warn('[Push] Chave VAPID com tamanho incomum:', vapidPublicKey.length, 'caracteres')
      }

      // 1. Registrar Service Worker
      console.log('[Push] Registrando Service Worker...')
      const registration = await registerServiceWorker()
      if (!registration) {
        throw new Error('Falha ao registrar Service Worker')
      }
      console.log('[Push] Service Worker registrado')

      // 2. Verificar se é iOS e se está em modo standalone (PWA instalado)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isSimulator = isIOS && (
        navigator.userAgent.includes('Simulator') ||
        navigator.userAgent.includes('iPhone Simulator') ||
        navigator.userAgent.includes('iPad Simulator')
      )
      const isStandalone = (window.navigator as any).standalone === true || 
                          window.matchMedia('(display-mode: standalone)').matches
      
      if (isSimulator) {
        console.warn('[Push] ⚠️ Simulador iOS detectado - push notifications podem não funcionar corretamente')
        // No simulador, permitimos tentar mas avisamos
      } else if (isIOS && !isStandalone) {
        throw new Error('No iOS, você precisa adicionar o app à tela inicial e abrir pelo ícone para receber notificações push.')
      }

      // 3. Solicitar permissão
      console.log('[Push] Solicitando permissão...')
      const permission = await requestPermission()
      console.log('[Push] Permissão:', permission)
      if (permission !== 'granted') {
        if (permission === 'denied') {
          const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
          const isSimulatorDevice = isIOSDevice && (
            navigator.userAgent.includes('Simulator') ||
            navigator.userAgent.includes('iPhone Simulator') ||
            navigator.userAgent.includes('iPad Simulator')
          )
          
          if (isSimulatorDevice) {
            throw new Error('⚠️ Simulador iOS: Permissão negada. Push notifications podem não funcionar no simulador. Teste em um dispositivo físico com iOS 16.4+.')
          } else if (isIOSDevice) {
            throw new Error('Permissão negada. No iOS, vá em Configurações > Safari > Notificações e permita para este site. Depois, adicione à tela inicial e abra pelo ícone.')
          }
          throw new Error('Permissão de notificações negada. Ative nas configurações do navegador')
        }
        throw new Error('Permissão de notificações negada')
      }

      // 4. Criar subscription
      console.log('[Push] Criando subscription...')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
      console.log('[Push] Subscription criada:', subscription.endpoint)

      // 5. Salvar no backend
      console.log('[Push] Salvando subscription no backend...')
      await saveSubscription(subscription)
      console.log('[Push] Subscription salva com sucesso!')

      setIsSubscribed(true)
      return true
    } catch (err: any) {
      console.error('[Push] Erro ao inscrever:', err)
      setError(err.message || 'Erro ao ativar notificações push')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, user, urlBase64ToUint8Array])

  // Cancelar inscrição
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remover do backend
        await removeSubscription(subscription)
        
        // Remover localmente
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (err: any) {
      console.error('Erro ao cancelar inscrição:', err)
      setError(err.message || 'Erro ao desativar notificações push')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription
  }
}

