"use client"

import { useEffect, useRef, useCallback } from "react"

/**
 * Atualiza dados automaticamente em PWA (sem botão de refresh).
 * - Refaz quando a aba volta a ficar visível
 * - Refaz a cada intervalo quando a aba está visível
 */
export function useAutoRefresh(
  refetch: () => void | Promise<void>,
  options: {
    intervalMs?: number
    enabled?: boolean
  } = {}
) {
  const { intervalMs = 60000, enabled = true } = options
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  const doRefetch = useCallback(() => {
    const fn = refetchRef.current
    if (fn) {
      Promise.resolve(fn()).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const handleFocus = () => {
      doRefetch()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        doRefetch()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        doRefetch()
      }
    }, intervalMs)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearInterval(id)
    }
  }, [doRefetch, intervalMs, enabled])
}
