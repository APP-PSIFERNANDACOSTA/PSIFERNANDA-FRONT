"use client"

import { useState } from "react"
import { usePwaInstall, type PwaPlatform } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { X, Smartphone, Share2, Plus, MoreVertical } from "lucide-react"

const IOS_STEPS = [
  {
    step: 1,
    title: "Toque no botão Compartilhar",
    description: "Na barra inferior do Safari, toque no ícone de compartilhar (quadrado com seta para cima).",
    icon: Share2,
  },
  {
    step: 2,
    title: "Adicionar à Tela de Início",
    description: "Role o menu e toque em \"Adicionar à Tela de Início\" ou \"Add to Home Screen\".",
    icon: Plus,
  },
  {
    step: 3,
    title: "Confirme a instalação",
    description: "Toque em \"Adicionar\" no canto superior direito para concluir.",
    icon: Smartphone,
  },
]

const ANDROID_STEPS = [
  {
    step: 1,
    title: "Abra o menu do navegador",
    description: "Toque nos três pontos verticais no canto superior direito (ou inferior, dependendo do navegador).",
    icon: MoreVertical,
  },
  {
    step: 2,
    title: "Instalar ou Adicionar",
    description: "Toque em \"Instalar app\" ou \"Adicionar à tela inicial\" ou \"Install app\".",
    icon: Plus,
  },
  {
    step: 3,
    title: "Confirme",
    description: "Na janela de confirmação, toque em \"Instalar\" para concluir.",
    icon: Smartphone,
  },
]

function StepByStepGuide({ platform }: { platform: PwaPlatform }) {
  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS

  return (
    <div className="space-y-6 py-4">
      {steps.map((item) => (
        <div key={item.step} className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Passo {item.step}: {item.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PWAInstallPrompt() {
  const { platform, shouldShow, dismiss } = usePwaInstall()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  if (!shouldShow) return null

  const platformLabel = platform === "ios" ? "iPhone/iPad" : "Android"

  return (
    <>
      {/* Banner fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-lg sm:border sm:pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">Instalar aplicativo</p>
                <p className="text-sm text-muted-foreground">
                  Use o app como um aplicativo nativo no seu {platformLabel}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 -mt-1"
                onClick={dismiss}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => setIsSheetOpen(true)}
            >
              Ver como instalar
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet com passo a passo */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Como instalar no {platform === "ios" ? "iPhone/iPad" : "Android"}
            </SheetTitle>
            <SheetDescription>
              Siga os passos abaixo para adicionar o app à tela inicial do seu celular
            </SheetDescription>
          </SheetHeader>
          <StepByStepGuide platform={platform} />
        </SheetContent>
      </Sheet>
    </>
  )
}
