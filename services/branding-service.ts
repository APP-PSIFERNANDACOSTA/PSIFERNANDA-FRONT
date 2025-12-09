import apiClient from '@/lib/api-client'

export interface BrandingColors {
    primary: string
    primary_foreground: string
    primary_dark: string
    secondary: string
    secondary_foreground: string
    background: string
    background_dark: string
    background_light: string
    foreground: string
    foreground_light: string
    foreground_muted: string
    border: string
    border_light: string
    success: string
    warning: string
    error: string
    info: string
    email_background: string
    email_card: string
    email_button: string
    email_button_text: string
    email_panel: string
}

export interface BrandingInfo {
    app_name: string
    app_tagline: string
    company_name: string
    company_email: string
    company_phone: string
    company_address: string
    crp: string
}

export interface BrandingSettings {
    colors: BrandingColors
    info: BrandingInfo
    settings: Record<string, any>
}

export interface LogoUploadResponse {
    success: boolean
    message: string
    logo_url: string
}

class BrandingService {
    /**
     * Get all branding settings
     */
    async getAll(): Promise<BrandingSettings> {
        const response = await apiClient.get('/branding/')
        return response
    }

    /**
     * Get settings by group (colors, info, etc.)
     */
    async getGroup(group: string): Promise<Record<string, any>> {
        const response = await apiClient.get(`/branding/group/${group}`)
        return response.settings
    }

    /**
     * Update branding settings
     */
    async update(settings: Record<string, any>, types?: Record<string, string>, descriptions?: Record<string, string>): Promise<void> {
        await apiClient.put('/branding/update', {
            settings,
            types,
            descriptions,
        })
    }

    /**
     * Upload logo
     */
    async uploadLogo(file: File, size: 'small' | 'medium' | 'large' | 'email'): Promise<LogoUploadResponse> {
        const formData = new FormData()
        formData.append('logo', file)
        formData.append('size', size)

        const response = await apiClient.post('/branding/upload-logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response
    }

    /**
     * Delete logo
     */
    async deleteLogo(size: 'small' | 'medium' | 'large' | 'email'): Promise<void> {
        await apiClient.delete('/branding/delete-logo', {
            data: { size },
        })
    }

    /**
     * Get CSS variables for dynamic styling
     */
    async getCssVariables(): Promise<string> {
        const response = await apiClient.get('/branding/css-variables')
        return response.css_variables
    }

    /**
     * Reset to default settings
     */
    async reset(): Promise<void> {
        await apiClient.post('/branding/reset')
    }

    /**
     * Apply CSS variables to the document
     */
    async applyCssVariables(): Promise<void> {
        try {
            const cssVariables = await this.getCssVariables()

            // Parse CSS variables and apply to document
            const lines = cssVariables.split('\n')
            lines.forEach(line => {
                if (line.includes('--color-') && line.includes(':')) {
                    const [property, value] = line.split(':')
                    if (property && value) {
                        const cleanProperty = property.trim()
                        const cleanValue = value.trim().replace(';', '')
                        document.documentElement.style.setProperty(cleanProperty, cleanValue)
                    }
                }
            })
        } catch (error) {
            console.warn('Failed to apply CSS variables:', error)
        }
    }

    /**
     * Update colors in real-time
     */
    async updateColors(colors: Partial<BrandingColors>): Promise<void> {
        const colorSettings: Record<string, any> = {}
        const colorTypes: Record<string, string> = {}
        const colorDescriptions: Record<string, string> = {}

        Object.entries(colors).forEach(([key, value]) => {
            colorSettings[`colors.${key}`] = value
            colorTypes[`colors.${key}`] = 'color'
            colorDescriptions[`colors.${key}`] = `Cor ${key} do sistema`
        })

        await this.update(colorSettings, colorTypes, colorDescriptions)

        // Apply changes immediately
        await this.applyCssVariables()
    }

    /**
     * Update branding info
     */
    async updateInfo(info: Partial<BrandingInfo>): Promise<void> {
        const infoSettings: Record<string, any> = {}
        const infoTypes: Record<string, string> = {}
        const infoDescriptions: Record<string, string> = {}

        Object.entries(info).forEach(([key, value]) => {
            infoSettings[`branding.${key}`] = value
            infoTypes[`branding.${key}`] = 'string'
            infoDescriptions[`branding.${key}`] = `Informação ${key} da marca`
        })

        await this.update(infoSettings, infoTypes, infoDescriptions)
    }
}

export default new BrandingService()
