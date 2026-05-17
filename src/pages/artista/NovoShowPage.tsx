import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/api/client'
import type { ActiveShow, ArtistProfile, CreateShowRequest, CreateShowResponse } from '@/api/types'

export default function NovoShowPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto">
        <Header />
        <div className="px-4 pb-20 pt-4">
          <PageContent />
        </div>
      </div>
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
      <Link
        to="/artista/dashboard"
        className="text-zinc-500 hover:text-white transition-colors text-sm"
      >
        ← Voltar
      </Link>
      <span className="text-zinc-700">|</span>
      <span className="font-semibold text-sm">Novo show</span>
    </header>
  )
}

// ─── Conteúdo principal ───────────────────────────────────────────────────────

function PageContent() {
  const { data: activeShow, isLoading: loadingShow } = useQuery<ActiveShow | null>({
    queryKey: ['active-show'],
    queryFn: () => api.get<ActiveShow | null>('/v1/shows/me', { auth: true }),
    retry: 1,
  })

  const { data: profile, isLoading: loadingProfile } = useQuery<ArtistProfile>({
    queryKey: ['artist-profile'],
    queryFn: () => api.get<ArtistProfile>('/v1/artists/me', { auth: true }),
  })

  if (loadingShow || loadingProfile) return <LoadingSpinner />

  if (activeShow) return <ShowAlreadyActiveState />

  return <CreateShowForm canReceiveTips={profile?.canReceiveTips ?? false} />
}

// ─── Show já ativo ────────────────────────────────────────────────────────────

function ShowAlreadyActiveState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <p className="text-zinc-300 font-medium">Você já tem um show em andamento.</p>
      <p className="text-zinc-500 text-sm">Encerre o show atual para criar um novo.</p>
      <Link
        to="/artista/dashboard"
        className="mt-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
      >
        Ir ao painel
      </Link>
    </div>
  )
}

// ─── Formulário de criação ────────────────────────────────────────────────────

function CreateShowForm({ canReceiveTips }: { canReceiveTips: boolean }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [durationHours, setDurationHours] = useState(4)
  const [scheduledStartTime, setScheduledStartTime] = useState('')

  const mutation = useMutation<CreateShowResponse, ApiError, CreateShowRequest>({
    mutationFn: body => api.post<CreateShowResponse>('/v1/shows', body, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-show'] })
      navigate('/artista/dashboard', { replace: true })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutation.mutate({
      durationHours,
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).toISOString() : undefined,
    })
  }

  // Valor mínimo do datetime-local: agora + 1 minuto
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16)
  // Valor máximo: agora + 24h
  const maxDatetime = new Date(Date.now() + 24 * 60 * 60_000).toISOString().slice(0, 16)

  const isScheduled = !!scheduledStartTime

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!canReceiveTips && (
        <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 px-4 py-3">
          <p className="text-yellow-400 text-sm">
            Sem conta Mercado Pago conectada — gorjetas não estarão disponíveis neste show.{' '}
            <Link to="/artista/perfil" className="underline hover:text-yellow-300 transition-colors">
              Conecte em Perfil
            </Link>
            .
          </p>
        </div>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Configuração
        </p>

        <div className="space-y-1.5">
          <label htmlFor="duration" className="text-xs text-zinc-500">
            Duração do show (horas)
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            max={24}
            required
            value={durationHours}
            onChange={e => setDurationHours(Number(e.target.value))}
            className="input"
          />
          <p className="text-xs text-zinc-600">Entre 1 e 24 horas. O show expira automaticamente ao fim deste período.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="scheduled-start" className="text-xs text-zinc-500">
            Horário de início (opcional)
          </label>
          <input
            id="scheduled-start"
            type="datetime-local"
            min={minDatetime}
            max={maxDatetime}
            value={scheduledStartTime}
            onChange={e => setScheduledStartTime(e.target.value)}
            className="input"
          />
          <p className="text-xs text-zinc-600">
            {isScheduled
              ? 'O QR Code já estará disponível, mas o público só poderá pedir músicas a partir deste horário.'
              : 'Deixe em branco para iniciar agora.'}
          </p>
        </div>
      </section>

      {mutation.isError && (
        <p className="text-red-400 text-sm text-center">{mutation.error?.message}</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? 'Salvando…' : isScheduled ? 'Agendar show' : 'Iniciar show agora'}
      </button>
    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
    </div>
  )
}
