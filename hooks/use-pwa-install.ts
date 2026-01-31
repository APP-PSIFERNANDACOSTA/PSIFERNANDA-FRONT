"use client"

import { useState, useEffect } from "react"

export type PwaPlatform = "ios" | "android" | "desktop"

const STORAGE_KEY = "pwa-install-dismissed"
const DISMISS_DAYS = 7

export function usePwaInstall() {
  const [platform, setPlatform] = useState<PwaPlatform>("desktop")
  const [isStandalone, setIsStandalone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const isAndroid = /Android/.test(ua)

    const standalone =
      (navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches ||
      (window as any).matchMedia("(display-mode: fullscreen)").matches ||
      document.referrer.includes("android-app://")

    let detectedPlatform: PwaPlatform = "desktop"
    if (isIOS) detectedPlatform = "ios"
    else if (isAndroid) detectedPlatform = "android"

    setPlatform(detectedPlatform)
    setIsStandalone(standalone)

    // Verificar se o usuário dispensou recentemente
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY)
      if (dismissedAt) {
        const diff = Date.now() - parseInt(dismissedAt, 10)
        const daysDiff = diff / (1000 * 60 * 60 * 24)
        setIsDismissed(daysDiff < DISMISS_DAYS)
      } else {
        setIsDismissed(false)
      }
    } catch {
      setIsDismissed(false)
    }

    setIsReady(true)
  }, [])

  const shouldShow = isReady && !isStandalone && (platform === "ios" || platform === "android") && !isDismissed

  const dismiss = () => {
    setIsDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch {}
  }

  return {
    platform,
    isStandalone,
    shouldShow,
    dismiss,
    isReady,
  }
}
