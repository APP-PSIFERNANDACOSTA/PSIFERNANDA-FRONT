"use client"

import { useTheme } from "next-themes"
import { useCallback } from "react"

/**
 * Hook personalizado para gerenciar tema com persistência de sessão
 */
export function useThemeWithSession() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Função para resetar tema quando perder sessão
  const resetThemeOnLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('theme-preference')
    }
    setTheme('light')
  }, [setTheme])

  // Função para manter tema atual
  const keepCurrentTheme = useCallback(() => {
    // Não faz nada, mantém o tema atual
    // O next-themes já gerencia a persistência
  }, [])

  return {
    theme,
    resolvedTheme,
    setTheme,
    resetThemeOnLogout,
    keepCurrentTheme,
  }
}
