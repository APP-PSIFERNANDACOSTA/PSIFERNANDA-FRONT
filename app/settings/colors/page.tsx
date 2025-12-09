"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Palette, Save, RotateCcw, Sparkles } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import brandingService from "@/services/branding-service"
import { applySimpleBranding, clearSimpleBrandingCache } from "@/lib/simple-branding"

export default function SimpleColorsPage() {
    const [primary, setPrimary] = useState('#F8BBD0')
    const [text, setText] = useState('#1a1a1a')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const loadColors = async () => {
        setLoading(true)
        try {
            const settings = await brandingService.getAll()
            setPrimary(settings.colors.primary || '#F8BBD0')
            setText(settings.colors.text || '#1a1a1a')
        } catch (error: any) {
            showErrorToast("Erro ao carregar cores", "Usando cores padrão")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadColors()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await brandingService.updateColors({
                primary,
                text,
            })

            // Limpar cache e aplicar novas cores
            clearSimpleBrandingCache()
            await applySimpleBranding()

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
            setSaving(false)
        }
    }

    const handleReset = async () => {
        setPrimary('#F8BBD0')
        setText('#1a1a1a')
        showSuccessToast("Cores resetadas", "Clique em 'Salvar' para aplicar")
    }

    const presetColors = [
        { name: 'Rosa Original', primary: '#F8BBD0', text: '#1a1a1a' },
        { name: 'Azul', primary: '#60A5FA', text: '#1e3a8a' },
        { name: 'Verde', primary: '#34D399', text: '#064e3b' },
        { name: 'Roxo', primary: '#A78BFA', text: '#4c1d95' },
        { name: 'Laranja', primary: '#FB923C', text: '#7c2d12' },
        { name: 'Vermelho', primary: '#F87171', text: '#7f1d1d' },
    ]

    const applyPreset = (preset: typeof presetColors[0]) => {
        setPrimary(preset.primary)
        setText(preset.text)
        showSuccessToast(`Preset "${preset.name}"`, "Clique em 'Salvar' para aplicar")
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando cores...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                            <Palette className="w-8 h-8" />
                            Personalizar Cores
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Apenas 2 cores simples para personalizar todo o sistema
                        </p>
                    </div>
                </div>

                {/* Alert Info */}
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <strong>Sistema Inteligente:</strong> Contraste automático para melhor legibilidade!
                                <ul className="mt-2 space-y-1 ml-4 list-disc">
                                    <li><strong>Cor Principal:</strong> Fundos de botões, links e bordas de navegação</li>
                                    <li><strong>Cor de Texto:</strong> Textos em botões primários (para contraste)</li>
                                    <li><strong>Fundos:</strong> Neutros (cinza claro/branco) para melhor legibilidade</li>
                                    <li><strong>Contraste:</strong> Texto em botões primários usa cor de texto (não some)</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Color Inputs */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cores Principais</CardTitle>
                        <CardDescription>
                            Escolha as 2 cores que representam sua marca
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Primary Color */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">
                                🎨 Cor Principal (Destaques)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Usada em fundos de botões, links e destaques importantes (texto usa cor de texto para contraste)
                            </p>
                            <div className="flex gap-4 items-center">
                                <div
                                    className="w-24 h-24 rounded-lg border-2 border-border shadow-sm"
                                    style={{ backgroundColor: primary }}
                                />
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="color"
                                        value={primary}
                                        onChange={(e) => setPrimary(e.target.value)}
                                        className="w-32 h-12 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={primary}
                                        onChange={(e) => setPrimary(e.target.value)}
                                        placeholder="#F8BBD0"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-3 pt-6 border-t">
                            <Label className="text-base font-semibold">
                                ✍️ Cor de Texto
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Cor dos textos principais, títulos e textos em botões primários (para contraste)
                            </p>
                            <div className="flex gap-4 items-center">
                                <div
                                    className="w-24 h-24 rounded-lg border-2 border-border shadow-sm"
                                    style={{ backgroundColor: text }}
                                />
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="color"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        className="w-32 h-12 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="#1a1a1a"
                                        className="font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-6 border-t">
                            <Button onClick={handleSave} disabled={saving} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? "Salvando..." : "Salvar Cores"}
                            </Button>
                            <Button variant="outline" onClick={handleReset} disabled={saving}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Resetar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Presets */}
                <Card>
                    <CardHeader>
                        <CardTitle>Paletas Prontas</CardTitle>
                        <CardDescription>
                            Clique em uma paleta para aplicar rapidamente
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {presetColors.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset)}
                                    className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all hover:shadow-md"
                                >
                                    <div className="flex gap-2 mb-2">
                                        <div
                                            className="w-12 h-12 rounded"
                                            style={{ backgroundColor: preset.primary }}
                                        />
                                        <div
                                            className="w-12 h-12 rounded"
                                            style={{ backgroundColor: preset.text }}
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        {preset.name}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>
                            Veja como ficam os elementos com suas cores
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg border bg-background">
                            <p className="text-foreground mb-4" style={{ color: text }}>
                                Este é um texto exemplo usando sua cor de texto personalizada.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <Button style={{ backgroundColor: primary }}>
                                    Botão Principal
                                </Button>
                                <Button variant="outline" style={{ borderColor: primary, color: primary }}>
                                    Botão Outline
                                </Button>
                                <a href="#" style={{ color: primary }} className="underline">
                                    Link exemplo
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

