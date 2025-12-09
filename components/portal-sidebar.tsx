"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home,
    Calendar,
    Brain,
    Heart,
    BookOpen,
    MessageCircle,
    DollarSign,
    Settings,
    User,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
} from "lucide-react"
import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useThemeWithSession } from "@/hooks/use-theme-session"

const navigation = [
    { name: "Início", href: "/portal", icon: Home },
    { name: "Minhas Sessões", href: "/portal/sessions", icon: Calendar },
    { name: "Quiz", href: "/portal/quiz", icon: Brain },
    { name: "Diário Pessoal", href: "/portal/diary", icon: Heart },
    { name: "Meus Contratos", href: "/portal/contracts", icon: FileText },
    { name: "Exercícios", href: "/portal/exercises", icon: BookOpen },
    // { name: "Recursos", href: "/portal/resources", icon: BookOpen }, // Temporariamente oculto
    { name: "Financeiro", href: "/portal/financial", icon: DollarSign },
    { name: "Meu Perfil", href: "/portal/profile", icon: User },
]

interface PortalSidebarProps {
    isOpen: boolean
    isCollapsed: boolean
    onClose: () => void
    onToggleCollapse: () => void
}

export function PortalSidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: PortalSidebarProps) {
    const pathname = usePathname()
    const { user } = useAuth()
    const { theme, resolvedTheme } = useThemeWithSession()
    const prevPathnameRef = useRef(pathname)
    const isDark = resolvedTheme === 'dark' || theme === 'dark'
    
    // Close sidebar on route change (mobile only) - but only after navigation completes
    useEffect(() => {
        if (!isOpen) return // Don't do anything if sidebar is closed
        
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
        if (!isMobile) return // Only on mobile
        
        // Only close if pathname actually changed
        if (prevPathnameRef.current === pathname) {
            return // Pathname hasn't changed, don't close
        }
        
        // Update ref before closing
        prevPathnameRef.current = pathname
        
        // Close sidebar after navigation completes
        const timer = setTimeout(() => {
            onClose()
        }, 300) // Wait for navigation to complete
        
        return () => clearTimeout(timer)
    }, [pathname, isOpen, onClose])

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    return (
        <>
            {/* Sidebar - render FIRST to ensure proper z-index stacking */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-[50] h-screen border-r border-border bg-sidebar transition-transform duration-300 ease-in-out will-change-transform",
                    // Desktop: sempre visível
                    "hidden lg:flex lg:translate-x-0",
                    // Mobile: drawer que aparece quando isOpen
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    // Width
                    isCollapsed ? "lg:w-20" : "lg:w-64",
                    "w-64" // Always full width on mobile
                )}
                aria-hidden={!isOpen}
                role="complementary"
            >
                <div className="flex h-full flex-col">
                    {/* Logo/Header */}
                    <div className="flex flex-col h-auto py-1 border-b border-sidebar-border px-4 pr-10 relative">
                        <div className="flex items-center min-w-0 flex-1 lg:justify-start">
                            <Link 
                                href="/portal" 
                                className="flex w-full shrink-0 items-center lg:justify-start justify-start pl-3 lg:pl-3"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Close sidebar on mobile when clicking logo
                                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                        setTimeout(() => onClose(), 100)
                                    }
                                }}
                            >
                                {isCollapsed ? (
                                    <Image
                                        src="/simbolo.png"
                                        alt="Símbolo"
                                        width={40}
                                        height={40}
                                        className="rounded-lg"
                                    />
                                ) : (
                                    <Image
                                        src={isDark ? "/logowhite.png" : "/logopdfrecibo.png"}
                                        alt="Logo"
                                        width={180}
                                        height={60}
                                        className="rounded-lg object-contain m-2"
                                        style={{ maxHeight: '50px', height: 'auto', width: 'auto' }}
                                    />
                                )}
                            </Link>
                        </div>

                        {/* Mobile: Close button - sempre visível no mobile */}
                        <button
                            onClick={onClose}
                            className="lg:hidden rounded-lg p-2 hover:bg-sidebar-accent transition-colors flex-shrink-0 ml-2"
                            aria-label="Fechar menu"
                        >
                            <X className="h-5 w-5 text-sidebar-foreground" />
                        </button>

                        {/* Desktop: Toggle collapse button - Fora do sidebar */}
                        <button
                            onClick={onToggleCollapse}
                            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 bg-sidebar border border-sidebar-border hover:bg-sidebar-accent transition-colors shadow-md"
                            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
                            ) : (
                                <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
                            )}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
                        {navigation.map((item) => {
                            // Check if pathname matches exactly or starts with the href (for sub-routes)
                            // Special case: "/portal" should only be active when pathname is exactly "/portal"
                            const isActive = item.href === "/portal" 
                                ? pathname === item.href
                                : pathname === item.href || pathname?.startsWith(item.href + '/')
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    title={isCollapsed ? item.name : undefined}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // Close sidebar on mobile when clicking a link
                                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                            setTimeout(() => onClose(), 100)
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "text-primary" // simple-branding.ts will handle border and background
                                            : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                                        isCollapsed && "lg:justify-center"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    <span className={cn(isCollapsed && "lg:hidden")}>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="border-t border-sidebar-border p-4">
                        <div
                            className={cn(
                                "flex items-center gap-3",
                                isCollapsed && "lg:justify-center"
                            )}
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                                <User className="h-5 w-5 text-primary-foreground" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0 lg:block hidden">
                                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                                        {user?.name || 'Paciente'}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-xs text-muted-foreground">Online</span>
                                    </div>
                                </div>
                            )}
                            {/* Mobile: Always show */}
                            <div className="flex-1 min-w-0 lg:hidden">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {user?.name || 'Paciente'}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs text-muted-foreground">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile - render AFTER sidebar to ensure proper z-index stacking */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[45] bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onClose()
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onClose()
                    }}
                    aria-hidden="true"
                />
            )}
        </>
    )
}

