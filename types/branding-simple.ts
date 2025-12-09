/**
 * Simplified Branding Types
 * Only 2 colors to manage!
 * Theme (light/dark) is controlled by the toggle, not here
 */

export interface SimpleBrandingColors {
    primary: string     // Cor de destaque (botões, links, ícones)
    text: string        // Cor do texto
}

export interface BrandingSettings {
    colors: SimpleBrandingColors
    logos: {
        small?: string
        medium?: string
        large?: string
        email?: string
    }
    info: {
        app_name?: string
        company_name?: string
        company_email?: string
        company_phone?: string
    }
}

