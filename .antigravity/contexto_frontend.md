# Contexto Frontend — Toque Aquela

Referência do projeto completo: `../ta-backend/.antigravity/contexto_do_projeto.md`

## Stack

- **Runtime de build:** Bun
- **Framework:** Vite 8 + React 19 + TypeScript (strict)
- **Estilo:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **PWA:** `vite-plugin-pwa` (Workbox, `registerType: autoUpdate`)
- **Deploy:** Cloudflare Pages (SPA estático, `dist/` servido)

## Decisões de Arquitetura

- **SPA puro** (sem SSR): backend já é uma API REST separada (`ta-backend`). Sem necessidade de SSR — o conteúdo não precisa de indexação SEO.
- **Mobile-first**: público acessa via QR Code no celular. Artista gerencia pelo celular/tablet. Toda UI parte do breakpoint `sm` para cima.
- **PWA obrigatório**: manifesto configurado para `display: standalone`, `orientation: portrait`. Ícones em `/public/icons/`.

## Estrutura de Páginas (planejada)

```
/                        → Página de entrada pública (landing/redirect por QR)
/show/:showId            → Página pública: repertório + pedido + gorjeta
/artista/login           → Login do artista (email/senha + OAuth Google)
/artista/dashboard       → Painel: lista de pedidos em tempo real
/artista/repertorio      → Gerenciamento de músicas
/artista/show/novo       → Criar show + onboarding de pagamento (RN15)
/artista/perfil          → Redes sociais + conta de pagamento
/admin                   → Painel admin (whitelist + métricas)
```

## Comunicação com o Backend

- Base URL via `VITE_API_URL` (env)
- Auth: JWT Bearer em header `Authorization`
- Sessão pública: cookie HttpOnly `customer_sid` (gerenciado pelo browser automaticamente — **não manipular no JS**)
- Tempo real no painel do artista: polling com Tanstack Query (interval de 5s) ou SSE futuro

## Regras Críticas

- **Nunca** manipular o cookie `customer_sid` via JS — ele é HttpOnly por segurança (RN13/RN09)
- **Nunca** armazenar JWT no localStorage — usar `sessionStorage` ou cookie HttpOnly próprio
- **RN15**: mostrar CTA "Conectar Mercado Pago" ao criar primeiro show, não bloquear a criação
- Gorjeta: se `payment.checkoutUrl` retornar na resposta do pedido, redirecionar para PIX checkout
