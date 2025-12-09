import type { SimpleBrandingColors } from '@/types/branding-simple'
import brandingService from '@/services/branding-service'

// Cache
let cachedColors: SimpleBrandingColors | null = null
let lastFetch = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Get branding colors with cache
 */
async function getColors(): Promise<SimpleBrandingColors> {
    const now = Date.now()

    if (cachedColors && (now - lastFetch) < CACHE_DURATION) {
        return cachedColors
    }

    try {
        const settings = await brandingService.getAll()
        cachedColors = {
            primary: settings.colors.primary || '#F8BBD0',
            text: settings.colors.text || '#1a1a1a',
        }
        lastFetch = now
        return cachedColors
    } catch (error) {
        // Fallback para cores padrão (se a API estiver offline)
        console.warn('Failed to load branding settings, using defaults')
        return {
            primary: '#F8BBD0',
            text: '#1a1a1a',
        }
    }
}

/**
 * Apply branding colors to the entire app
 * Only 2 colors to manage!
 * Theme (light/dark) is controlled by the dark mode toggle
 */
export async function applySimpleBranding() {
    try {
        const colors = await getColors()

        // Detectar tema atual do sistema (dark mode toggle)
        const isDark = document.documentElement.classList.contains('dark')
        const background = isDark ? '#0f0f0f' : '#fafafa'  // Fundo mais suave
        const cardBg = isDark ? '#1a1a1a' : '#ffffff'     // Cards brancos/pretos
        const sidebarBg = isDark ? '#111111' : '#f8f9fa'  // Sidebar neutra
        const border = isDark ? '#2a2a2a' : '#e1e5e9'     // Bordas suaves
        const textMuted = isDark ? '#a0a0a0' : '#6b7280'   // Texto secundário

        // Aplicar CSS Variables
        const root = document.documentElement
        root.style.setProperty('--color-primary', colors.primary)
        root.style.setProperty('--color-text', colors.text)
        root.style.setProperty('--color-background', background)
        root.style.setProperty('--color-card', cardBg)
        root.style.setProperty('--color-sidebar', sidebarBg)
        root.style.setProperty('--color-border', border)
        root.style.setProperty('--color-text-muted', textMuted)

        // Nota: Não alteramos a classe 'dark' aqui
        // Isso é controlado pelo toggle de dark mode

        // Criar/atualizar folha de estilo customizada
        let styleElement = document.getElementById('simple-branding')
        if (!styleElement) {
            styleElement = document.createElement('style')
            styleElement.id = 'simple-branding'
            document.head.appendChild(styleElement)
        }

        styleElement.textContent = `
      /* Sistema de Cores Melhorado - Fundos Neutros + Cor de Destaque */
      
      /* === FUNDOS NEUTROS === */
      body, html { background-color: ${background} !important; }
      .bg-background { background-color: ${background} !important; }
      .bg-card { background-color: ${cardBg} !important; }
      
      /* Sidebar com fundo neutro */
      aside, [data-sidebar] { 
        background-color: ${sidebarBg} !important; 
        border-right-color: ${border} !important;
      }
      
      /* Cards e containers */
      [data-slot="card"], .card, [role="card"] { 
        background-color: ${cardBg} !important; 
        border-color: ${border} !important;
      }
      
      /* === COR PRIMÁRIA APENAS NOS DESTAQUES === */
      
      /* Botões principais - fundo primário com texto da cor de texto */
      .bg-primary, button[type="submit"], .btn-primary, 
      .bg-primary-500, .bg-pink-500, .bg-rose-500 { 
        background-color: ${colors.primary} !important; 
        border-color: ${colors.primary} !important;
        color: ${colors.text} !important; /* Usar cor de texto para contraste */
      }
      
      /* Badges e elementos de status - fundo primário com texto da cor de texto */
      .badge, .badge-primary, .badge-default,
      .bg-primary\\/10, .bg-primary\\/20, .bg-primary\\/30 {
        background-color: ${colors.primary} !important;
        color: ${colors.text} !important; /* Usar cor de texto para contraste */
      }
      
      /* Links e elementos interativos */
      a:not(.text-muted-foreground), .link { color: ${colors.primary} !important; }
      a:hover:not(.text-muted-foreground) { 
        color: ${colors.primary} !important;
        opacity: 0.8;
      }
      
      /* Texto primário para destaques */
      .text-primary { color: ${colors.primary} !important; }
      
      /* Bordas de foco */
      .border-primary { border-color: ${colors.primary} !important; }
      
      /* === NAVEGAÇÃO ATIVA - APENAS BORDA === */
      
      /* Item ativo na sidebar - apenas borda, sem fundo */
      .bg-sidebar-accent, 
      .sidebar-item.active,
      .nav-item.active,
      [data-active="true"] {
        background-color: transparent !important;
        border-left: 3px solid ${colors.primary} !important;
        color: ${colors.primary} !important;
      }
      
      /* Hover na sidebar - sutil */
      .sidebar-item:hover,
      .nav-item:hover {
        background-color: ${colors.primary}10 !important;
        color: ${colors.primary} !important;
      }
      
      /* === TEXTOS === */
      .text-foreground { color: ${colors.text} !important; }
      .text-muted-foreground { color: ${textMuted} !important; }
      
      /* === BORDAS NEUTRAS === */
      .border, .border-border { border-color: ${border} !important; }
      
      /* === INPUTS === */
      input, textarea, select {
        background-color: ${cardBg} !important;
        border-color: ${border} !important;
        color: ${colors.text} !important;
      }
      
      input:focus, textarea:focus, select:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px ${colors.primary}20 !important;
      }
      
      /* === ELEMENTOS COM COR PRIMÁRIA SUTIL === */
      
      /* Ícones em contexto */
      .text-primary svg, .icon-primary svg, 
      .text-primary-foreground svg { 
        color: ${colors.primary} !important; 
      }
      
      /* Ícones em botões com fundo primário - usar cor de texto */
      .bg-primary svg, .bg-primary-500 svg { 
        color: ${colors.text} !important; 
      }
      
      /* Texto em botões primários - usar cor de texto para contraste */
      .bg-primary, .bg-primary-500 {
        color: ${colors.text} !important;
      }
      .bg-primary *, .bg-primary-500 * {
        color: ${colors.text} !important;
      }
      
      /* Badges e tags sutis */
      .bg-primary\\/10 { background-color: ${colors.primary}15 !important; }
      .bg-primary\\/20 { background-color: ${colors.primary}25 !important; }
      
      /* Override para elementos específicos que podem estar usando cores padrão */
      .bg-pink-500, .bg-rose-500, .bg-pink-600, .bg-rose-600 {
        background-color: ${colors.primary} !important;
      }
      .text-pink-500, .text-rose-500, .text-pink-600, .text-rose-600 {
        color: ${colors.primary} !important;
      }
      .border-pink-500, .border-rose-500, .border-pink-600, .border-rose-600 {
        border-color: ${colors.primary} !important;
      }
      
      /* === HOVER STATES === */
      button.bg-primary:hover,
      .hover\\:bg-primary:hover { 
        filter: brightness(0.9) !important;
      }
      
      /* === REMOVER CORES ANTIGAS === */
      * {
        --tw-ring-color: ${colors.primary}20;
      }
      
      /* Garantir que fundos não usem cor primária */
      .bg-sidebar, .bg-muted { 
        background-color: ${sidebarBg} !important; 
      }
      
      /* === COMPONENTES ESPECÍFICOS === */
      
      /* Sidebar do Portal */
      .portal-sidebar nav a,
      .sidebar nav a {
        background-color: transparent !important;
        /* border-left: 3px solid transparent !important; */
        transition: all 0.2s ease !important;
      }
      
      /* Item ativo na sidebar - borda completa */
      .portal-sidebar nav a[aria-current="page"],
      .sidebar nav a[aria-current="page"],
      .portal-sidebar nav a.active,
      .sidebar nav a.active {
        background-color: transparent !important;
        border: 1px solid ${colors.primary} !important;
        color: ${colors.primary} !important;
        border-radius: 0.5rem !important;
      }
      
      /* Hover na sidebar */
      .portal-sidebar nav a:hover,
      .sidebar nav a:hover {
        background-color: ${colors.primary}08 !important;
        color: ${colors.primary} !important;
      }
      
      /* Remover fundos antigos de itens ativos */
      .bg-sidebar-accent,
      .bg-primary\\/10 {
        background-color: transparent !important;
      }
      
      /* Login page - fundo neutro */
      .login-page, .auth-page {
        background-color: ${background} !important;
      }
      
      /* === OVERRIDES ESPECÍFICOS PARA COMPONENTES === */
      
      /* Botões do shadcn/ui - fundo primário com texto da cor de texto */
      button[data-variant="default"], 
      .btn[data-variant="default"],
      .bg-primary, .bg-primary-500 {
        background-color: ${colors.primary} !important;
        border-color: ${colors.primary} !important;
        color: ${colors.text} !important; /* Usar cor de texto para contraste */
      }
      
      /* Badges do shadcn/ui - fundo primário com texto da cor de texto */
      .badge, [data-badge], 
      .bg-primary, .bg-primary-500,
      .bg-primary\\/10, .bg-primary\\/20 {
        background-color: ${colors.primary} !important;
        color: ${colors.text} !important; /* Usar cor de texto para contraste */
      }
      
      /* Links e botões de texto */
      .text-primary, .text-primary-foreground,
      .link, a[class*="text-primary"] {
        color: ${colors.primary} !important;
      }
      
      /* Ícones em botões - usar cor de texto para contraste */
      .bg-primary svg, .bg-primary-500 svg,
      button[data-variant="default"] svg {
        color: ${colors.text} !important;
      }
      
      /* Override para qualquer elemento que possa estar usando cores padrão */
      *[class*="bg-pink"], *[class*="bg-rose"],
      *[class*="text-pink"], *[class*="text-rose"],
      *[class*="border-pink"], *[class*="border-rose"] {
        background-color: ${colors.primary} !important;
        color: ${colors.primary} !important;
        border-color: ${colors.primary} !important;
      }
      
      /* === GARANTIR QUE TEXTO EM FUNDOS PRIMÁRIOS NUNCA FIQUE TRANSPARENTE === */
      
      /* Qualquer elemento com fundo primário deve ter texto da cor de texto */
      .bg-primary, .bg-primary-500, .bg-primary-600, .bg-primary-700,
      [class*="bg-primary"], [style*="background-color: ${colors.primary}"] {
        color: ${colors.text} !important;
      }
      
      /* Texto e ícones dentro de elementos com fundo primário */
      .bg-primary *, .bg-primary-500 *, .bg-primary-600 *, .bg-primary-700 *,
      [class*="bg-primary"] *, [style*="background-color: ${colors.primary}"] * {
        color: ${colors.text} !important;
      }
      
      /* Específico para botões com fundo primário */
      button.bg-primary, button[class*="bg-primary"],
      .btn.bg-primary, .btn[class*="bg-primary"] {
        color: ${colors.text} !important;
      }
      
      button.bg-primary *, button[class*="bg-primary"] *,
      .btn.bg-primary *, .btn[class*="bg-primary"] * {
        color: ${colors.text} !important;
      }
      
      /* Específico para badges com fundo primário */
      .badge.bg-primary, .badge[class*="bg-primary"],
      [data-badge].bg-primary, [data-badge][class*="bg-primary"] {
        color: ${colors.text} !important;
      }
      
      .badge.bg-primary *, .badge[class*="bg-primary"] *,
      [data-badge].bg-primary *, [data-badge][class*="bg-primary"] * {
        color: ${colors.text} !important;
      }
      
      /* Override universal para qualquer elemento que tenha fundo primário */
      *[style*="background-color: ${colors.primary}"],
      *[style*="background: ${colors.primary}"] {
        color: ${colors.text} !important;
      }
      
      *[style*="background-color: ${colors.primary}"] *,
      *[style*="background: ${colors.primary}"] * {
        color: ${colors.text} !important;
      }
      
      /* === OVERRIDE ULTRA ESPECÍFICO PARA GARANTIR CONTRASTE === */
      
      /* Forçar cor de texto em qualquer elemento com fundo primário */
      .bg-primary, .bg-primary-500, .bg-primary-600, .bg-primary-700,
      .bg-primary-800, .bg-primary-900,
      [class*="bg-primary"], [data-bg*="primary"] {
        color: ${colors.text} !important;
        --tw-text-opacity: 1 !important;
        opacity: 1 !important;
      }
      
      /* Forçar cor de texto em todos os filhos de elementos com fundo primário */
      .bg-primary *, .bg-primary-500 *, .bg-primary-600 *, .bg-primary-700 *,
      .bg-primary-800 *, .bg-primary-900 *,
      [class*="bg-primary"] *, [data-bg*="primary"] * {
        color: ${colors.text} !important;
        --tw-text-opacity: 1 !important;
        opacity: 1 !important;
      }
      
      /* Específico para elementos que podem ter transparência */
      .bg-primary span, .bg-primary p, .bg-primary div, .bg-primary button,
      .bg-primary-500 span, .bg-primary-500 p, .bg-primary-500 div, .bg-primary-500 button,
      [class*="bg-primary"] span, [class*="bg-primary"] p, [class*="bg-primary"] div, [class*="bg-primary"] button {
        color: ${colors.text} !important;
        --tw-text-opacity: 1 !important;
        opacity: 1 !important;
      }
    `

        console.log('✅ Branding simplificado aplicado:', colors)
    } catch (error) {
        console.warn('⚠️ Erro ao aplicar branding:', error)
    }
}

/**
 * Clear cache
 */
export function clearSimpleBrandingCache() {
    cachedColors = null
    lastFetch = 0
}

/**
 * Update a single color and apply immediately
 */
export async function updateColor(key: keyof SimpleBrandingColors, value: string | 'light' | 'dark') {
    if (!cachedColors) {
        cachedColors = await getColors()
    }

    // @ts-ignore
    cachedColors[key] = value
    await applySimpleBranding()
}

