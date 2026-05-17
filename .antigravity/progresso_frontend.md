# Progresso Frontend — Toque Aquela

Última atualização: 2026-05-17 (sessão 5)

## Fundação ✅

- [x] `react-router-dom@7` + `@tanstack/react-query@5` instalados
- [x] Alias `@` → `src` configurado (Vite + tsconfig)
- [x] `src/api/client.ts` — fetch tipado com `ApiError`, `credentials: include`, auth opt-in
- [x] `src/lib/queryClient.ts` — QueryClient singleton
- [x] `src/router.tsx` — rotas com `createBrowserRouter` (atualizado a cada página)
- [x] `src/App.tsx` — providers: `QueryClientProvider` + `RouterProvider` + DevTools
- [x] Stubs de todas as páginas criados (compilam, build passa, 0 erros TS)

---

## Páginas

### Fluxo Público

| Rota | Status | Observações |
|------|--------|-------------|
| `/` | ✅ Feito | Header com links "Entrar" / "Criar conta" |
| `/show/:showId` | ✅ Feito | Repertório agrupado por estilo, modal de pedido, gorjeta PIX, redirect checkout |

### Fluxo Artista

| Rota | Status | Observações |
|------|--------|-------------|
| `/artista/cadastro` | ✅ Feito | POST /v1/artists → JWT em sessionStorage → dashboard |
| `/artista/login` | ✅ Feito | POST /v1/artists/login → JWT em sessionStorage → dashboard |
| `/artista/dashboard` | ✅ Feito | Polling 5s, show ativo via GET /shows/me, mark-as-played, encerrar show |
| `/artista/repertorio` | ✅ Feito | CRUD músicas (nome, artista original, estilo) + toggle disponibilidade |
| `/artista/show/novo` | ✅ Feito | Formulário + CTA "Conectar Mercado Pago" (RN15, não bloqueante) |
| `/artista/perfil` | ✅ Feito | Nome editável, 6 redes sociais, conta MP connect/disconnect |

### Admin

| Rota | Status | Observações |
|------|--------|-------------|
| `/admin` | 🔴 Stub | Whitelist de emails + métricas (RN12) |

---

## Componentes Compartilhados

- [x] `<ProtectedRoute>` — guard JWT para rotas do artista (Outlet pattern)
- [ ] Layout artista — nav bottom mobile-first (pendente até ter mais páginas)
- [ ] `<AdminRoute>` — guard para `/admin`
- [ ] Toast / feedback de ação global

---

## Tipos de API (`src/api/types.ts`)

| Grupo | Interfaces |
|-------|-----------|
| Show público | `PublicShow`, `PublicSong`, `CreateRequestBody`, `CreateRequestResponse` |
| Dashboard | `ActiveShow`, `ShowRequest`, `ArtistSong` |
| Auth | `RegisterRequest`, `RegisterResponse`, `LoginRequest`, `LoginResponse` |
| Perfil | `ArtistProfile`, `UpdateProfileRequest`, `StartPaymentConnectionResponse` |

---

## Backend — endpoints adicionados pelo frontend

| Endpoint | Arquivo | Motivo |
|----------|---------|--------|
| `GET /v1/shows/me` | `show.controller.ts` + `get-active-show.use-case.ts` | Dashboard precisa saber se há show ativo |
| `GET /v1/shows/:showId` (público) | `public-show.controller.ts` + `get-public-show.use-case.ts` | Página pública `/show/:showId` |
| `GET /v1/artists/me` | `artist.controller.ts` + `update-artist-profile.use-case.ts` | Perfil do artista autenticado |
| `PATCH /v1/artists/me` | `artist.controller.ts` + `update-artist-profile.use-case.ts` | Atualizar nome e sociais |

---

## Ordem de Implementação

1. ✅ `/show/:showId` — sem auth, valida toda a camada de API
2. ✅ `/artista/cadastro` + `/artista/login` — auth completa
3. ✅ `<ProtectedRoute>` — guard reutilizável
4. ✅ `/artista/dashboard` — painel de pedidos com polling
5. ✅ `/artista/repertorio` — CRUD de músicas + toggle disponibilidade
6. ✅ `/artista/perfil` — nome, redes sociais, conta de pagamento
7. ✅ `/artista/show/novo` — criar show + onboarding MP (RN15)
8. 🔜 `/admin` — painel admin restrito

---

## Notas de Deploy

- Build: `bun run build` → `dist/`
- Deploy: `wrangler pages deploy` (workflow em `.github/workflows/deploy.yml`)
- SPA routing no Cloudflare Pages: adicionar `public/_redirects` com `/* /index.html 200` se necessário

## Estabilidade de Infra (sessão 5)

Erros intermitentes de comunicação com o backend/banco foram resolvidos no lado do `ta-backend`:
- Driver de banco trocado para `@neondatabase/serverless` HTTP em produção (sem pool que fica obsoleto quando o Neon pausa)
- UptimeRobot configurado para pingar o Render a cada 5 min (elimina cold starts no free tier)
