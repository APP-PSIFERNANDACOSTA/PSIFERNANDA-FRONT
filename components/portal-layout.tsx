"use client"

import React from "react"
import { ProtectedRoute } from "./protected-route"

export function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['patient']}>
            {children}
        </ProtectedRoute>
    )
}

