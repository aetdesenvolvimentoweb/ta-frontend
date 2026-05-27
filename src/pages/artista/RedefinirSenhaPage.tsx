import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'

interface ConfirmBody {
  token: string
  newPassword: string
}

export default function RedefinirSenhaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const mutation = useMutation<void, ApiError, ConfirmBody>({
    mutationFn: (body) => api.post<void>('/v1/artists/password-reset/confirm', body),
    onSuccess: () => {
      setTimeout(() => navigate('/artista/login', { replace: true }), 1500)
    },
  })

  if (sessionStorage.getItem('jwt')) {
    return <Navigate to="/artista/dashboard" replace />
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Link inválido</h1>
          <p className="text-sm text-zinc-400">
            Este link de redefinição está incompleto. Solicite um novo pela página de login.
          </p>
          <Link
            to="/artista/esqueci-senha"
            className="inline-block text-sm text-white hover:underline underline-offset-4"
          >
            Solicitar novo link
          </Link>
        </div>
      </main>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setConfirmError('As senhas não conferem.')
      return
    }
    setConfirmError(null)
    mutation.mutate({ token, newPassword: password })
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Toque Aquela</h1>
          <p className="text-sm text-zinc-400">Defina uma nova senha</p>
        </div>

        {mutation.isSuccess ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-3 text-sm text-emerald-200">
              Senha redefinida com sucesso! Redirecionando para o login…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reset-senha" className="text-xs font-medium text-zinc-400">
                Nova senha
              </label>
              <input
                id="reset-senha"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (confirmError) setConfirmError(null)
                }}
                placeholder="Mínimo 12 caracteres"
                className="input"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reset-senha-confirm" className="text-xs font-medium text-zinc-400">
                Confirme a nova senha
              </label>
              <input
                id="reset-senha-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value)
                  if (confirmError) setConfirmError(null)
                }}
                placeholder="Repita a senha"
                className="input"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </div>

            {confirmError && <p className="text-red-400 text-sm">{confirmError}</p>}
            {mutation.isError && <p className="text-red-400 text-sm">{mutation.error?.message}</p>}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'Redefinindo…' : 'Redefinir senha'}
            </button>

            <p className="text-center text-sm text-zinc-500">
              <Link to="/artista/login" className="text-white hover:underline underline-offset-4">
                ← Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
