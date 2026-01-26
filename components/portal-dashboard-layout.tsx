"use client"

import React, { useState, useEffect } from "react"
import { PortalSidebar } from "./portal-sidebar"
import { PortalBottomNav } from "./portal-bottom-nav"
import { PatientHeader } from "./patient-header"
import { ProtectedRoute } from "./protected-route"

export function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("portalSidebarCollapsed")
        if (saved !== null) {
            setSidebarCollapsed(saved === "true")
        }
    }, [])

    // Close sidebar on ESC key press (mobile)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false)
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [sidebarOpen])

    // Save collapsed state to localStorage
    const toggleCollapse = () => {
        const newState = !sidebarCollapsed
        setSidebarCollapsed(newState)
        localStorage.setItem("portalSidebarCollapsed", String(newState))
    }

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev)
    }

    const handleCloseSidebar = () => {
        setSidebarOpen(false)
    }

    return (
        <ProtectedRoute allowedRoles={['patient']}>
            <div className="flex h-screen overflow-hidden">
                <PortalSidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    onClose={handleCloseSidebar}
                    onToggleCollapse={toggleCollapse}
                />
                <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
                    <PatientHeader onMenuClick={toggleSidebar} />
                    <main className="flex-1 overflow-y-auto bg-background px-5 py-6 sm:p-6 lg:pb-6" style={{ paddingBottom: 'calc(92px + 24px + env(safe-area-inset-bottom, 0px))' }}>
                        <div className="flex min-h-full flex-col">
                            <div className="flex-1">{children}</div>
                            <footer className="mt-8 border-t pt-4 text-center sm:text-right text-xs text-muted-foreground lg:block hidden">
                                © {new Date().getFullYear()} Psicóloga Fernanda Costa. Todos os direitos reservados.
                            </footer>
                        </div>
                    </main>
                    {/* Bottom Navigation - Mobile only */}
                    <PortalBottomNav />
                </div>
            </div>
        </ProtectedRoute>
    )
}

