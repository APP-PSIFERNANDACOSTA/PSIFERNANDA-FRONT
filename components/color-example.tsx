"use client"

import { useColors } from '@/hooks/use-colors'

/**
 * Componente de exemplo mostrando como usar as cores personalizadas
 */
export function ColorExample() {
  const { colors } = useColors()

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Exemplo de Uso das Cores</h3>
      
      {/* Usando cores fixas para ícones e elementos específicos */}
      <div className="flex gap-4">
        <div 
          className="p-4 rounded-lg flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-primary-fixed)', color: 'white' }}
        >
          <span>🎨</span>
          Ícone sempre rosa claro
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-primaryDark-fixed)', color: 'white' }}
        >
          <span>🎨</span>
          Ícone sempre rosa escuro
        </div>
      </div>
      
      {/* Usando cores adaptativas para botões (mudam com o modo) */}
      <div className="flex gap-4">
        <button className="px-4 py-2 rounded bg-primary text-primary-foreground">
          Botão adaptativo (muda com modo)
        </button>
        
        <button className="px-4 py-2 rounded bg-secondary text-secondary-foreground">
          Botão secundário adaptativo
        </button>
      </div>
      
      {/* Explicação */}
      <div className="p-4 bg-muted rounded-lg text-sm">
        <h4 className="font-semibold mb-2">Como usar:</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li>• <code>var(--color-primary-fixed)</code> - Sempre rosa claro (ícones)</li>
          <li>• <code>var(--color-primaryDark-fixed)</code> - Sempre rosa escuro (ícones)</li>
          <li>• <code>bg-primary</code> - Adapta ao modo (botões/fundos)</li>
          <li>• <code>bg-secondary</code> - Adapta ao modo (botões/fundos)</li>
        </ul>
      </div>
    </div>
  )
}
