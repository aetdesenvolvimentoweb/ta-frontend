import { Link } from 'react-router-dom'

export default function RootPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-bold tracking-tight">Toque Aquela</span>
        <nav className="flex items-center gap-3">
          <Link
            to="/artista/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/artista/cadastro"
            className="text-sm px-4 py-1.5 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-100 transition-colors"
          >
            Criar conta
          </Link>
        </nav>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Peça músicas ao vivo.</h1>
        <p className="text-zinc-400 text-lg max-w-sm">
          Escaneie o QR Code do artista, escolha uma música e mande uma gorjeta.
        </p>
      </div>
    </main>
  )
}
