"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Brain, Calendar, TrendingUp, BarChart3, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import diaryService from "@/services/diary-service"
import type { WeeklyAnalysisResponse } from "@/types/diary"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

interface WeeklyAnalysisDropdownProps {
  patientId: number
  patientName: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WeeklyAnalysisDropdown({ 
  patientId, 
  patientName, 
  isOpen = false, 
  onOpenChange 
}: WeeklyAnalysisDropdownProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<WeeklyAnalysisResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)

  const periods = [
    { days: 7, label: "7 dias", icon: Calendar },
    { days: 15, label: "15 dias", icon: TrendingUp },
    { days: 30, label: "30 dias", icon: BarChart3 },
  ]

  const handleAnalyze = async (days: number) => {
    setIsAnalyzing(true)
    setSelectedPeriod(days)
    
    try {
      console.log('🔍 Iniciando análise para paciente:', patientId, 'dias:', days)
      const response = await diaryService.analyzeWeekly(patientId, days)
      console.log('✅ Resposta recebida:', response)
      console.log('📊 Estrutura da resposta:', {
        success: response.success,
        hasAnalysis: !!response.analysis,
        hasPeriod: !!response.period,
        analysisKeys: response.analysis ? Object.keys(response.analysis) : null,
        analysisFull: response.analysis,
        hasSummary: !!(response.analysis?.summary),
        summaryPreview: response.analysis?.summary ? response.analysis.summary.substring(0, 100) : null
      })
      
      // Verificar se a resposta foi bem-sucedida e tem dados
      if (!response.success || !response.analysis) {
        throw new Error(response.message || 'Nenhuma entrada encontrada no período selecionado')
      }
      
      setAnalysis(response)
      console.log('💾 Estado analysis atualizado')
      // Abre o dropdown automaticamente após um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        console.log('🔓 Abrindo dropdown automaticamente')
        onOpenChange?.(true)
      }, 100)
      showSuccessToast(
        "Análise concluída!",
        `Análise dos últimos ${days} dias gerada com sucesso. Clique no cabeçalho acima para ver o resumo.`
      )
    } catch (error: any) {
      console.error('❌ Erro na análise:', error)
      console.error('📝 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      const errorMessage = error.message || error.response?.data?.message || "Tente novamente mais tarde"
      
      // Mensagem mais clara se não houver entradas
      if (errorMessage.includes('Nenhuma entrada') || errorMessage.includes('entrada encontrada')) {
        showErrorToast(
          "Nenhuma entrada encontrada",
          `Não há entradas de diário nos últimos ${days} dias. Tente selecionar um período maior (30 dias).`
        )
      } else {
      showErrorToast(
        "Erro na análise",
          errorMessage
      )
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getMoodLabel = (mood: string) => {
    const labels = {
      'great': 'Ótimo',
      'good': 'Bem', 
      'neutral': 'Neutro',
      'sad': 'Triste',
      'very-sad': 'Muito Triste'
    }
    return labels[mood as keyof typeof labels] || mood
  }

  const getMoodColor = (mood: string) => {
    const colors = {
      'great': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'good': 'bg-green-50 text-green-700 border-green-200',
      'neutral': 'bg-blue-50 text-blue-700 border-blue-200',
      'sad': 'bg-pink-50 text-pink-700 border-pink-200',
      'very-sad': 'bg-purple-50 text-purple-700 border-purple-200'
    }
    return colors[mood as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  // Debug: verificar estado
  console.log('🔍 WeeklyAnalysisDropdown render:', {
    isOpen,
    hasAnalysis: !!analysis,
    hasAnalysisAnalysis: !!analysis?.analysis,
    isAnalyzing
  })

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Brain className="h-5 w-5" style={{ color: 'var(--color-primary-fixed)' }} />
                Análise Inteligente dos Diários
                {analysis && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                    Concluída
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {analysis && analysis.period && (
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {analysis.period.entries_count} entradas analisadas
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {analysis 
                ? `Análise concluída! Clique para ${isOpen ? 'ocultar' : 'ver'} o resumo detalhado`
                : `Análise semanal dos diários de ${patientName} usando IA`
              }
            </p>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {console.log('📦 CollapsibleContent renderizando, isOpen:', isOpen)}
          <CardContent className="pt-0 space-y-4">
            {/* Botões de período */}
            <div className="flex gap-2 flex-wrap">
              {periods.map((period) => (
                <Button
                  key={period.days}
                  onClick={() => handleAnalyze(period.days)}
                  disabled={isAnalyzing}
                  variant="outline"
                  className={`gap-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 ${
                    selectedPeriod === period.days ? 'bg-gray-100 border-gray-400' : ''
                  }`}
                >
                  <period.icon className="h-4 w-4" />
                  {period.label}
                </Button>
              ))}
            </div>

            {/* Loading */}
            {isAnalyzing && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Analisando diários dos últimos {selectedPeriod} dias...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    A IA está processando as informações emocionais
                  </p>
                </div>
              </div>
            )}

            {/* Resultado da análise */}
            {analysis && !isAnalyzing && (analysis.analysis || analysis) && (
              <div className="space-y-4">
                {console.log('🎨 Renderizando resumo da análise:', {
                  hasAnalysis: !!analysis,
                  hasAnalysisAnalysis: !!analysis.analysis,
                  analysisKeys: analysis ? Object.keys(analysis) : null,
                  analysisAnalysisKeys: analysis.analysis ? Object.keys(analysis.analysis) : null,
                  hasSummary: !!(analysis.analysis?.summary || analysis.summary),
                  summaryLength: (analysis.analysis?.summary || analysis.summary)?.length
                })}
                {/* Resumo da análise - usando analysis.analysis ou fallback para analysis */}
                {(analysis.analysis || analysis) && (
                  <div className="bg-white rounded-lg border-2 border-primary/20 shadow-sm p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5" style={{ color: 'var(--color-primary-fixed)' }} />
                    Análise Detalhada da IA
                      {(analysis.analysis?.ai_generated ?? analysis.ai_generated) && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          ✨ IA
                        </Badge>
                      )}
                      {!(analysis.analysis?.ai_generated ?? analysis.ai_generated) && (
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
                          📊 Automática
                      </Badge>
                    )}
                  </h4>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {(() => {
                        const summary = analysis.analysis?.summary || analysis.summary || null;
                        console.log('📝 Tentando exibir resumo:', {
                          hasAnalysisAnalysis: !!analysis.analysis,
                          hasAnalysisAnalysisSummary: !!analysis.analysis?.summary,
                          hasAnalysisSummary: !!analysis.summary,
                          summaryLength: summary?.length,
                          summaryPreview: summary ? summary.substring(0, 50) : null
                        });
                        if (!summary) {
                          console.warn('⚠️ Resumo não encontrado! Estrutura completa:', analysis);
                        }
                        return summary || 'Resumo não disponível';
                      })()}
                    </div>
                  </div>
                )}

                {/* Distribuição de humor */}
                {(analysis.analysis?.mood_distribution || analysis.mood_distribution) && 
                 Object.keys(analysis.analysis?.mood_distribution || analysis.mood_distribution || {}).length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Distribuição de Humor</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(analysis.analysis?.mood_distribution || analysis.mood_distribution || {}).map(([mood, count]) => (
                        <Badge
                          key={mood}
                          variant="outline"
                          className={`text-sm ${getMoodColor(mood)}`}
                        >
                          {getMoodLabel(mood)}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Temas recorrentes */}
                {(analysis.analysis?.common_themes || analysis.common_themes) && 
                 (analysis.analysis?.common_themes || analysis.common_themes)?.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Temas Recorrentes</h4>
                    <div className="flex flex-wrap gap-2">
                      {(analysis.analysis?.common_themes || analysis.common_themes || []).map((theme: string) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="text-sm bg-gray-50 text-gray-700 border-gray-300"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Período analisado */}
                {analysis.period && (
                <div className="text-xs text-gray-600 text-center bg-gray-50 rounded-lg p-2">
                  <strong>Período analisado:</strong> {new Date(analysis.period.start_date).toLocaleDateString("pt-BR")} até{" "}
                  {new Date(analysis.period.end_date).toLocaleDateString("pt-BR")}
                </div>
                )}
              </div>
            )}

            {/* Estado inicial */}
            {!analysis && !isAnalyzing && (
              <div className="text-center py-6">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" style={{ color: 'var(--color-primary-fixed)' }} />
                <p className="text-sm text-gray-600 mb-2">
                  Clique em um período para analisar os diários
                </p>
                <p className="text-xs text-gray-500">
                  A IA irá identificar padrões emocionais e temas recorrentes
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
