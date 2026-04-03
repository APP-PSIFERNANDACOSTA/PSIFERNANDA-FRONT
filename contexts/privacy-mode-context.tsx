"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "psychologist-privacy-mode"
const LEGACY_KEY = "dashboard-privacy-mode"

type PrivacyModeContextValue = {
  privacyMode: boolean
  setPrivacyMode: (value: boolean) => void
  togglePrivacyMode: () => void
  hydrated: boolean
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null)

export function PrivacyModeProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyModeState] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) {
        const legacy = localStorage.getItem(LEGACY_KEY)
        if (legacy !== null) {
          raw = legacy
          localStorage.setItem(STORAGE_KEY, legacy)
        }
      }
      setPrivacyModeState(raw === "true")
    } catch {
      setPrivacyModeState(false)
    }
    setHydrated(true)
  }, [])

  const setPrivacyMode = useCallback((value: boolean) => {
    setPrivacyModeState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      /* ignore */
    }
  }, [])

  const togglePrivacyMode = useCallback(() => {
    setPrivacyModeState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ privacyMode, setPrivacyMode, togglePrivacyMode, hydrated }),
    [privacyMode, setPrivacyMode, togglePrivacyMode, hydrated]
  )

  return <PrivacyModeContext.Provider value={value}>{children}</PrivacyModeContext.Provider>
}

export function usePrivacyMode(): PrivacyModeContextValue {
  const ctx = useContext(PrivacyModeContext)
  if (!ctx) {
    throw new Error("usePrivacyMode must be used within PrivacyModeProvider")
  }
  return ctx
}

/** Para componentes que podem renderizar fora do provider (ex.: testes). */
export function usePrivacyModeOptional(): PrivacyModeContextValue | null {
  return useContext(PrivacyModeContext)
}
