"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home,
    Calendar,
    Brain,
    Heart,
    User,
    NotebookPen,
} from "lucide-react"

const navigation = [
    { name: "Início", href: "/portal", icon: Home },
    { name: "Sessões", href: "/portal/sessions", icon: Calendar },
    { name: "Pós", href: "/portal/post-therapy", icon: NotebookPen },
    { name: "Quiz", href: "/portal/quiz", icon: Brain },
    { name: "Diário", href: "/portal/diary", icon: Heart },
    { name: "Perfil", href: "/portal/profile", icon: User },
]

export function PortalBottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden px-2 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
            <div className="flex h-14 items-center justify-between gap-0.5 max-w-lg mx-auto">
                {navigation.map((item) => {
                    const isActive = item.href === "/portal" 
                        ? pathname === item.href
                        : pathname === item.href || pathname?.startsWith(item.href + '/')
                    
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 px-1 py-1.5 transition-colors rounded-lg active:bg-muted/50",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 shrink-0 transition-transform",
                                isActive && "scale-110"
                            )} />
                            <span className="text-[9px] sm:text-[10px] font-medium truncate w-full text-center leading-tight px-0.5">
                                {item.name}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

