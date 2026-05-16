# Contexto Frontend — Toque Aquela

Referência do projeto completo: `../ta-backend/.antigravity/contexto_do_projeto.md`
Progresso atual: `./progresso_frontend.md`

## Stack

- **Runtime de build:** Bun
- **Framework:** Vite 8 + React 19 + TypeScript 6 (strict + `erasableSyntaxOnly`)
- **Estilo:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Roteamento:** react-router-dom@7 (`createBrowserRouter`)
- **Server state:** @tanstack/react-query@5 (polling + cache)
- **PWA:** `vite-plugin-pwa` (Workbox, `registerType: autoUpdate`)
- **Deploy:** Cloudflare Pages (SPA estático, `dist/` servido via `wrangler pages deploy`)

## Decisões de Arquitetura

- **SPA puro** (sem SSR): backend já é uma API REST separada (`ta-backend`). Conteúdo não precisa de indexação SEO.
- **Mobile-first**: público acessa via QR Code no celular. Artista gerencia pelo celular/tablet. Toda UI parte do breakpoint `sm` para cima.
- **PWA obrigatório**: manifesto configurado para `display: standalone`, `orientation: portrait`. Ícones em `/public/icons/`.

## Estrutura de Pastas (implementada)

```
src/
  api/
    client.ts          ← fetch wrapper tipado (ApiError, credentials:include)
  lib/
    queryClient.ts     ← QueryClient singleton (staleTime: 10s, retry: 1)
  pages/
    RootPage.tsx       ← /
    NotFoundPage.tsx   ← * (404)
    public/
      ShowPage.tsx     ← /show/:showId
    artista/
      LoginPage.tsx    ← /artista/login
      DashboardPage.tsx← /artista/dashboard
      RepertorioPage.tsx← /artista/repertorio
      NovoShowPage.tsx ← /artista/show/novo
      PerfilPage.tsx   ← /artista/perfil
    admin/
      AdminPage.tsx    ← /admin
  router.tsx           ← createBrowserRouter com todas as rotas
  App.tsx              ← QueryClientProvider + RouterProvider + DevTools
  main.tsx             ← entry point
```

## Estrutura de Páginas

```
/                        → Página de entrada pública (landing)
/show/:showId            → Página pública: repertório + pedido + gorjeta
/artista/login           → Login do artista (email/senha + OAuth Google)
/artista/dashboard       → Painel: lista de pedidos em tempo real
/artista/repertorio      → Gerenciamento de músicas
/artista/show/novo       → Criar show + onboarding de pagamento (RN15)
/artista/perfil          → Redes sociais + conta de pagamento
/admin                   → Painel admin (whitelist + métricas)
```

## Comunicação com o Backend

- **Base URL:** `import.meta.env.VITE_API_URL` (definida via `.env.local`)
- **Cliente HTTP:** `src/api/client.ts` — wrapper fino em torno de `fetch` nativo
  - `credentials: 'include'` em toda requisição (necessário para o cookie `customer_sid`)
  - Header `Authorization: Bearer <token>` lido de `sessionStorage.getItem('jwt')` quando `auth: true`
  - Lança `ApiError(status, message)` em respostas não-ok
- **Auth:** JWT Bearer em header `Authorization`
- **Sessão pública:** cookie HttpOnly `customer_sid` (gerenciado pelo browser — **não manipular via JS**)
- **Tempo real no painel:** polling via `useQuery` com `refetchInterval: 5000` (SSE futuramente)

## Convenções de Código

- **Alias `@`:** `@/*` → `src/*` — configurado no `vite.config.ts` (`resolve.alias`) e `tsconfig.app.json` (`paths`, sem `baseUrl`)
- **`erasableSyntaxOnly: true`:** proíbe parameter properties de classe (`public readonly x` no construtor). Declarar o campo separadamente:
  ```ts
  // ERRADO — não compila
  constructor(public readonly status: number) {}

  // CORRETO
  readonly status: number
  constructor(status: number) { this.status = status }
  ```
- **Sem `baseUrl`:** TypeScript 6 com `moduleResolution: bundler` resolve `paths` relativo ao tsconfig sem precisar de `baseUrl` (foi deprecada no TS 6).

## Regras Críticas

- **Nunca** manipular o cookie `customer_sid` via JS — ele é HttpOnly por segurança (RN13/RN09)
- **Nunca** armazenar JWT no `localStorage` — usar `sessionStorage` (limpo ao fechar a aba)
- **RN15:** mostrar CTA "Conectar Mercado Pago" ao criar primeiro show, não bloquear a criação
- **Gorjeta:** se `payment.checkoutUrl` retornar na resposta do pedido, redirecionar para PIX checkout
