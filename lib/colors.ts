/**
 * Configuração Centralizada de Cores
 * 
 * Altere apenas os valores abaixo para mudar as cores em todo o sistema
 */

// Cores padrão
const DEFAULT_COLORS = {
  primary: '#E8B8D9',        // Rosa claro - cor principal
  primaryDark: '#543949',    // Rosa escuro - cor secundária
}

// Função para obter cores (com fallback para localStorage)
function getColors() {
  if (typeof window === 'undefined') return DEFAULT_COLORS
  
  const customPrimary = localStorage.getItem('custom-primary')
  const customPrimaryDark = localStorage.getItem('custom-primary-dark')
  
  return {
    primary: customPrimary || DEFAULT_COLORS.primary,
    primaryDark: customPrimaryDark || DEFAULT_COLORS.primaryDark,
  }
}

export const COLORS = {
  // Cores principais - carregadas dinamicamente
  ...getColors(),
  
  // Cores derivadas (calculadas automaticamente)
  primaryLight: '#F4D4E8',   // Rosa mais claro
  primaryHover: '#D4A8C9',  // Rosa para hover
  
  // Cores de texto
  textPrimary: '#1a1a1a',    // Texto principal
  textSecondary: '#6b7280',  // Texto secundário
  textLight: '#ffffff',      // Texto claro (para fundos escuros)
  
  // Cores de fundo
  background: '#ffffff',     // Fundo principal
  backgroundSecondary: '#f9fafb', // Fundo secundário
  
  // Cores de status (fixas)
  success: '#10B981',        // Verde
  warning: '#F59E0B',        // Laranja
  error: '#EF4444',          // Vermelho
  info: '#3B82F6',           // Azul
  
  // Cores de borda
  border: '#e5e7eb',         // Borda padrão
  borderLight: '#f3f4f6',    // Borda clara
} as const

/**
 * Aplica as cores como variáveis CSS no documento
 */
export function applyColors() {
  if (typeof window === 'undefined') return
  
  const root = document.documentElement
  const colors = getColors()
  const isDark = root.classList.contains('dark')
  
  // Aplicar todas as cores como variáveis CSS
  Object.entries(COLORS).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })
  
  // Aplicar cores específicas do Tailwind baseadas no modo
  if (isDark) {
    // Modo escuro: usar cor escura como primária para botões/fundos
    root.style.setProperty('--primary', colors.primaryDark)
    root.style.setProperty('--primary-foreground', COLORS.textLight)
    root.style.setProperty('--secondary', colors.primary)
    root.style.setProperty('--secondary-foreground', COLORS.textLight)
    
    // Cores do sidebar no modo escuro
    root.style.setProperty('--sidebar-primary', colors.primaryDark)
    root.style.setProperty('--sidebar-primary-foreground', COLORS.textLight)
    root.style.setProperty('--sidebar-ring', colors.primaryDark)
  } else {
    // Modo claro: usar cor clara como primária para botões/fundos
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--primary-foreground', COLORS.textLight)
    root.style.setProperty('--secondary', colors.primaryDark)
    root.style.setProperty('--secondary-foreground', COLORS.textLight)
    
    // Cores do sidebar no modo claro
    root.style.setProperty('--sidebar-primary', colors.primary)
    root.style.setProperty('--sidebar-primary-foreground', COLORS.textLight)
    root.style.setProperty('--sidebar-ring', colors.primary)
  }
  
  // IMPORTANTE: Manter cores rosa fixas para ícones e elementos específicos
  // Estas cores sempre mantêm os valores originais, independente do modo
  root.style.setProperty('--color-primary-fixed', colors.primary) // Sempre rosa claro
  root.style.setProperty('--color-primaryDark-fixed', colors.primaryDark) // Sempre rosa escuro
}

/**
 * Obtém uma cor pelo nome
 */
export function getColor(colorName: keyof typeof COLORS): string {
  return COLORS[colorName]
}

/**
 * Obtém todas as cores
 */
export function getAllColors() {
  return COLORS
}
