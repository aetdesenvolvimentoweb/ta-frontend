import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type { ActiveShow, ArtistSong, ShowRequest } from '@/api/types'

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

  const songMap = Object.fromEntries(songs.map((s) => [s.id, s]))

  const playMutation = useMutation<unknown, ApiError, string>({
    mutationFn: (songId) =>
      api.patch(`/v1/shows/${show.id}/songs/${songId}/play`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['show-requests', show.id] }),
  })

  const finishMutation = useMutation<unknown, ApiError, void>({
    mutationFn: () => api.post(`/v1/shows/${show.id}/finish`, {}, { auth: true }),
    onSuccess: () => {
      qc.setQueryData(['active-show'], null)
      qc.invalidateQueries({ queryKey: ['active-show'] })
      navigate('/artista/dashboard', { replace: true })
    },
  })

  const pending = requests.filter((r) => r.status === 'pending')
  const played = requests.filter((r) => r.status === 'played')

  return (
    <div className="space-y-6 pt-4">
      {/* Cabeçalho do show */}
      <div className="flex items-center justify-between">
        <div>
          {new Date(show.startTime) > new Date() ? (
            <>
              <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest">
                Agendado
              </p>
              <p className="text-sm text-zinc-400 mt-0.5">
                Começa às {formatTime(show.startTime)} · {show.durationHours}h
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">
                Ao vivo
              </p>
              <p className="text-sm text-zinc-400 mt-0.5">
                Iniciado às {formatTime(show.startTime)} · {show.durationHours}h
              </p>
            </>
          )}
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

      {/* QR Code do show */}
      <ShowQRCode showId={show.id} />

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

        {pending.map((req) => (
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
          {played.map((req) => (
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

// ─── QR Code do show ─────────────────────────────────────────────────────────

function ShowQRCode({ showId }: { showId: string }) {
  const showUrl = `${window.location.origin}/show/${showId}`
  const canvasRef = useRef<HTMLDivElement>(null)

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `toque-aquela-show-${showId.slice(0, 8)}.png`
    a.click()
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`Peça músicas para mim ao vivo! Acesse: ${showUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Toque Aquela', url: showUrl })
    } else {
      await navigator.clipboard.writeText(showUrl)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col items-center gap-3">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest self-start">
        QR Code do show
      </p>
      <div ref={canvasRef} className="bg-white p-3 rounded-xl">
        <QRCodeCanvas value={showUrl} size={180} />
      </div>
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-xs font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Baixar
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 hover:border-[#25D366]/50 text-[#25D366] text-xs font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          WhatsApp
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-xs font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Compartilhar
        </button>
      </div>
    </section>
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
        played ? 'bg-zinc-900/50 border-zinc-800/50 opacity-50' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{song?.title ?? 'Música desconhecida'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{song?.originalArtist ?? '—'}</p>
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
        {request.message && <p className="text-xs text-zinc-500 italic">"{request.message}"</p>}
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
