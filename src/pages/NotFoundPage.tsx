import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 gap-4">
      <span className="text-6xl font-bold text-zinc-700">404</span>
      <p className="text-zinc-400">Página não encontrada.</p>
      <Link to="/" className="text-sm text-zinc-300 underline underline-offset-4">
        Voltar ao início
      </Link>
    </main>
  )
}
