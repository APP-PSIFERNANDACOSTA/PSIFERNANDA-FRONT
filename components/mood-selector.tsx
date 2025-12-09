"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sun, Smile, Meh, Cloud, CloudRain } from "lucide-react"
import type { MoodType } from "@/types/diary"
import { MOOD_OPTIONS } from "@/types/diary"

interface MoodSelectorProps {
    selectedMood: MoodType | ""
    onMoodSelect: (mood: MoodType) => void
    disabled?: boolean
}

const moodIcons = {
    Sun,
    Smile,
    Meh,
    Cloud,
    CloudRain,
}

export function MoodSelector({ selectedMood, onMoodSelect, disabled = false }: MoodSelectorProps) {
    return (
        <div className="grid grid-cols-5 gap-3">
            {MOOD_OPTIONS.map((mood) => {
                const Icon = moodIcons[mood.icon as keyof typeof moodIcons]
                const isSelected = selectedMood === mood.value
                
                return (
                    <button
                        key={mood.value}
                        onClick={() => !disabled && onMoodSelect(mood.value)}
                        disabled={disabled}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-accent"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        <Icon className={`h-8 w-8 ${mood.color}`} />
                        <span className="text-xs font-medium">{mood.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

