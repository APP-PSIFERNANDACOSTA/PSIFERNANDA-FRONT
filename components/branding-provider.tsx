"use client"

import { useEffect } from 'react'
import { applySimpleBranding } from '@/lib/simple-branding'

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Apply simplified branding colors on app load
        // Wrap in try-catch to prevent errors from breaking the app
        applySimpleBranding().catch((error) => {
            console.warn('Failed to load branding, using defaults:', error)
        })
    }, [])

    return <>{children}</>
}
