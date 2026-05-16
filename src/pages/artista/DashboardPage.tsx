import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/api/client'
import type { ActiveShow, ShowRequest, ArtistSong } from '@/api/types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: show, isLoading: showLoading } = useQuery<ActiveShow | null>({
    queryKey: ['active-show'],
    queryFn: () => api.get<ActiveShow | null>('/v1/shows/me', { auth: true }),
    retry: 1,
  })

  function handleLogout() {
    sessionStorage.removeItem('jwt')
    navigate('/artista/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto">
        <TopBar onLogout={handleLogout} />

        <div className="px-4 pb-20">
          {showLoading ? (
            <LoadingSpinner />
          ) : show ? (
            <ActiveShowView show={show} qc={qc} navigate={navigate} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </main>
  )
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
      <span className="font-semibold text-sm">Toque Aquela</span>
      <div className="flex items-center gap-4">
        <Link
          to="/artista/repertorio"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Repertório
        </Link>
        <Link
          to="/artista/perfil"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Perfil
        </Link>
        <button
          onClick={onLogout}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  )
}

// ─── Estado vazio (sem show ativo) ───────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="text-4xl">🎸</div>
      <div className="space-y-1">
        <p className="font-semibold">Nenhum show ativo</p>
        <p className="text-sm text-zinc-500">Inicie um show para começar a receber pedidos</p>
      </div>
      <Link
        to="/artista/show/novo"
        className="mt-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-colors"
      >
        Iniciar Show
      </Link>
    </div>
  )
}

// ─── View de show ativo ───────────────────────────────────────────────────────

function ActiveShowView({
  show,
  qc,
  navigate,
}: {
  show: ActiveShow
  qc: ReturnType<typeof useQueryClient>
  navigate: ReturnType<typeof useNavigate>
}) {
  const [confirmFinish, setConfirmFinish] = useState(false)

  const { data: songs = [] } = useQuery<ArtistSong[]>({
    queryKey: ['artist-songs'],
    queryFn: () => api.get<ArtistSong[]>('/v1/songs', { auth: true }),
    staleTime: 60_000,
  })

  const { data: requests = [], isLoading: requestsLoading } = useQuery<ShowRequest[]>({
    queryKey: ['show-requests', show.id],
    queryFn: () => api.get<ShowRequest[]>(`/v1/shows/${show.id}/requests`, { auth: true }),
    refetchInterval: 5_000,
  })

  const songMap = Object.fromEntries(songs.map(s => [s.id, s]))

  const playMutation = useMutation<unknown, ApiError, string>({
    mutationFn: songId =>
      api.patch(`/v1/shows/${show.id}/songs/${songId}/play`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['show-requests', show.id] }),
  })

  const finishMutation = useMutation<unknown, ApiError, void>({
    mutationFn: () =>
      api.post(`/v1/shows/${show.id}/finish`, {}, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-show'] })
      navigate('/artista/show/novo', { replace: true })
    },
  })

  const pending = requests.filter(r => r.status === 'pending')
  const played = requests.filter(r => r.status === 'played')

  return (
    <div className="space-y-6 pt-4">
      {/* Cabeçalho do show */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">
            Ao vivo
          </p>
          <p className="text-sm text-zinc-400 mt-0.5">
            Iniciado às {formatTime(show.startTime)} · {show.durationHours}h
          </p>
        </div>

        {confirmFinish ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmFinish(false)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => finishMutation.mutate()}
              disabled={finishMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {finishMutation.isPending ? 'Encerrando…' : 'Confirmar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmFinish(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-medium transition-colors"
          >
            Encerrar show
          </button>
        )}
      </div>

      {finishMutation.isError && (
        <p className="text-red-400 text-sm">{finishMutation.error?.message}</p>
      )}

      {/* Pedidos pendentes */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          {requestsLoading
            ? 'Carregando…'
            : `${pending.length} pedido${pending.length !== 1 ? 's' : ''} na fila`}
        </h2>

        {pending.length === 0 && !requestsLoading && (
          <p className="text-sm text-zinc-600 py-4 text-center">
            Nenhum pedido ainda. Compartilhe o QR Code!
          </p>
        )}

        {pending.map(req => (
          <RequestCard
            key={req.id}
            request={req}
            song={songMap[req.songId]}
            onPlay={() => playMutation.mutate(req.songId)}
            isPlaying={playMutation.isPending && playMutation.variables === req.songId}
            played={false}
          />
        ))}
      </section>

      {/* Pedidos já tocados */}
      {played.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">
            Tocadas ({played.length})
          </h2>
          {played.map(req => (
            <RequestCard
              key={req.id}
              request={req}
              song={songMap[req.songId]}
              onPlay={() => {}}
              isPlaying={false}
              played={true}
            />
          ))}
        </section>
      )}
    </div>
  )
}

// ─── Card de pedido ───────────────────────────────────────────────────────────

function RequestCard({
  request,
  song,
  onPlay,
  isPlaying,
  played,
}: {
  request: ShowRequest
  song: ArtistSong | undefined
  onPlay: () => void
  isPlaying: boolean
  played: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-colors ${
        played
          ? 'bg-zinc-900/50 border-zinc-800/50 opacity-50'
          : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {song?.title ?? 'Música desconhecida'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {song?.originalArtist ?? '—'}
          </p>
        </div>

        {request.tipAmountInCents > 0 && (
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            R$ {(request.tipAmountInCents / 100).toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-400">
          de <span className="text-white font-medium">{request.customerName}</span>
        </p>
        {request.message && (
          <p className="text-xs text-zinc-500 italic">"{request.message}"</p>
        )}
      </div>

      {!played && (
        <button
          onClick={onPlay}
          disabled={isPlaying}
          className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium disabled:opacity-50 transition-colors border border-zinc-700 hover:border-zinc-600"
        >
          {isPlaying ? 'Marcando…' : '✓ Tocada'}
        </button>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
    </div>
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
