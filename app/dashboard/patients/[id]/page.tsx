"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Phone, Mail, Calendar, MapPin, Shield, FileText, Send, Loader2, Copy, Check, BookOpen, DollarSign, File } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import patientService from "@/services/patient-service"
import diaryService from "@/services/diary-service"
import contractService from "@/services/contract-service"
import { DiaryEntryCard } from "@/components/diary-entry-card"
import { DiaryFilterDropdown } from "@/components/diary-filter-dropdown"
import { WeeklyAnalysisDropdown } from "@/components/weekly-analysis-dropdown"
import { PatientSessions } from "@/components/patient-sessions"
import { PatientRecords } from "@/components/patient-records"
import { quizAssignmentService } from "@/services/quiz-assignment-service"
import type { Patient, PortalAccessCredentials } from "@/types/patient"
import { PAYMENT_TYPES } from "@/types/patient"
import type { DiaryEntry, DiaryFilters } from "@/types/diary"
import type { Contract } from "@/types/contract"
import { CONTRACT_STATUS_LABELS } from "@/types/contract"
import { PatientQuizAssignment } from "@/types/quiz"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"
import { Brain, CheckCircle2, Clock, AlertCircle, Eye } from "lucide-react"

export default function PatientDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const patientId = Number(params.id)

    const [isLoading, setIsLoading] = useState(true)
    const [patient, setPatient] = useState<Patient | null>(null)
    const [isGrantingAccess, setIsGrantingAccess] = useState(false)
    const [credentials, setCredentials] = useState<PortalAccessCredentials | null>(null)
    const [copiedField, setCopiedField] = useState<string | null>(null)
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [isLoadingDiary, setIsLoadingDiary] = useState(false)
  const [diaryFilters, setDiaryFilters] = useState<DiaryFilters>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoadingContracts, setIsLoadingContracts] = useState(false)
  const [quizAssignments, setQuizAssignments] = useState<PatientQuizAssignment[]>([])
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)

    useEffect(() => {
        const loadPatient = async () => {
            if (!patientId) return

            setIsLoading(true)
            try {
                const patientData = await patientService.getById(patientId)
                setPatient(patientData)
            } catch (error: any) {
                showErrorToast(
                    "Erro ao carregar paciente",
                    error.response?.data?.message || "Paciente não encontrado"
                )
                router.push("/dashboard/patients")
            } finally {
                setIsLoading(false)
            }
        }

        loadPatient()
    }, [patientId, router])

    // Carregar entradas do diário automaticamente quando o paciente for carregado
    useEffect(() => {
        if (patient) {
            loadDiaryEntries()
        }
    }, [patient])

    const loadDiaryEntries = async (filters: DiaryFilters = {}) => {
        if (!patientId) return
        
        setIsLoadingDiary(true)
        try {
            const response = await diaryService.getPatientEntries(patientId, filters)
            setDiaryEntries(response.entries.data)
        } catch (error: any) {
            showErrorToast(
                "Erro ao carregar diário",
                error.response?.data?.message || "Tente novamente mais tarde"
            )
        } finally {
            setIsLoadingDiary(false)
        }
    }

    const handleDiaryFiltersChange = (filters: DiaryFilters) => {
        setDiaryFilters(filters)
    }

    const handleDiarySearch = () => {
        loadDiaryEntries(diaryFilters)
    }

    const loadQuizAssignments = async () => {
        if (!patientId || !patient?.user_id) return
        
        setIsLoadingQuizzes(true)
        try {
            const response = await quizAssignmentService.getAssignments({ 
                patient_id: patient.user_id 
            })
            if (response.success && response.data) {
                setQuizAssignments(response.data)
            }
        } catch (error: any) {
            console.error('Error loading quiz assignments:', error)
            showErrorToast(
                "Erro ao carregar quizzes",
                error.response?.data?.message || "Tente novamente mais tarde"
            )
        } finally {
            setIsLoadingQuizzes(false)
        }
    }

    const handleViewQuizResponses = (quizId: number, quizTitle: string) => {
        router.push(`/dashboard/quizzes/${quizId}/responses/${patient?.user_id}`)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Não informado'
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'Não informado'
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false
        return new Date(dueDate) < new Date()
    }

    const loadContracts = async () => {
        if (!patientId) return
        
        setIsLoadingContracts(true)
        try {
            const response = await contractService.getPatientContracts(patientId)
            if (response.success) {
                setContracts(response.contracts)
            }
        } catch (error: any) {
            showErrorToast(
                "Erro ao carregar contratos",
                error.response?.data?.message || "Tente novamente mais tarde"
            )
        } finally {
            setIsLoadingContracts(false)
        }
    }

    const handleGrantPortalAccess = async () => {
        if (!patientId) return

        setIsGrantingAccess(true)
        try {
            const credentialsData = await patientService.grantPortalAccess(patientId)
            setCredentials(credentialsData)
            showSuccessToast("Acesso criado", "Credenciais do portal enviadas para o paciente!")
        } catch (error: any) {
            showErrorToast(
                "Erro ao criar acesso",
                error.response?.data?.message || "Tente novamente mais tarde"
            )
        } finally {
            setIsGrantingAccess(false)
        }
    }

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
            showSuccessToast("Copiado!", `${field} copiado para a área de transferência`)
        } catch (error) {
            showErrorToast("Erro ao copiar", "Não foi possível copiar o texto")
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (!patient) {
        return (
            <DashboardLayout>
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Paciente não encontrado</p>
                    <Link href="/dashboard/patients">
                        <Button variant="outline" className="mt-4">
                            Voltar para Pacientes
                        </Button>
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <Link href="/dashboard/patients">
                            <Button variant="ghost" size="sm" className="gap-2 flex-shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Voltar</span>
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold truncate">{patient.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant={patient.status === "active" ? "default" : "secondary"} className="text-xs">
                                    {patient.status === "active" ? "Ativo" : "Inativo"}
                                </Badge>
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    ID: {patient.id}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/dashboard/patients/${patient.id}/edit`} className="w-full sm:w-auto">
                            <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="info" className="space-y-6">
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        <TabsList className="inline-flex w-full sm:inline-flex gap-1 min-w-max sm:min-w-0">
                            <TabsTrigger value="info" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Informações</span>
                                <span className="sm:hidden">Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="diary" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                Diário
                            </TabsTrigger>
                            <TabsTrigger value="sessions" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                Sessões
                            </TabsTrigger>
                            <TabsTrigger value="records" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Prontuários</span>
                                <span className="sm:hidden">Pront.</span>
                            </TabsTrigger>
                            <TabsTrigger value="contracts" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <File className="h-3 w-3 sm:h-4 sm:w-4" />
                                Contratos
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Informações Tab */}
                    <TabsContent value="info" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        {/* Informações Pessoais */}
                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Informações Pessoais
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium">Data de Nascimento</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                                {formatDate(patient.birthdate)}
                                            </p>
                                        </div>
                                    </div>

                                    {patient.email && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Email</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{patient.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.phone && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Telefone</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{patient.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.cpf && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">CPF</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{patient.cpf}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.address && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 sm:col-span-2">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Endereço</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{patient.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.emergency_contact && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Contato de Emergência</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{patient.emergency_contact}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.insurance && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Convênio/Plano de Saúde</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{patient.insurance}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.price_session && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Valor da Sessão</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">R$ {Number(patient.price_session).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {patient.payment_type && (
                                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium">Tipo de Pagamento</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                                    {PAYMENT_TYPES.find(type => type.value === patient.payment_type)?.label || patient.payment_type}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Observações */}
                        {patient.initial_notes && (
                            <Card>
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="text-base sm:text-lg">Observações</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                        {patient.initial_notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Acesso ao Portal */}
                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Acesso ao Portal do Paciente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
                                {!credentials ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted-foreground mb-4">
                                            Crie credenciais de acesso para o portal do paciente
                                        </p>
                                        <Button
                                            onClick={handleGrantPortalAccess}
                                            disabled={isGrantingAccess}
                                            className="gap-2"
                                        >
                                            {isGrantingAccess ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Criando acesso...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Enviar Acesso ao Portal
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                                Credenciais criadas com sucesso!
                                            </h4>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                As credenciais foram enviadas por email para o paciente.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs sm:text-sm font-medium">Email de Acesso</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={credentials.email}
                                                        readOnly
                                                        className="bg-muted text-xs sm:text-sm"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(credentials.email, "Email")}
                                                        className="flex-shrink-0"
                                                    >
                                                        {copiedField === "Email" ? (
                                                            <Check className="h-4 w-4" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs sm:text-sm font-medium">Senha Temporária</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={credentials.password}
                                                        readOnly
                                                        className="bg-muted text-xs sm:text-sm"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(credentials.password, "Senha")}
                                                        className="flex-shrink-0"
                                                    >
                                                        {copiedField === "Senha" ? (
                                                            <Check className="h-4 w-4" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                <strong>Importante:</strong> Oriente o paciente a alterar a senha no primeiro acesso ao portal.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Diário Tab */}
                    <TabsContent value="diary" className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-semibold">Diário Emocional</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Entradas do diário de {patient.name}
                                </p>
                            </div>
                            <Button onClick={() => loadDiaryEntries(diaryFilters)} variant="outline" className="gap-2 w-full sm:w-auto">
                                <Calendar className="h-4 w-4" />
                                Atualizar
                            </Button>
                        </div>

                        {/* Análise Semanal */}
                        <WeeklyAnalysisDropdown
                            patientId={patientId}
                            patientName={patient.name}
                            isOpen={isAnalysisOpen}
                            onOpenChange={setIsAnalysisOpen}
                        />

                        {/* Filtros */}
                        <DiaryFilterDropdown
                            onFiltersChange={handleDiaryFiltersChange}
                            onSearch={handleDiarySearch}
                            isLoading={isLoadingDiary}
                            showPatientFilter={false}
                            showDateFilters={true}
                            showMoodFilter={true}
                            showSearchFilter={false}
                            title="Filtros do Diário"
                            isOpen={isFilterOpen}
                            onOpenChange={setIsFilterOpen}
                        />

                        {isLoadingDiary ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : diaryEntries.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium mb-2">Nenhuma entrada encontrada</p>
                                        <p>O paciente ainda não criou entradas no diário</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {diaryEntries.map((entry) => (
                                    <DiaryEntryCard
                                        key={entry.id}
                                        entry={entry}
                                        readonly={true}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Sessões Tab */}
                    <TabsContent value="sessions" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        {patient && (
                            <PatientSessions
                                patientId={patientId}
                                patientName={patient.name}
                                priceSession={patient.price_session}
                            />
                        )}
                    </TabsContent>

                    {/* Contratos Tab */}
                    <TabsContent value="contracts" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold">Contratos do Paciente</h3>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Histórico de contratos assinados por {patient?.name}
                                </p>
                            </div>
                            <Button onClick={loadContracts} disabled={isLoadingContracts} className="w-full sm:w-auto">
                                {isLoadingContracts ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <File className="h-4 w-4 mr-2" />
                                )}
                                Carregar Contratos
                            </Button>
                        </div>

                        {isLoadingContracts ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : contracts.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium mb-2">Nenhum contrato encontrado</p>
                                        <p>Este paciente ainda não possui contratos</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {contracts.map((contract) => (
                                    <Card key={contract.id}>
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="space-y-2 flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm sm:text-base font-semibold">Contrato #{contract.id}</h4>
                                                        <Badge 
                                                            className={`text-xs ${
                                                                contract.status === 'signed' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : contract.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                        >
                                                            {CONTRACT_STATUS_LABELS[contract.status as keyof typeof CONTRACT_STATUS_LABELS]}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                                                        <p>Tipo: {contract.payment_type === 'por_sessao' ? 'Por Sessão' : contract.payment_type === 'quinzenal' ? 'Quinzenal' : 'Mensal'}</p>
                                                        <p>Valor: R$ {parseFloat(contract.price_session).toFixed(2)}</p>
                                                        {contract.signed_at && (
                                                            <p>Assinado em: {new Date(contract.signed_at).toLocaleDateString('pt-BR')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:flex-shrink-0">
                                                    {contract.status === 'signed' && contract.pdf_path && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                try {
                                                                    await contractService.downloadPdf(contract.id)
                                                                } catch (error) {
                                                                    console.error('Erro ao baixar PDF:', error)
                                                                }
                                                            }}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Ver PDF
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <File className="h-4 w-4 mr-2" />
                                                        Ver Detalhes
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                   {/* Quizzes Tab */}
                    <TabsContent value="quizzes" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div>
                   <h3 className="text-base sm:text-lg font-semibold">Quizzes</h3>
                   <p className="text-xs sm:text-sm text-muted-foreground">
                       Quizzes atribuídos a {patient?.name}
                   </p>
                            </div>
                            <Button onClick={loadQuizAssignments} disabled={isLoadingQuizzes} variant="outline" className="w-full sm:w-auto">
                                {isLoadingQuizzes ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Brain className="h-4 w-4 mr-2" />
                                )}
                                Atualizar
                            </Button>
                        </div>

                        {isLoadingQuizzes ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : quizAssignments.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p className="text-lg font-medium mb-2">Nenhum quiz atribuído</p>
                   <p>Este paciente ainda não possui quizzes atribuídos</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {quizAssignments.map((assignment) => {
                                    const quiz = assignment.quiz
                                    const hasCompleted = assignment.attempts?.some((a: any) => a.status === 'completed') || false
                                    const latestAttempt = assignment.attempts?.find((a: any) => a.status === 'completed') || assignment.attempts?.[0]
                                    
                                    return (
                                        <Card key={assignment.id} className="border-primary/20">
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-3 sm:gap-4">
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                                                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-base sm:text-lg mb-1 break-words">
                                                                    {quiz?.title || 'Quiz sem título'}
                                                                </h4>
                                                                <p className="text-xs sm:text-sm text-muted-foreground mb-3 break-words">
                                                                    {quiz?.description || 'Sem descrição'}
                                                                </p>
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    <Badge 
                                                                        className={
                                                                            hasCompleted
                                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                                : assignment.status === 'in_progress'
                                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                        }
                                                                    >
                                                                        {hasCompleted ? (
                                                                            <>
                                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                                Respondido
                                                                            </>
                                                                        ) : assignment.status === 'in_progress' ? (
                                                                            <>
                                                                                <Clock className="h-3 w-3 mr-1" />
                                                                                Em Andamento
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                                Pendente
                                                                            </>
                                                                        )}
                                                                    </Badge>
                                                                    {assignment.due_date && (
                                                                        <div className={`flex items-center gap-1 text-xs ${isOverdue(assignment.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>
                                                                                Prazo: {formatDate(assignment.due_date)}
                                                                                {isOverdue(assignment.due_date) && ' (Vencido)'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <Clock className="h-3 w-3" />
                                                                        Atribuído em {formatDate(assignment.assigned_at)}
                                                                    </div>
                                                                    {latestAttempt?.ai_feedback && (
                                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                                            <Brain className="h-3 w-3 mr-1" />
                                                                            Análise disponível
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {assignment.notes && (
                                                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                                                        <p className="text-xs font-medium text-muted-foreground mb-1">Observações:</p>
                                                                        <p className="text-sm">{assignment.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                                                        {hasCompleted ? (
                                                            <Button
                                                                variant="default"
                                                                onClick={() => handleViewQuizResponses(quiz.id, quiz.title)}
                                                                className="gap-2 w-full sm:w-auto"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Ver Respostas
                                                            </Button>
                                                        ) : (
                                                            <Badge variant="secondary" className="whitespace-nowrap w-fit">
                                                                Aguardando resposta
                                                            </Badge>
                                                        )}
                                                        <Link href={`/dashboard/quizzes/${quiz.id}`} className="w-full sm:w-auto">
                                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                                <Brain className="h-4 w-4" />
                                                                Ver Quiz
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
