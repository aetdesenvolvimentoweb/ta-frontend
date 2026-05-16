# Progresso Frontend — Toque Aquela

Última atualização: 2026-05-15 (sessão 2)

## Fundação ✅

- [x] `react-router-dom@7` + `@tanstack/react-query@5` instalados
- [x] Alias `@` → `src` configurado (Vite + tsconfig)
- [x] `src/api/client.ts` — fetch tipado com `ApiError`, `credentials: include`, auth opt-in
- [x] `src/lib/queryClient.ts` — QueryClient singleton
- [x] `src/router.tsx` — 9 rotas com `createBrowserRouter`
- [x] `src/App.tsx` — providers: `QueryClientProvider` + `RouterProvider` + DevTools
- [x] Stubs de todas as páginas criados (compilam, build passa, 0 erros TS)

---

## Páginas

### Fluxo Público

| Rota | Status | Observações |
|------|--------|-------------|
| `/show/:showId` | ✅ Feito | Repertório agrupado por estilo, modal de pedido, gorjeta PIX, redirect checkout |

### Fluxo Artista

| Rota | Status | Observações |
|------|--------|-------------|
| `/artista/login` | 🔴 Stub | Email/senha + OAuth Google (RN11) |
| `/artista/dashboard` | 🔴 Stub | Polling 5s, ordenação por valor+chegada, mark-as-played (RN03) |
| `/artista/repertorio` | 🔴 Stub | CRUD músicas (nome, artista original, estilo) |
| `/artista/show/novo` | 🔴 Stub | Criar show + CTA "Conectar Mercado Pago" (RN15, não bloqueante) |
| `/artista/perfil` | 🔴 Stub | Redes sociais + conta de pagamento |

### Admin

| Rota | Status | Observações |
|------|--------|-------------|
| `/admin` | 🔴 Stub | Whitelist de emails + métricas (RN12) |

---

## Componentes Compartilhados

- [ ] Layout artista — nav bottom mobile-first
- [ ] `<LoadingSpinner>` / `<ErrorMessage>`
- [ ] Toast / feedback de ação
- [ ] `<ProtectedRoute>` — guard JWT para rotas do artista
- [ ] `<AdminRoute>` — guard para `/admin`

---

## Ordem Sugerida de Implementação

1. `/show/:showId` — sem auth, valida toda a camada de API, maior valor de negócio
2. `/artista/login` — desbloqueia todas as rotas protegidas
3. `<ProtectedRoute>` — guard reutilizável
4. `/artista/dashboard` — painel de pedidos com polling
5. `/artista/repertorio` — CRUD de músicas
6. `/artista/show/novo` — criar show + onboarding MP
7. `/artista/perfil` — complementar
8. `/admin` — por último, público restrito

---

## Notas de Deploy

- Build: `bun run build` → `dist/`
- Deploy: `wrangler pages deploy` (workflow em `.github/workflows/deploy.yml`)
- SPA routing no Cloudflare Pages: adicionar `public/_redirects` com `/* /index.html 200` se necessário
