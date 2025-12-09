"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useThemeWithSession } from "@/hooks/use-theme-session"

export function ThemeToggle() {
  const { theme, setTheme } = useThemeWithSession()
  const [mounted, setMounted] = useState(false)

  // Evitar hidratação incorreta
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      case "system":
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="relative"
      title={`Tema atual: ${theme === "system" ? "Sistema" : theme === "light" ? "Claro" : "Escuro"}`}
    >
      {getIcon()}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
