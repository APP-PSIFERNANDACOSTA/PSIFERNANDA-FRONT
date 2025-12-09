"use client"

import { useEffect } from 'react'
import { applyColors } from '@/lib/colors'

export function ColorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Aplicar cores quando o app carrega
    applyColors()
    
    // Observar mudanças na classe 'dark' do documento
    const observer = new MutationObserver(() => {
      applyColors()
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
