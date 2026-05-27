import { Link } from 'react-router-dom'
import { Brand } from '@/components/Brand'

export default function RootPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <Brand size="md" />
        <Link
          to="/artista/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Entrar
        </Link>
      </header>

      <Hero />
      <HowItWorks />
      <FinalCta />

      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} Toque Aquela. Feito para músicos.
      </footer>
    </main>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Receba pedidos.
            <br />
            <span className="text-emerald-400">Receba gorjetas.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto leading-relaxed">
            O bilhete de papel agora cabe no celular do seu público — e o PIX cai direto na sua
            conta.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/artista/cadastro"
            className="inline-block px-8 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-base hover:bg-zinc-100 transition-colors"
          >
            Criar minha conta gratuita
          </Link>
          <p className="text-xs text-zinc-500">
            Sem mensalidade. Comissão de 15% só quando você recebe gorjeta.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Como funciona ──────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    title: 'Cadastre seu repertório',
    body: 'Conte quais músicas você toca. Edite a qualquer hora — habilite só o que está em forma esta noite.',
  },
  {
    n: '2',
    title: 'Mostre o QR Code no show',
    body: 'Comece um show no app e exiba o QR Code no palco. Seu público escaneia pelo celular, sem instalar nada.',
  },
  {
    n: '3',
    title: 'Receba pedidos e PIX',
    body: 'A gorjeta vai direto pra sua conta no Mercado Pago. Você nunca precisa nos passar CPF, conta ou chave PIX.',
  },
] as const

function HowItWorks() {
  return (
    <section className="border-y border-zinc-900 px-6 py-16 sm:py-20 bg-zinc-900/30">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Como funciona
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Três passos. Mais nada.</h2>
        </div>

        <ol className="space-y-6 sm:space-y-8">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-4 sm:gap-6">
              <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                {step.n}
              </span>
              <div className="space-y-1 pt-1">
                <h3 className="font-semibold text-base">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── CTA final ──────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pronto pro próximo show?</h2>
        <p className="text-zinc-400 leading-relaxed">
          Cadastro leva menos de um minuto. Você só conecta sua conta do Mercado Pago quando quiser
          começar a receber gorjetas.
        </p>
        <div className="space-y-3">
          <Link
            to="/artista/cadastro"
            className="inline-block px-8 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-base hover:bg-zinc-100 transition-colors"
          >
            Criar minha conta gratuita
          </Link>
          <p className="text-sm text-zinc-500">
            Já tem conta?{' '}
            <Link to="/artista/login" className="text-white hover:underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
