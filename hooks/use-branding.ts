"use client"

import { useEffect, useState } from 'react'
import brandingService, { BrandingColors } from '@/services/branding-service'

export function useBranding() {
    const [colors, setColors] = useState<BrandingColors>({} as BrandingColors)
    const [loading, setLoading] = useState(true)

    const loadBranding = async () => {
        try {
            const settings = await brandingService.getAll()
            setColors(settings.colors)
            await brandingService.applyCssVariables()
        } catch (error) {
            console.warn('Failed to load branding:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBranding()
    }, [])

    const updateColor = (name: keyof BrandingColors, value: string) => {
        setColors(prev => ({ ...prev, [name]: value }))

        // Apply to CSS immediately
        document.documentElement.style.setProperty(`--color-${name}`, value)
    }

    const applyColors = async () => {
        try {
            await brandingService.updateColors(colors)
        } catch (error) {
            console.error('Failed to apply colors:', error)
        }
    }

    return {
        colors,
        loading,
        updateColor,
        applyColors,
        reload: loadBranding,
    }
}
