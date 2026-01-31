# Checklist Frontend - Notificações, PWA e Central Configurável

Este documento descreve o que está implementado no frontend em relação a notificações, PWA e a central configurável.

---

## ✅ Implementado

### Autenticação
- [x] `Authorization: Bearer {token}` enviado em todas as chamadas via `api-client` (interceptor adiciona automaticamente o token do localStorage)
- [x] Token aplicado em notificações, push, templates e regras

### Central de Notificações (Psicólogo)
- [x] **GET** `/api/notifications/templates?channel=push` – listar templates
- [x] **PUT** `/api/notifications/templates?channel=push` – salvar templates (lista completa)
- [x] **GET** `/api/notifications/rules?channel=push` – listar regras de lembrete
- [x] **PUT** `/api/notifications/rules?channel=push` – salvar regras (lista completa)
- [x] Tela em **Comunicações → Configurações** (`/communications?tab=settings`)
- [x] Formulário para editar título/corpo e ativar/desativar cada template
- [x] Separação visual: "Para o Paciente" vs "Para a Psicóloga"
- [x] Adicionar novas regras de lembrete (sem botão de excluir – apenas inativar)

### Push: Inscrição e Cancelamento
- [x] Pedir permissão com `Notification.requestPermission()`
- [x] Registrar Service Worker (`/sw.js`)
- [x] Obter subscription com `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_KEY })`
- [x] **POST** `/api/push/subscribe` com o objeto da Push API
- [x] **POST** `/api/push/unsubscribe` com `{ endpoint }`
- [x] Hook `use-push-notifications.ts` usado em Comunicações e portal do paciente
- [x] Opção de desinscrever disponível na UI

### Service Worker – Clique na Notificação
- [x] `notificationclick` implementado em `public/sw.js`
- [x] Uso de `data.url` do payload (URL do frontend)
- [x] Montagem de URL completa com `new URL(urlToOpen, self.location.origin).href`
- [x] Janela existente do app: `client.navigate(fullUrl)` + `client.focus()`
- [x] Nenhuma janela aberta: `clients.openWindow(fullUrl)`
- [x] Comportamento: abre no PWA/aba do app se existir; senão abre nova janela

### PWA Install Prompt
- [x] Detecção de plataforma (iOS vs Android)
- [x] Banner "Instalar aplicativo" em mobile
- [x] Passo a passo para instalação (iOS e Android)
- [x] Não exibe quando app já está instalado (standalone)

---

## Arquivos Principais

| Funcionalidade            | Arquivo                               |
|---------------------------|----------------------------------------|
| Service Worker (push + click) | `public/sw.js`                     |
| Push subscribe/unsubscribe | `hooks/use-push-notifications.ts`  |
| Templates e regras API    | `services/notification-template-service.ts` |
| Central configurável UI   | `app/communications/page.tsx` (aba Configurações) |
| PWA Install banner        | `components/pwa-install-prompt.tsx`    |
| Detecção plataforma PWA   | `hooks/use-pwa-install.ts`             |

---

## Variáveis de Ambiente Necessárias

- `NEXT_PUBLIC_API_URL` – URL da API (ex: `https://server.psifernandacosta.com/api`)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` – Chave pública VAPID para push

---

## Referências

- **API-NOTIFICACOES.md** (backend) – Endpoints, validações e placeholders
- **docs/PWA-NOTIFICACOES-CLICK.md** (se existir) – Detalhes do fluxo de clique
