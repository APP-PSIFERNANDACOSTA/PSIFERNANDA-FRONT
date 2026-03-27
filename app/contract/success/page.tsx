"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Mail, MessageCircle, Heart, Clock, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useColors } from "@/hooks/use-colors"

function ContractSuccessContent() {
  const colors = useColors()
  const searchParams = useSearchParams()
  const isRenewal = searchParams.get("renewal") === "1"

  if (isRenewal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Contrato assinado com sucesso
            </h1>
            <p className="text-base text-gray-600 leading-relaxed">
              Obrigada pela confiança. Seu novo contrato está registrado; se você alterou algum dado no
              formulário, ele já foi atualizado.
            </p>
          </div>

          <Card className="p-6 mb-6 border-0 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">E-mail</p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    Você receberá o PDF do contrato assinado por e-mail.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">WhatsApp</p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    Para dúvidas ou alinhamentos, pode falar comigo pelo{" "}
                    <span className="whitespace-nowrap">(44) 9 9910-3847</span>.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 text-center border-0 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-lg font-medium" style={{ color: colors.primary }}>
                Fernanda Gabriela Bezerra da Costa
              </span>
            </div>
            <p className="text-gray-600 text-sm">Psicóloga — CRP-08/43119</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Seu contrato foi assinado com sucesso! ✨
          </h1>
          <p className="text-lg text-gray-600">
            A partir de agora, você está oficialmente cadastrado(a) como meu/minha paciente, e fico feliz em
            te acompanhar nesse processo.
          </p>
        </div>

        <Card className="p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
              Próximos passos
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">🎉 Email de confirmação</h3>
                <p className="text-gray-600 text-sm">
                  Você receberá um email com o PDF do contrato assinado e algumas informações importantes para
                  te orientar ao longo do processo terapêutico.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">🎉 Contato pelo WhatsApp</h3>
                <p className="text-gray-600 text-sm">
                  Caso precise falar comigo, tirar dúvidas ou alinhar qualquer detalhe, você pode entrar em
                  contato comigo pelo WhatsApp. Esse canal é nosso meio oficial de comunicação fora das
                  sessões.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">🎉 Acesso ao Portal do Paciente</h3>
                <p className="text-gray-600 text-sm">
                  Em breve, você receberá suas credenciais para acessar o portal do paciente. Por lá, você
                  poderá escrever no seu diário pessoal e acompanhar seu processo com mais clareza e
                  organização.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
              📞 Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">WhatsApp:</span>
                <span>(44) 9 9910-3847</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">Instagram:</span>
                <span>@psicfernandacosta</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 mr-2" style={{ color: colors.primary }} />
            <span className="text-lg font-medium" style={{ color: colors.primary }}>
              Fernanda Gabriela Bezerra da Costa
            </span>
          </div>
          <p className="text-gray-600 mb-2">Psicóloga - CRP-08/43119</p>
          <p className="text-sm text-gray-500">
            Este é o início de um processo de cuidado, autoconhecimento e construção.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function ContractSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ContractSuccessContent />
    </Suspense>
  )
}
