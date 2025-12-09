"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sun, Smile, Meh, Cloud, CloudRain, Eye, Edit, Trash2 } from "lucide-react"
import type { DiaryEntry, MoodType } from "@/types/diary"
import { MOOD_OPTIONS } from "@/types/diary"

interface DiaryEntryCardProps {
    entry: DiaryEntry
    onView?: (entry: DiaryEntry) => void
    onEdit?: (entry: DiaryEntry) => void
    onDelete?: (entry: DiaryEntry) => void
    showPatientName?: boolean
    readonly?: boolean
}

const moodIcons = {
    Sun,
    Smile,
    Meh,
    Cloud,
    CloudRain,
}

export function DiaryEntryCard({ 
    entry, 
    onView, 
    onEdit, 
    onDelete, 
    showPatientName = false,
    readonly = false 
}: DiaryEntryCardProps) {
    const moodOption = MOOD_OPTIONS.find(m => m.value === entry.mood)
    const Icon = moodOption ? moodIcons[moodOption.icon as keyof typeof moodIcons] : Meh

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const getPreview = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content
        return content.substring(0, maxLength) + "..."
    }

    // Parse tags se for string JSON
    const parseTags = (tags: any): string[] => {
        if (!tags) return []
        if (Array.isArray(tags)) return tags
        if (typeof tags === 'string') {
            try {
                const parsed = JSON.parse(tags)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }
        return []
    }

    const tags = parseTags(entry.tags)

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className={`h-5 w-5 ${moodOption?.color}`} />
                            <CardTitle className="text-lg">
                                {entry.title || "Entrada do Diário"}
                            </CardTitle>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                {formatDate(entry.date)}
                            </p>
                            {showPatientName && entry.patient && (
                                <p className="text-sm font-medium text-primary">
                                    {entry.patient.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge 
                            variant="default" 
                            className={`${moodOption?.bgColor} ${moodOption?.color} font-medium border-0`}
                        >
                            {moodOption?.label}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    {getPreview(entry.content)}
                </p>
                
                {(tags && tags.length > 0) || readonly ? (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                            {tags && tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        {readonly && onView && (
                            <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => onView(entry)}
                                className="gap-1 text-xs bg-pink-50 text-pink-500 hover:bg-pink-100 border-0 font-medium"
                            >
                                <Eye className="h-3 w-3" />
                                Ver
                            </Button>
                        )}
                    </div>
                ) : null}

                {!readonly && (onView || onEdit || onDelete) && (
                    <div className="flex gap-2 pt-2 border-t">
                        {onView && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onView(entry)}
                                className="gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Ver Completo
                            </Button>
                        )}
                        {onEdit && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onEdit(entry)}
                                className="gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        )}
                        {onDelete && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onDelete(entry)}
                                className="gap-2 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
