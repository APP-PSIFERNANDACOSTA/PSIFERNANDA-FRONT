import { DashboardLayout } from "@/components/dashboard-layout"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando paciente...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}


