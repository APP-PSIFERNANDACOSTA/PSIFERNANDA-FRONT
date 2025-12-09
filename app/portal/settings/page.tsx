"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Bell, Lock, Download, HelpCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function ConfiguracoesPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="mt-2 text-muted-foreground">Gerencie suas preferências e informações pessoais</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Perfil
          </CardTitle>
          <CardDescription>Suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                Alterar Foto
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou GIF. Máx 2MB</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" defaultValue={user?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Data de Nascimento</Label>
              <Input id="birthdate" type="date" />
            </div>
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>Gerencie como você recebe notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes de Sessão</Label>
              <p className="text-sm text-muted-foreground">Receba lembretes antes das suas sessões</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Novas Mensagens</Label>
              <p className="text-sm text-muted-foreground">Notificações de mensagens da psicóloga</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tarefas Pendentes</Label>
              <p className="text-sm text-muted-foreground">Lembretes de exercícios e tarefas</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Novos Recursos</Label>
              <p className="text-sm text-muted-foreground">Quando novos materiais forem adicionados</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Segurança e Privacidade
          </CardTitle>
          <CardDescription>Gerencie sua senha e privacidade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Alterar Senha</Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Seus Dados
          </CardTitle>
          <CardDescription>Gerencie seus dados pessoais conforme a LGPD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Baixar Meus Dados
          </Button>
          <p className="text-xs text-muted-foreground">
            Você pode solicitar uma cópia de todos os seus dados armazenados no sistema
          </p>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Ajuda e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            Central de Ajuda
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            Entrar em Contato
          </Button>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium text-foreground">Emergências</p>
            <p className="mt-1 text-muted-foreground">
              Em caso de emergência, ligue para 188 (CVV) ou 192 (SAMU). Este não é um canal de atendimento emergencial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
