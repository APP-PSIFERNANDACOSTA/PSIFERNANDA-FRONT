"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Paperclip, AlertCircle, Clock, CheckCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const messages = [
  {
    id: 1,
    sender: "psychologist",
    content: "Olá! Como você está se sentindo hoje?",
    timestamp: "2025-01-15T10:30:00",
    read: true,
  },
  {
    id: 2,
    sender: "patient",
    content: "Oi Psi Fernanda! Estou me sentindo melhor. Os exercícios de respiração estão ajudando muito.",
    timestamp: "2025-01-15T14:20:00",
    read: true,
  },
  {
    id: 3,
    sender: "psychologist",
    content:
      "Que ótimo! Fico muito feliz em saber. Continue praticando diariamente. Lembre-se de registrar no seu diário como você se sente após cada prática.",
    timestamp: "2025-01-15T14:45:00",
    read: true,
  },
  {
    id: 4,
    sender: "patient",
    content: "Vou fazer isso! Obrigada pelo apoio.",
    timestamp: "2025-01-15T15:10:00",
    read: true,
  },
  {
    id: 5,
    sender: "psychologist",
    content:
      "Estou aqui para te apoiar sempre. Nos vemos na próxima sessão quinta-feira. Se precisar de algo antes, pode me enviar mensagem.",
    timestamp: "2025-01-15T15:15:00",
    read: false,
  },
]

export default function ChatPage() {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Send message logic here
      setNewMessage("")
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoje"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem"
    } else {
      return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
        <p className="mt-2 text-muted-foreground">Comunicação segura com a Psi Fernanda Costa</p>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">Sobre as mensagens</p>
            <p className="mt-1 text-muted-foreground">
              Este é um canal de comunicação assíncrona. A Psi Fernanda responde em até 24 horas úteis. Em caso de
              emergência, entre em contato com os serviços especializados.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Card */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">FC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">Psi Fernanda Costa</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Responde em até 24h
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Ativa
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="flex h-[500px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message, index) => {
                const showDate =
                  index === 0 || formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp)
                const isPatient = message.sender === "patient"

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex items-center justify-center py-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(message.timestamp)}
                        </Badge>
                      </div>
                    )}
                    <div className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[70%] gap-2 ${isPatient ? "flex-row-reverse" : "flex-row"}`}>
                        {!isPatient && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">FC</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`space-y-1 ${isPatient ? "items-end" : "items-start"} flex flex-col`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isPatient
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground dark:text-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
                            <span>{formatTime(message.timestamp)}</span>
                            {isPatient && message.read && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="shrink-0">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pressione Enter para enviar, Shift + Enter para nova linha
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
