import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import { Brand } from '@/components/Brand'

interface RequestBody {
  email: string
}

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')

  const mutation = useMutation<void, ApiError, RequestBody>({
    mutationFn: (body) => api.post<void>('/v1/artists/password-reset/request', body),
  })

  if (sessionStorage.getItem('jwt')) {
    return <Navigate to="/artista/dashboard" replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ email: email.trim() })
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <Brand size="lg" />
          <p className="text-sm text-zinc-400">Recuperar senha</p>
        </div>

        {mutation.isSuccess ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-3 text-sm text-emerald-200">
              Se houver uma conta com esse e-mail, enviaremos um link de redefinição em instantes.
              Verifique também a caixa de spam.
            </p>
            <Link
              to="/artista/login"
              className="inline-block text-sm text-white hover:underline underline-offset-4"
            >
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-zinc-400 text-center">
              Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="recover-email" className="text-xs font-medium text-zinc-400">
                E-mail
              </label>
              <input
                id="recover-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input"
                required
                autoComplete="email"
              />
            </div>

            {mutation.isError && <p className="text-red-400 text-sm">{mutation.error?.message}</p>}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Lembrou da senha?{' '}
              <Link to="/artista/login" className="text-white hover:underline underline-offset-4">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
