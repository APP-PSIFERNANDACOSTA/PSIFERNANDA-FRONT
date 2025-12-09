"use client"

import { useEffect, useRef, useState } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva aqui...",
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    setIsMounted(true)

    // Carregar Quill dinamicamente
    const loadQuill = async () => {
      try {
        // Aguardar o elemento estar no DOM
        let retries = 0
        while (!editorRef.current && retries < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          retries++
        }

        if (!editorRef.current) {
          console.error("Editor ref não está disponível após tentativas")
          setIsLoading(false)
          return
        }

        // Carregar CSS
        if (!document.getElementById("quill-snow-css")) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "/css/quill.snow.css"
          link.id = "quill-snow-css"
          document.head.appendChild(link)
          
          // Aguardar CSS carregar
          await new Promise((resolve) => {
            link.onload = resolve
            link.onerror = resolve
            setTimeout(resolve, 500) // Timeout de segurança
          })
        }

        // Verificar se já foi inicializado
        if (quillRef.current) {
          setIsLoading(false)
          return
        }

        // Carregar Quill
        const Quill = (await import("quill")).default

        // Verificar novamente se o elemento ainda existe
        if (!editorRef.current) {
          console.error("Editor ref perdeu referência durante carregamento")
          setIsLoading(false)
          return
        }

        // Limpar qualquer conteúdo existente
        editorRef.current.innerHTML = ""

        // Inicializar Quill
        const quill = new Quill(editorRef.current, {
          theme: "snow",
          placeholder: placeholder,
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ indent: "-1" }, { indent: "+1" }],
              [{ align: [] }],
              ["link"],
              [{ color: [] }, { background: [] }],
              ["clean"],
            ],
          },
        })

        // Definir conteúdo inicial se houver
        if (value && value !== "<p><br></p>") {
          quill.root.innerHTML = value
        }

        // Listener para mudanças
        quill.on("text-change", () => {
          const html = quill.root.innerHTML
          // Evitar loop infinito verificando se realmente mudou
          if (html !== value) {
            onChange(html)
          }
        })

        quillRef.current = quill
        setIsLoading(false)

        // Focar no editor após inicialização
        setTimeout(() => {
          if (quillRef.current) {
            quillRef.current.focus()
          }
        }, 100)
      } catch (error) {
        console.error("Erro ao carregar Quill:", error)
        setIsLoading(false)
      }
    }

    // Aguardar um pouco mais para garantir que o componente está totalmente renderizado
    const timer = setTimeout(() => {
      loadQuill()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, []) // Executar apenas uma vez na montagem

  // Atualizar conteúdo quando value mudar externamente (mas não durante digitação)
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const currentContent = quillRef.current.root.innerHTML
      // Só atualizar se o conteúdo for diferente e não for apenas o placeholder
      if (value !== currentContent && value !== "<p><br></p>") {
        const selection = quillRef.current.getSelection()
        quillRef.current.root.innerHTML = value || ""
        // Restaurar seleção se existir
        if (selection) {
          setTimeout(() => {
            quillRef.current.setSelection(selection)
          }, 0)
        }
      }
    }
  }, [value])

  return (
    <div className={`${className} relative`}>
      <div
        ref={editorRef}
        className="min-h-[400px] [&_.ql-editor]:min-h-[400px] [&_.ql-editor]:text-foreground [&_.ql-container]:border-border [&_.ql-toolbar]:border-border [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:bg-background [&_.ql-container]:bg-background"
        style={{ minHeight: "400px" }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-50 rounded-md border">
          <p className="text-muted-foreground">Carregando editor...</p>
        </div>
      )}
    </div>
  )
}



