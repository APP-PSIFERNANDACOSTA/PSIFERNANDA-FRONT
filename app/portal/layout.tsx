"use client"

import type React from "react"
import { PortalDashboardLayout } from "@/components/portal-dashboard-layout"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalDashboardLayout>{children}</PortalDashboardLayout>
}
