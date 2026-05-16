import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '@/api/client'
import type { LoginRequest, LoginResponse } from '@/api/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: body => api.post<LoginResponse>('/v1/artists/login', body),
    onSuccess: (data) => {
      sessionStorage.setItem('jwt', data.token)
      navigate('/artista/dashboard', { replace: true })
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              autoComplete="current-password"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm">{mutation.error?.message}</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
