"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import authService from "@/services/auth-service"
import apiClient from "@/lib/api-client"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"
import { Loader2, Lock, User as UserIcon } from "lucide-react"

export default function PsychologistProfilePage() {
  const { user, refreshUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    crp: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        cpf: user.cpf || "",
        crp: user.crp || "",
      })
    }
  }, [user])

  const handleProfileSave = async () => {
    setIsSaving(true)
    setFieldErrors({})
    try {
      const res = await authService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || null,
        cpf: form.cpf?.trim() || null,
        crp: form.crp?.trim() || null,
      })
      if (!res.success) {
        const errs = res.errors || {}
        const flat: Record<string, string> = {}
        Object.entries(errs).forEach(([k, v]) => {
          if (Array.isArray(v) && v[0]) flat[k] = v[0]
        })
        setFieldErrors(flat)
        showErrorToast("Não foi possível salvar", res.message || "Verifique os campos.")
        return
      }
      await refreshUser()
      showSuccessToast("Perfil atualizado", "Suas informações foram salvas.")
    } catch {
      showErrorToast("Erro", "Não foi possível salvar o perfil.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      showErrorToast("Campos obrigatórios", "Preencha a senha atual e a nova senha.")
      return
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      showErrorToast("Senhas", "A nova senha e a confirmação precisam ser iguais.")
      return
    }
    setIsChangingPassword(true)
    try {
      await apiClient.getAxiosInstance().post("/auth/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      })
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      })
      showSuccessToast("Senha alterada", "Sua senha foi atualizada com sucesso.")
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Não foi possível alterar a senha. Verifique a senha atual."
      showErrorToast("Erro ao alterar senha", message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
          <p className="text-muted-foreground text-sm">
            Atualize seus dados profissionais e a senha de acesso.
          </p>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Dados pessoais
            </TabsTrigger>
            <TabsTrigger value="senha" className="gap-2">
              <Lock className="h-4 w-4" />
              Senha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Informações</CardTitle>
                <CardDescription>Nome, contato e registro profissional (CRP).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    autoComplete="name"
                  />
                  {fieldErrors.name && (
                    <p className="text-destructive text-sm">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="text-destructive text-sm">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    autoComplete="tel"
                    placeholder="Opcional"
                  />
                  {fieldErrors.phone && (
                    <p className="text-destructive text-sm">{fieldErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={form.cpf}
                    onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                  {fieldErrors.cpf && (
                    <p className="text-destructive text-sm">{fieldErrors.cpf}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crp">CRP</Label>
                  <Input
                    id="crp"
                    value={form.crp}
                    onChange={(e) => setForm((f) => ({ ...f, crp: e.target.value }))}
                    placeholder="Registro no Conselho Regional de Psicologia"
                  />
                  {fieldErrors.crp && (
                    <p className="text-destructive text-sm">{fieldErrors.crp}</p>
                  )}
                </div>
                <Button onClick={handleProfileSave} disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="senha" className="mt-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Alterar senha</CardTitle>
                <CardDescription>Informe a senha atual e escolha uma nova senha segura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Senha atual</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm((f) => ({ ...f, current_password: e.target.value }))
                    }
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova senha</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm((f) => ({ ...f, new_password: e.target.value }))
                    }
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password_confirmation">Confirmar nova senha</Label>
                  <Input
                    id="new_password_confirmation"
                    type="password"
                    value={passwordForm.new_password_confirmation}
                    onChange={(e) =>
                      setPasswordForm((f) => ({
                        ...f,
                        new_password_confirmation: e.target.value,
                      }))
                    }
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    "Atualizar senha"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
