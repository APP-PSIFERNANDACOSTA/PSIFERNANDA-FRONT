"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, User, Bell, Shield, Database, Image } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: "Personalizar Cores",
      description: "Apenas 2 cores simples para todo o sistema",
      icon: Palette,
      href: "/settings/colors",
      color: "bg-pink-500",
    },
    {
      title: "Perfil e Conta",
      description: "Gerencie suas informações pessoais e profissionais",
      icon: User,
      href: "/settings/profile",
      color: "bg-blue-500",
    },
    {
      title: "Notificações",
      description: "Configure alertas e notificações do sistema",
      icon: Bell,
      href: "/settings/notifications",
      color: "bg-green-500",
    },
    {
      title: "Segurança",
      description: "Senhas, autenticação e configurações de segurança",
      icon: Shield,
      href: "/settings/security",
      color: "bg-red-500",
    },
    {
      title: "Backup e Dados",
      description: "Exportar dados, backup e configurações do banco",
      icon: Database,
      href: "/settings/backup",
      color: "bg-purple-500",
    },
    {
      title: "Integrações",
      description: "APIs, webhooks e integrações externas",
      icon: Image,
      href: "/settings/integrations",
      color: "bg-orange-500",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Configurações</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie todas as configurações do sistema e personalize sua experiência
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category) => (
            <Link key={category.href} href={category.href}>
              <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-3 p-0 h-auto">
                    Configurar →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <Palette className="w-4 h-4 mr-2" />
                Alterar Tema
              </Button>
              <Button variant="outline" className="justify-start">
                <Database className="w-4 h-4 mr-2" />
                Exportar Dados
              </Button>
              <Button variant="outline" className="justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Verificar Segurança
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}