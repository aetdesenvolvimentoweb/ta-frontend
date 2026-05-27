import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type { LoginRequest, LoginResponse } from '@/api/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const expired = searchParams.get('expired') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const mutation = useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: (body) => api.post<LoginResponse>('/v1/artists/login', body),
    onSuccess: async (data) => {
      sessionStorage.setItem('jwt', data.token)
      try {
        await api.get('/v1/admin/me', { auth: true })
        navigate('/admin', { replace: true })
      } catch {
        navigate('/artista/dashboard', { replace: true })
      }
    },
  })

  if (sessionStorage.getItem('jwt')) {
    return <Navigate to="/artista/dashboard" replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ email: email.trim(), password })
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Toque Aquela</h1>
          <p className="text-sm text-zinc-400">Painel do artista</p>
        </div>

        {expired && (
          <p className="rounded-lg border border-amber-900 bg-amber-950/40 px-3 py-2 text-center text-sm text-amber-300">
            Sua sessão expirou. Entre novamente.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-zinc-400">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-senha" className="text-xs font-medium text-zinc-400">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input pr-10"
                required
                minLength={12}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    role="img"
                    aria-hidden="true"
                  >
                    <title>Ocultar senha</title>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    role="img"
                    aria-hidden="true"
                  >
                    <title>Mostrar senha</title>
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mutation.isError && <p className="text-red-400 text-sm">{mutation.error?.message}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Ainda não tem conta?{' '}
          <Link to="/artista/cadastro" className="text-white hover:underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}
