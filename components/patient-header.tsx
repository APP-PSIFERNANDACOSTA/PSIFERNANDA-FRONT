"use client"

import { Bell, LogOut, User, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PatientHeaderProps {
  onMenuClick?: () => void
}

export function PatientHeader({ onMenuClick }: PatientHeaderProps) {
  const { user, logout } = useAuth()
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 lg:h-16 items-center justify-between px-3 sm:px-6">
        {/* Logo/Brand em mobile - mais compacto */}
        <div className="flex items-center gap-2 lg:hidden">
          <Image
            src="/simbolo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-sm font-semibold text-foreground">Portal</span>
        </div>
        
        {/* Espaço vazio no desktop para empurrar ícones para direita */}
        <div className="hidden lg:block flex-1"></div>

        {/* Ações à direita */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 lg:h-9 lg:w-9">
            {isDark ? <Sun className="h-4 w-4 lg:h-5 lg:w-5" /> : <Moon className="h-4 w-4 lg:h-5 lg:w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative h-8 w-8 lg:h-9 lg:w-9 hidden sm:flex">
            <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9">
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
