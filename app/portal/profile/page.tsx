"use client"

import { useState, useEffect } from "react"
// PortalDashboardLayout is already applied in app/portal/layout.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import patientService from "@/services/patient-service"
import type { Patient } from "@/types/patient"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { 
    User, 
    Phone, 
    Mail, 
    Calendar, 
    Heart, 
    Target,
    Edit3,
    Save,
    X,
    Brain,
    Lock,
    Bell,
    AlertCircle
} from "lucide-react"

export default function PatientProfilePage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [patient, setPatient] = useState<Patient | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications">("profile")
    
    // Push Notifications
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading: isPushLoading,
        error: pushError,
        subscribe,
        unsubscribe
    } = usePushNotifications()
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        cpf: '',
        email: '',
        address: '',
        emergency_contact: '',
        insurance: '',
        initial_notes: ''
    })

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    })
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    // Load patient data
    useEffect(() => {
        const loadPatientData = async () => {
            try {
                setIsLoading(true)
                const patientData = await patientService.getMyProfile()
                setPatient(patientData)
                
                // Populate form data
                setFormData({
                    name: patientData.name || '',
                    phone: patientData.phone || '',
                    cpf: patientData.cpf || '',
                    email: patientData.email || '',
                    address: patientData.address || '',
                    emergency_contact: patientData.emergency_contact || '',
                    insurance: patientData.insurance || '',
                    initial_notes: patientData.initial_notes || ''
                })
            } catch (error) {
                console.error('Erro ao carregar dados do paciente:', error)
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar seus dados. Tente novamente.",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        if (user?.role === 'patient') {
            loadPatientData()
        }
    }, [user, toast])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleChangePassword = async () => {
        if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha todos os campos de senha.",
                variant: "destructive",
            })
            return
        }

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast({
                title: "Senhas não conferem",
                description: "A nova senha e a confirmação precisam ser iguais.",
                variant: "destructive",
            })
            return
        }

        setIsChangingPassword(true)
        try {
            await apiClient.getAxiosInstance().post("/auth/change-password", {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                new_password_confirmation: passwordForm.confirm_password,
            })

            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            })

            toast({
                title: "Senha atualizada",
                description: "Sua senha foi alterada com sucesso.",
            })
        } catch (error: any) {
            console.error("Erro ao alterar senha:", error)
            const message =
                error?.response?.data?.message ||
                "Não foi possível alterar sua senha. Verifique a senha atual e tente novamente."
            toast({
                title: "Erro ao alterar senha",
                description: message,
                variant: "destructive",
            })
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const updatedPatient = await patientService.updateMyProfile(formData)
            setPatient(updatedPatient)
            setIsEditing(false)
            
            toast({
                title: "Sucesso!",
                description: "Seus dados foram atualizados com sucesso."
            })
        } catch (error) {
            console.error('Erro ao salvar dados:', error)
            toast({
                title: "Erro",
                description: "Não foi possível salvar suas alterações. Tente novamente.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        if (patient) {
            setFormData({
                name: patient.name || '',
                phone: patient.phone || '',
                cpf: patient.cpf || '',
                email: patient.email || '',
                address: patient.address || '',
                emergency_contact: patient.emergency_contact || '',
                insurance: patient.insurance || '',
                initial_notes: patient.initial_notes || ''
            })
        }
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Carregando seus dados...</p>
                </div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Não foi possível carregar seus dados.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
                            <p className="mt-2 text-muted-foreground">Gerencie suas informações pessoais e terapêuticas</p>
                        </div>
                        <div className="flex gap-2 sm:justify-end">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                                        <X className="mr-2 h-4 w-4" />
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSaving ? "Salvando..." : "Salvar"}
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Editar Perfil
                                </Button>
                            )}
                        </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Conteúdo principal com abas */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="profile">Perfil</TabsTrigger>
                                <TabsTrigger value="password">Senha</TabsTrigger>
                                <TabsTrigger value="notifications">Notificações</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary" />
                                            Informações Pessoais
                                        </CardTitle>
                                        <CardDescription>
                                            Dados básicos para identificação e contato
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nome Completo</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    disabled={true}
                                                    placeholder="Seu nome completo"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">E-mail</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="seu@email.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Telefone</Label>
                                                <Input
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="(11) 99999-9999"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cpf">CPF</Label>
                                                <Input
                                                    id="cpf"
                                                    value={formData.cpf}
                                                    disabled={true}
                                                    placeholder="Seu CPF"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                                            <Input
                                                id="emergency_contact"
                                                value={formData.emergency_contact}
                                                onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="Nome e telefone do contato de emergência"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="password" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lock className="h-5 w-5 text-primary" />
                                            Senha de Acesso
                                        </CardTitle>
                                        <CardDescription>
                                            Altere sua senha de acesso ao portal com segurança.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password">Senha Atual</Label>
                                            <Input
                                                id="current-password"
                                                type="password"
                                                value={passwordForm.current_password}
                                                onChange={(e) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        current_password: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">Nova Senha</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={passwordForm.new_password}
                                                onChange={(e) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        new_password: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={passwordForm.confirm_password}
                                                onChange={(e) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        confirm_password: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                                            {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Dica: use pelo menos 8 caracteres, com letras maiúsculas, minúsculas e números.
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notifications" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Bell className="h-5 w-5 text-primary" />
                                            Notificações
                                        </CardTitle>
                                        <CardDescription>Gerencie como você recebe notificações</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Push Notifications */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                            <div className="space-y-0.5 flex-1">
                                                <Label className="text-base font-semibold">Notificações Push</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Ao habilitar, você receberá notificações no celular sobre: lembretes de sessão, mensagens da sua psicóloga, novas avaliações atribuídas e outras atualizações importantes.
                                                </p>
                                                {!isSupported && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {pushError || 'Push notifications não são suportadas neste navegador. Use Chrome, Firefox ou Safari em modo normal (não privado).'}
                                                    </p>
                                                )}
                                                {isSupported && permission === 'denied' && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Permissão negada. Ative nas configurações do navegador
                                                    </p>
                                                )}
                                                {pushError && isSupported && permission !== 'denied' && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {pushError}
                                                    </p>
                                                )}
                                            </div>
                                            <Switch
                                                checked={isSubscribed}
                                                disabled={!isSupported || permission === 'denied' || isPushLoading}
                                                onCheckedChange={async (checked) => {
                                                    console.log('[Perfil] Toggle mudou para:', checked)
                                                    console.log('[Perfil] isSupported:', isSupported)
                                                    console.log('[Perfil] permission:', permission)
                                                    console.log('[Perfil] isPushLoading:', isPushLoading)
                                                    
                                                    if (checked) {
                                                        console.log('[Perfil] Chamando subscribe()...')
                                                        const success = await subscribe()
                                                        console.log('[Perfil] Resultado do subscribe:', success)
                                                        if (success) {
                                                            toast({
                                                                title: "Notificações ativadas",
                                                                description: "Você receberá notificações sobre lembretes de sessão, mensagens e outras atualizações importantes.",
                                                            })
                                                        } else {
                                                            toast({
                                                                title: "Erro ao ativar notificações",
                                                                description: pushError || "Não foi possível ativar as notificações push.",
                                                                variant: "destructive"
                                                            })
                                                        }
                                                    } else {
                                                        console.log('[Perfil] Chamando unsubscribe()...')
                                                        await unsubscribe()
                                                        toast({
                                                            title: "Notificações desativadas",
                                                            description: "Você não receberá mais notificações push.",
                                                        })
                                                    }
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar com Informações Adicionais */}
                    <div className="space-y-6">
                        {/* Status da Terapia */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-primary" />
                                    Status da Terapia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge className={`${
                                        patient.status === 'active' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Última Sessão</span>
                                    <span className="text-sm font-medium">
                                        {patient.last_session_date 
                                            ? new Date(patient.last_session_date).toLocaleDateString('pt-BR')
                                            : 'Não informado'
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Próxima Sessão</span>
                                    <span className="text-sm font-medium">
                                        {patient.next_session_date 
                                            ? new Date(patient.next_session_date).toLocaleDateString('pt-BR')
                                            : 'Não agendada'
                                        }
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Psicóloga Responsável */}
                        {patient.psychologist && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Psicóloga Responsável
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{patient.psychologist.name}</p>
                                            {patient.psychologist.crp && (
                                                <p className="text-sm text-muted-foreground">{patient.psychologist.crp}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{patient.psychologist.email}</span>
                                        </div>
                                        {patient.psychologist.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{patient.psychologist.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Estatísticas removidas conforme solicitado */}
                    </div>
                </div>
        </div>
    )
}