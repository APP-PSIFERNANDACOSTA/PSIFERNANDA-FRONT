"use client"

import { useEffect, useState } from 'react'
import { applyColors, getAllColors, getColor } from '@/lib/colors'

/**
 * Hook para gerenciar cores do sistema
 * Aplica automaticamente as cores quando o componente é montado
 * Detecta mudanças no modo escuro e reaplica as cores
 */
export function useColors() {
  const [colors, setColors] = useState(getAllColors())

  useEffect(() => {
    applyColors()
    setColors(getAllColors())
    
    // Observar mudanças na classe 'dark' do documento
    const observer = new MutationObserver(() => {
      applyColors()
      setColors(getAllColors())
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  const refreshColors = () => {
    applyColors()
    setColors(getAllColors())
  }

  return {
    colors,
    getColor,
    applyColors,
    refreshColors,
  }
}
