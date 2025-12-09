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

interface WeeklyAnalysisCardProps {
  patientId: number
  patientName: string
}

export function WeeklyAnalysisCard({ patientId, patientName }: WeeklyAnalysisCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<WeeklyAnalysisResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)

  const periods = [
    { days: 7, label: "7 dias", icon: Calendar },
    { days: 15, label: "15 dias", icon: TrendingUp },
    { days: 30, label: "30 dias", icon: BarChart3 },
  ]

  const handleAnalyze = async (days: number) => {
    setIsAnalyzing(true)
    setSelectedPeriod(days)
    
    try {
      const response = await diaryService.analyzeWeekly(patientId, days)
      setAnalysis(response)
      setIsAnalysisOpen(true) // Abre o dropdown automaticamente
      showSuccessToast(
        "Análise concluída!",
        `Análise dos últimos ${days} dias gerada com sucesso`
      )
    } catch (error: any) {
      showErrorToast(
        "Erro na análise",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
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

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-pink-800">
          <Brain className="h-5 w-5" />
          Análise Inteligente dos Diários
        </CardTitle>
        <p className="text-sm text-pink-600">
          Análise semanal dos diários de {patientName} usando IA
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Botões de período */}
        <div className="flex gap-2 flex-wrap">
          {periods.map((period) => (
            <Button
              key={period.days}
              onClick={() => handleAnalyze(period.days)}
              disabled={isAnalyzing}
              variant="outline"
              className={`gap-2 border-pink-300 hover:bg-pink-100 hover:border-pink-400 ${
                selectedPeriod === period.days ? 'bg-pink-100 border-pink-400' : ''
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
              <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-2" />
              <p className="text-sm text-pink-600">
                Analisando diários dos últimos {selectedPeriod} dias...
              </p>
              <p className="text-xs text-pink-500 mt-1">
                A IA está processando as informações emocionais
              </p>
            </div>
          </div>
        )}

        {/* Resultado da análise */}
        {analysis && !isAnalyzing && (
          <Collapsible open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-white border-pink-200 hover:bg-pink-50 hover:border-pink-300"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-600" />
                  <span className="font-semibold text-pink-800">
                    Análise dos últimos {analysis.period.days} dias
                  </span>
                  {analysis.analysis.ai_generated && (
                    <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-300">
                      IA
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-pink-600">
                    {analysis.period.entries_count} entradas
                  </span>
                  {isAnalysisOpen ? (
                    <ChevronUp className="h-4 w-4 text-pink-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-pink-600" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Resumo da análise */}
              <div className="bg-white rounded-lg border border-pink-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-pink-600" />
                  Análise Detalhada da IA
                </h4>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {analysis.analysis.summary}
                </div>
              </div>

              {/* Distribuição de humor */}
              {Object.keys(analysis.analysis.mood_distribution).length > 0 && (
                <div className="bg-white rounded-lg border border-pink-200 p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Distribuição de Humor</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis.analysis.mood_distribution).map(([mood, count]) => (
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
              {analysis.analysis.common_themes.length > 0 && (
                <div className="bg-white rounded-lg border border-pink-200 p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Temas Recorrentes</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysis.common_themes.map((theme) => (
                      <Badge
                        key={theme}
                        variant="outline"
                        className="text-sm bg-pink-50 text-pink-700 border-pink-300"
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Período analisado */}
              <div className="text-xs text-pink-600 text-center bg-pink-50 rounded-lg p-2">
                <strong>Período analisado:</strong> {new Date(analysis.period.start_date).toLocaleDateString("pt-BR")} até{" "}
                {new Date(analysis.period.end_date).toLocaleDateString("pt-BR")}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Estado inicial */}
        {!analysis && !isAnalyzing && (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-pink-300 mx-auto mb-3" />
            <p className="text-sm text-pink-600 mb-2">
              Clique em um período para analisar os diários
            </p>
            <p className="text-xs text-pink-500">
              A IA irá identificar padrões emocionais e temas recorrentes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
