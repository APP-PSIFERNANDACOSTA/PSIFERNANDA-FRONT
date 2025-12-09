"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import patientService from "@/services/patient-service"
import type { CreatePatientData, PaymentType } from "@/types/patient"
import { PAYMENT_TYPES } from "@/types/patient"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

export default function CreatePatientPage() {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)

    const [formData, setFormData] = useState<CreatePatientData>({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        birthdate: "",
        emergency_contact: "",
        address: "",
        insurance: "",
        price_session: undefined,
        payment_type: "por_sessao",
        initial_notes: "",
        status: "active",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            await patientService.create(formData)
            showSuccessToast("Paciente cadastrado", "O paciente foi cadastrado com sucesso!")
            router.push("/dashboard/patients")
        } catch (error: any) {
            showErrorToast(
                "Erro ao cadastrar paciente",
                error.response?.data?.message || "Tente novamente mais tarde"
            )
        } finally {
            setIsCreating(false)
        }
    }

    const handleCancel = () => {
        router.push("/dashboard/patients")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/patients">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Cadastrar Novo Paciente</h1>
                        <p className="text-muted-foreground">Preencha os dados do paciente para criar o cadastro</p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Paciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Informações Pessoais */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Informações Pessoais</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome Completo *</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="birthdate">Data de Nascimento</Label>
                                        <Input
                                            id="birthdate"
                                            type="date"
                                            value={formData.birthdate}
                                            onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Ex: joao@email.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Telefone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Ex: (11) 99999-9999"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cpf">CPF</Label>
                                        <Input
                                            id="cpf"
                                            value={formData.cpf}
                                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                            placeholder="Ex: 000.000.000-00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {/* Espaço vazio para manter o layout */}
                                    </div>
                                </div>
                            </div>

                            {/* Informações Adicionais */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Informações Adicionais</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                                    <Input
                                        id="emergency_contact"
                                        value={formData.emergency_contact}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                                        placeholder="Nome e telefone do contato de emergência"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Endereço completo"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="insurance">Convênio/Plano de Saúde</Label>
                                        <Input
                                            id="insurance"
                                            value={formData.insurance}
                                            onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                                            placeholder="Ex: Unimed, Amil, etc."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="price_session">Valor da Sessão (R$)</Label>
                                        <Input
                                            id="price_session"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price_session || ""}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                price_session: e.target.value ? parseFloat(e.target.value) : undefined 
                                            })}
                                            placeholder="Ex: 150.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_type">Tipo de Pagamento</Label>
                                        <Select
                                            value={formData.payment_type}
                                            onValueChange={(value: PaymentType) =>
                                                setFormData({ ...formData, payment_type: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: "active" | "inactive") =>
                                                setFormData({ ...formData, status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Ativo</SelectItem>
                                                <SelectItem value="inactive">Inativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Notas Iniciais */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Observações Iniciais</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="initial_notes">Notas e Observações</Label>
                                    <Textarea
                                        id="initial_notes"
                                        value={formData.initial_notes}
                                        onChange={(e) => setFormData({ ...formData, initial_notes: e.target.value })}
                                        placeholder="Informações importantes sobre o paciente, histórico, preferências, etc."
                                        rows={5}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t">
                                <Button type="submit" disabled={isCreating} className="gap-2">
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Cadastrando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Cadastrar Paciente
                                        </>
                                    )}
                                </Button>

                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
