import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type { RegisterRequest, RegisterResponse } from '@/api/types'

export default function CadastroPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationFn: (body) => api.post<RegisterResponse>('/v1/artists', body),
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
    mutation.mutate({ name: name.trim(), email: email.trim(), password })
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Toque Aquela</h1>
          <p className="text-sm text-zinc-400">Crie sua conta de artista</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cadastro-nome" className="text-xs font-medium text-zinc-400">
              Nome artístico
            </label>
            <input
              id="cadastro-nome"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como você se apresenta?"
              className="input"
              minLength={2}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cadastro-email" className="text-xs font-medium text-zinc-400">
              E-mail
            </label>
            <input
              id="cadastro-email"
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
            <label htmlFor="cadastro-senha" className="text-xs font-medium text-zinc-400">
              Senha
            </label>
            <input
              id="cadastro-senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 12 caracteres"
              className="input"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </div>

          {mutation.isError && <p className="text-red-400 text-sm">{mutation.error?.message}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Já tem conta?{' '}
          <Link to="/artista/login" className="text-white hover:underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
