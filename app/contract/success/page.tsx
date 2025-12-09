'use client'

import { CheckCircle, Mail, MessageCircle, Clock, Heart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useColors } from '@/hooks/use-colors'

export default function ContractSuccessPage() {
  const colors = useColors()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contrato Assinado com Sucesso! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Bem-vindo(a) ao processo terapêutico!
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
              Próximos Passos
            </h2>
            <p className="text-gray-600 mb-6">
              Seu contrato foi assinado com sucesso! Agora você está oficialmente 
              cadastrado(a) como paciente da Psicóloga Fernanda Costa.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {/* Email Step */}
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  📧 Email de Confirmação
                </h3>
                <p className="text-gray-600 text-sm">
                  Você receberá um email com o PDF do contrato assinado e 
                  informações importantes sobre o processo terapêutico.
                </p>
              </div>
            </div>

            {/* WhatsApp Step */}
            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  💬 Contato via WhatsApp
                </h3>
                <p className="text-gray-600 text-sm">
                  A psicóloga entrará em contato pelo WhatsApp para agendar 
                  sua primeira sessão e enviar informações adicionais.
                </p>
              </div>
            </div>

            {/* Portal Access Step */}
            <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  🔐 Acesso ao Portal do Paciente
                </h3>
                <p className="text-gray-600 text-sm">
                  Em breve você receberá suas credenciais para acessar o portal 
                  onde poderá escrever seu diário pessoal e acompanhar seu progresso.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
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

        {/* Final Message */}
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 mr-2" style={{ color: colors.primary }} />
            <span className="text-lg font-medium" style={{ color: colors.primary }}>
              Fernanda Gabriela Bezerra da Costa
            </span>
          </div>
          <p className="text-gray-600 mb-2">
            Psicóloga - CRP-08/43119
          </p>
          <p className="text-sm text-gray-500">
            Estou ansiosa para conhecê-lo(a) melhor e iniciarmos nossa jornada 
            de autoconhecimento e crescimento pessoal juntos!
          </p>
        </Card>

        {/* Action Button */}
        <div className="text-center mt-6">
          <Button 
            onClick={() => window.close()}
            className="px-8 py-3"
            style={{ 
              backgroundColor: colors.primaryDark,
              color: 'white'
            }}
          >
            Fechar Página
          </Button>
        </div>
      </div>
    </div>
  )
}