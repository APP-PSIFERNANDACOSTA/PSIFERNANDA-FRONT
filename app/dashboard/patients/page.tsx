"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Phone, Mail, Calendar, MoreVertical, Send, Loader2, Eye, Edit, DollarSign } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import patientService from "@/services/patient-service"
import type { Patient, PortalAccessCredentials, PatientsResponse } from "@/types/patient"
import { PAYMENT_TYPES } from "@/types/patient"
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers"

export default function PatientsPage() {
  const [patientsData, setPatientsData] = useState<PatientsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isSendingAccess, setIsSendingAccess] = useState<number | null>(null)

  const loadPatients = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const status = filterStatus === "all" ? undefined : filterStatus
      const search = searchTerm || undefined
      const data = await patientService.getAll({ 
        status, 
        search, 
        page, 
        per_page: 10 
      })
      setPatientsData(data)
    } catch (error: any) {
      showErrorToast(
        "Erro ao carregar pacientes",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPatients(currentPage)
  }, [filterStatus])

  const handleSearch = () => {
    setCurrentPage(1)
    loadPatients(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadPatients(page)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informado"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const handleSendAccess = async (patientId: number) => {
    setIsSendingAccess(patientId)
    try {
      const response = await patientService.grantPortalAccess(patientId)
      showSuccessToast(
        "Acesso enviado!",
        `Credenciais enviadas para ${response.credentials.email}`
      )
    } catch (error: any) {
      showErrorToast(
        "Erro ao enviar acesso",
        error.response?.data?.message || "Tente novamente mais tarde"
      )
    } finally {
      setIsSendingAccess(null)
    }
  }

  const patients = patientsData?.patients?.data || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground">Gerencie seus pacientes e seus dados</p>
          </div>
          <Link href="/dashboard/patients/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Paciente
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={(value: "all" | "active" | "inactive") => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm ? (
                  <>
                    <p className="text-lg font-medium mb-2">Nenhum paciente encontrado</p>
                    <p>Tente ajustar os filtros de busca</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">Nenhum paciente cadastrado</p>
                    <p>Comece cadastrando seu primeiro paciente</p>
                  </>
                )}
              </div>
              <Link href="/dashboard/patients/create">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Paciente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                          {patient.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">ID: {patient.id}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/patients/${patient.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/patients/${patient.id}/edit`} className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.payment_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Tipo de Pagamento: {PAYMENT_TYPES.find(type => type.value === patient.payment_type)?.label || patient.payment_type}</span>
                      </div>
                    )}
                    {patient.price_session && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Valor da Sessão: R$ {Number(patient.price_session).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <Link href={`/dashboard/patients/${patient.id}`}>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {patientsData?.patients && patientsData.patients.last_page > 1 && (
          <Card>
            <CardContent className="pt-6">
              <Pagination
                currentPage={patientsData.patients.current_page}
                totalPages={patientsData.patients.last_page}
                onPageChange={handlePageChange}
                totalItems={patientsData.patients.total}
                itemsPerPage={patientsData.patients.per_page}
                showInfo={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}