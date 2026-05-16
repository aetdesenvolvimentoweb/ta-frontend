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
    client.ts           ← fetch wrapper tipado (ApiError, credentials:include)
    types.ts            ← interfaces de request/response por domínio
  components/
    ProtectedRoute.tsx  ← guard JWT (Outlet pattern do react-router v7)
  lib/
    queryClient.ts      ← QueryClient singleton (staleTime: 10s, retry: 1)
  pages/
    RootPage.tsx        ← / (landing com header de navegação)
    NotFoundPage.tsx    ← * (404)
    public/
      ShowPage.tsx      ← /show/:showId
    artista/
      CadastroPage.tsx  ← /artista/cadastro
      LoginPage.tsx     ← /artista/login
      DashboardPage.tsx ← /artista/dashboard  [PROTEGIDA]
      RepertorioPage.tsx← /artista/repertorio [PROTEGIDA]
      NovoShowPage.tsx  ← /artista/show/novo  [PROTEGIDA]
      PerfilPage.tsx    ← /artista/perfil     [PROTEGIDA]
    admin/
      AdminPage.tsx     ← /admin
  router.tsx            ← createBrowserRouter; rotas do artista aninhadas em <ProtectedRoute>
  App.tsx               ← QueryClientProvider + RouterProvider + DevTools
  main.tsx              ← entry point
```

## Estrutura de Páginas

```
/                        → Landing com links "Entrar" / "Criar conta"
/show/:showId            → Página pública: repertório + pedido + gorjeta
/artista/cadastro        → Cadastro de artista (POST /v1/artists)
/artista/login           → Login do artista (POST /v1/artists/login)
/artista/dashboard       → Painel: lista de pedidos em tempo real  [JWT]
/artista/repertorio      → Gerenciamento de músicas               [JWT]
/artista/show/novo       → Criar show + onboarding de pagamento   [JWT]
/artista/perfil          → Redes sociais + conta de pagamento      [JWT]
/admin                   → Painel admin (whitelist + métricas)
```

## Comunicação com o Backend

- **Base URL:** `import.meta.env.VITE_API_URL` (definida via `.env.local`)
- **Cliente HTTP:** `src/api/client.ts` — wrapper fino em torno de `fetch` nativo
  - `credentials: 'include'` em toda requisição (necessário para o cookie `customer_sid`)
  - Header `Authorization: Bearer <token>` lido de `sessionStorage.getItem('jwt')` quando `auth: true`
  - Lança `ApiError(status, message)` em respostas não-ok
  - Retorna `undefined` em respostas 204
- **Auth:** JWT salvo em `sessionStorage` (limpo ao fechar a aba), enviado no header `Authorization`
- **Sessão pública:** cookie HttpOnly `customer_sid` (gerenciado pelo browser — **não manipular via JS**)
- **Tempo real no painel:** polling via `useQuery` com `refetchInterval: 5000`

## Padrões de uso do React Query

```ts
// Leitura autenticada com polling
useQuery<T>({
  queryKey: ['chave', id],
  queryFn: () => api.get<T>('/v1/rota', { auth: true }),
  refetchInterval: 5_000,
})

// Mutação com invalidação
const mutation = useMutation<Res, ApiError, Body>({
  mutationFn: body => api.post<Res>('/v1/rota', body, { auth: true }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['chave'] }),
})
```

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
- **Componentes locais em arquivo único:** subcomponentes de uma página ficam no mesmo arquivo que a página, exportados como funções locais (não default export).

## Regras Críticas

- **Nunca** manipular o cookie `customer_sid` via JS — ele é HttpOnly por segurança (RN13/RN09)
- **Nunca** armazenar JWT no `localStorage` — usar `sessionStorage` (limpo ao fechar a aba)
- **RN15:** mostrar CTA "Conectar Mercado Pago" ao criar primeiro show, não bloquear a criação
- **Gorjeta:** se `payment.checkoutUrl` retornar na resposta do pedido, redirecionar para PIX checkout (`window.location.href`)
- **Guard de rotas:** usar `<ProtectedRoute>` (Outlet pattern) — não verificar JWT dentro de cada página individualmente
