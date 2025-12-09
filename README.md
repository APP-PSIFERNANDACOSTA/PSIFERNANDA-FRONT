# 🎨 App PSI Fernanda - Frontend

Frontend do sistema de CRM para psicologia desenvolvido com Next.js 15 e React 19.

## 📋 Sobre o Projeto

Interface web moderna e responsiva desenvolvida em Next.js para gerenciamento de pacientes, agendamentos, prontuários e funcionalidades relacionadas ao atendimento psicológico.

## 🛠️ Tecnologias

- **Next.js 15** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Axios** - Cliente HTTP
- **Next Themes** - Gerenciamento de tema

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone git@github.com:RafalRodriguess/app-psifernanda-frontend.git
cd app-psifernanda-frontend
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure o ambiente:
```bash
cp .env.example .env.local
```

4. Configure o arquivo `.env.local` com a URL da API backend:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Executando

### Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build de Produção

```bash
npm run build
npm start
```

## 📚 Estrutura do Projeto

```
app/
├── dashboard/          # Páginas do dashboard
├── portal/             # Portal do paciente
├── schedule/           # Agendamentos
├── medical-records/    # Prontuários
├── financial/          # Financeiro
└── settings/           # Configurações

components/
├── ui/                 # Componentes UI base
├── forms/              # Componentes de formulário
├── modals/             # Modais
└── ...                 # Outros componentes

services/               # Serviços de API
types/                  # Tipos TypeScript
lib/                    # Utilitários
hooks/                  # React hooks customizados
contexts/               # Contextos React
```

## 🎨 Componentes

O projeto utiliza uma biblioteca de componentes baseada em Radix UI e Tailwind CSS. Os componentes estão em `components/ui/`.

### Exemplos de uso:

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function MyComponent() {
  return (
    <div>
      <Input placeholder="Digite algo..." />
      <Button>Enviar</Button>
    </div>
  )
}
```

## 🔐 Autenticação

A autenticação é gerenciada através do `AuthContext` e `ProtectedRoute`. Rotas protegidas devem usar o componente `ProtectedRoute`.

## 🌙 Tema

O projeto suporta tema claro/escuro através do `ThemeProvider` e `useTheme` hook.

## 📱 PWA

O projeto está configurado como PWA (Progressive Web App) com suporte a:
- Instalação offline
- Notificações push
- Atualizações automáticas

## 🧪 Testes

```bash
npm run test
```

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Contribuindo

Este é um repositório privado. Para contribuições, entre em contato com o mantenedor do projeto.

