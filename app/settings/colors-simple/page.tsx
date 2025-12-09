"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Palette, Save, RotateCcw } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import { useColors } from "@/hooks/use-colors"
import { useTheme } from "next-themes"

export default function ColorsPage() {
    const [primary, setPrimary] = useState('#E8B8D9')
    const [primaryDark, setPrimaryDark] = useState('#543949')
    const [loading, setLoading] = useState(false)
    const { colors, refreshColors } = useColors()
    const { theme } = useTheme()

    // Carregar cores atuais
    useEffect(() => {
        setPrimary(colors.primary)
        setPrimaryDark(colors.primaryDark)
    }, [colors])

    const handleSave = async () => {
        setLoading(true)
        try {
            // Aqui você pode salvar as cores em localStorage ou enviar para o backend
            localStorage.setItem('custom-primary', primary)
            localStorage.setItem('custom-primary-dark', primaryDark)
            
            // Aplicar as cores imediatamente
            document.documentElement.style.setProperty('--color-primary', primary)
            document.documentElement.style.setProperty('--color-primaryDark', primaryDark)
            document.documentElement.style.setProperty('--primary', primary)
            document.documentElement.style.setProperty('--secondary', primaryDark)
            
            // Recarregar cores no hook
            refreshColors()
            
            showSuccessToast(
                "Cores atualizadas!",
                "As novas cores foram aplicadas em todo o sistema"
            )
        } catch (error: any) {
            showErrorToast(
                "Erro ao salvar cores",
                "Tente novamente mais tarde"
            )
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setPrimary('#E8B8D9')
        setPrimaryDark('#543949')
        showSuccessToast("Cores resetadas", "Clique em 'Salvar' para aplicar")
    }

    const presetColors = [
        { name: 'Rosa Atual', primary: '#E8B8D9', primaryDark: '#543949' },
        { name: 'Azul', primary: '#60A5FA', primaryDark: '#1e3a8a' },
        { name: 'Verde', primary: '#34D399', primaryDark: '#064e3b' },
        { name: 'Roxo', primary: '#A78BFA', primaryDark: '#4c1d95' },
        { name: 'Laranja', primary: '#FB923C', primaryDark: '#7c2d12' },
        { name: 'Vermelho', primary: '#F87171', primaryDark: '#7f1d1d' },
    ]

    const applyPreset = (preset: typeof presetColors[0]) => {
        setPrimary(preset.primary)
        setPrimaryDark(preset.primaryDark)
        showSuccessToast(`Preset "${preset.name}" aplicado`, "Clique em 'Salvar' para confirmar")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Configuração de Cores</h1>
                    <p className="text-gray-600 mt-2">
                        Altere as cores principais do sistema. As mudanças serão aplicadas em todo o site.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Configuração de Cores */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Cores Principais
                            </CardTitle>
                            <CardDescription>
                                Defina as cores principais que serão usadas em todo o sistema
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="primary">Cor Principal (Rosa Claro)</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="primary"
                                        type="color"
                                        value={primary}
                                        onChange={(e) => setPrimary(e.target.value)}
                                        className="w-16 h-10 p-1 border rounded"
                                    />
                                    <Input
                                        type="text"
                                        value={primary}
                                        onChange={(e) => setPrimary(e.target.value)}
                                        placeholder="#E8B8D9"
                                        className="flex-1"
                                    />
                                </div>
                                <div 
                                    className="w-full h-8 rounded border"
                                    style={{ backgroundColor: primary }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="primaryDark">Cor Secundária (Rosa Escuro)</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="primaryDark"
                                        type="color"
                                        value={primaryDark}
                                        onChange={(e) => setPrimaryDark(e.target.value)}
                                        className="w-16 h-10 p-1 border rounded"
                                    />
                                    <Input
                                        type="text"
                                        value={primaryDark}
                                        onChange={(e) => setPrimaryDark(e.target.value)}
                                        placeholder="#543949"
                                        className="flex-1"
                                    />
                                </div>
                                <div 
                                    className="w-full h-8 rounded border"
                                    style={{ backgroundColor: primaryDark }}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSave} disabled={loading} className="flex-1">
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? "Salvando..." : "Salvar Cores"}
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview das Cores</CardTitle>
                            <CardDescription>
                                Veja como as cores ficarão no sistema (modo {theme})
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div 
                                        className="px-4 py-2 rounded text-white font-medium"
                                        style={{ backgroundColor: primary }}
                                    >
                                        Botão Principal
                                    </div>
                                    <div 
                                        className="px-4 py-2 rounded text-white font-medium"
                                        style={{ backgroundColor: primaryDark }}
                                    >
                                        Botão Secundário
                                    </div>
                                </div>
                                
                                <div 
                                    className="p-4 rounded border"
                                    style={{ 
                                        backgroundColor: primary,
                                        color: '#ffffff'
                                    }}
                                >
                                    <h4 className="font-semibold">Card com Cor Principal</h4>
                                    <p className="text-sm opacity-90">Este é um exemplo de como ficará um card com a cor principal.</p>
                                </div>

                                <div 
                                    className="p-4 rounded border"
                                    style={{ 
                                        backgroundColor: primaryDark,
                                        color: '#ffffff'
                                    }}
                                >
                                    <h4 className="font-semibold">Card com Cor Secundária</h4>
                                    <p className="text-sm opacity-90">Este é um exemplo de como ficará um card com a cor secundária.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Presets */}
                <Card>
                    <CardHeader>
                        <CardTitle>Presets de Cores</CardTitle>
                        <CardDescription>
                            Escolha um conjunto de cores pré-definido
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {presetColors.map((preset) => (
                                <Button
                                    key={preset.name}
                                    variant="outline"
                                    onClick={() => applyPreset(preset)}
                                    className="h-auto p-4 flex flex-col gap-2"
                                >
                                    <div className="flex gap-1">
                                        <div 
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: preset.primary }}
                                        />
                                        <div 
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: preset.primaryDark }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{preset.name}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
