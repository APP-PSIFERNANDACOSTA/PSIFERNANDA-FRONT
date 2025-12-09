"use client"

import React, { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { ProtectedRoute } from "./protected-route"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
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
    localStorage.setItem("sidebarCollapsed", String(newState))
  }

  const toggleSidebar = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSidebarOpen(prev => {
      const newValue = !prev
      // Prevent immediate closing
      if (newValue) {
        // Force a small delay to ensure state is set
        setTimeout(() => {}, 0)
      }
      return newValue
    })
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <ProtectedRoute allowedRoles={['psychologist']}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={handleCloseSidebar}
          onToggleCollapse={toggleCollapse}
        />
        <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
          <Topbar onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
