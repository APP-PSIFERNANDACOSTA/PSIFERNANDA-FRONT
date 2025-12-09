"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Loader2, FileText, Check } from "lucide-react"
import contractService from "@/services/contract-service"
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers"

interface SignatureUploadProps {
  onUpload?: (url: string) => void
  onDelete?: () => void
  initialUrl?: string
  className?: string
}

export function SignatureUpload({ 
  onUpload, 
  onDelete, 
  initialUrl, 
  className 
}: SignatureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showErrorToast("Por favor, selecione apenas arquivos de imagem")
      return
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showErrorToast("O arquivo deve ter no máximo 2MB")
      return
    }

    await uploadSignature(file)
  }

  const uploadSignature = async (file: File) => {
    setIsUploading(true)
    try {
      const response = await contractService.uploadPsychologistSignature(file)
      setSignatureUrl(response.url)
      onUpload?.(response.url)
      showSuccessToast("Assinatura enviada com sucesso!")
    } catch (error) {
      console.error("Erro ao enviar assinatura:", error)
      showErrorToast("Erro ao enviar assinatura")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteSignature = async () => {
    if (!confirm("Tem certeza que deseja remover sua assinatura?")) return

    setIsDeleting(true)
    try {
      await contractService.deletePsychologistSignature()
      setSignatureUrl(null)
      onDelete?.()
      showSuccessToast("Assinatura removida com sucesso!")
    } catch (error) {
      console.error("Erro ao remover assinatura:", error)
      showErrorToast("Erro ao remover assinatura")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        uploadSignature(file)
      } else {
        showErrorToast("Por favor, selecione apenas arquivos de imagem")
      }
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Upload de Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {isUploading ? "Enviando..." : "Clique ou arraste uma imagem aqui"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos aceitos: JPG, PNG, GIF (máximo 2MB)
            </p>
            <Button
              disabled={isUploading}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Selecionar Arquivo
            </Button>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview da Assinatura */}
          {signatureUrl && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={signatureUrl}
                  alt="Assinatura"
                  className="max-w-full h-auto max-h-32 mx-auto"
                />
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Assinatura configurada com sucesso</span>
              </div>

              <Button
                onClick={handleDeleteSignature}
                disabled={isDeleting}
                variant="destructive"
                className="w-full"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remover Assinatura
              </Button>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p><strong>Dicas para uma boa assinatura:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use uma imagem de alta qualidade</li>
              <li>Fundo transparente ou branco</li>
              <li>Assinatura legível e clara</li>
              <li>Formato horizontal funciona melhor</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
