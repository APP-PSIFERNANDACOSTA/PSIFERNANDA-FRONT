"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Brain, BookOpen, Heart, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/portal", label: "Início", icon: Home },
  { href: "/portal/sessions", label: "Sessões", icon: Calendar },
  { href: "/portal/quiz", label: "Quiz", icon: Brain },
  { href: "/portal/diary", label: "Diário", icon: Heart },
  { href: "/portal/exercises", label: "Exercícios", icon: BookOpen },
  { href: "/portal/financial", label: "Financeiro", icon: DollarSign },
]

export function PatientNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "text-primary border border-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
