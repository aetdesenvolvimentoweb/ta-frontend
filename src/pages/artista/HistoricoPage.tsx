import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type { ShowDetails, ShowHistoryItem } from '@/api/types'

export default function HistoricoPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto">
        <Header />
        <div className="px-4 pb-20 pt-4">
          <HistoryList />
        </div>
      </div>
    </main>
  )
}

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
      <span className="font-semibold text-sm">Histórico</span>
    </header>
  )
}

function HistoryList() {
  const { data, isLoading, isError, error } = useQuery<ShowHistoryItem[], ApiError>({
    queryKey: ['show-history'],
    queryFn: () => api.get<ShowHistoryItem[]>('/v1/shows/history', { auth: true }),
  })

  if (isLoading) {
    return <p className="text-sm text-zinc-500 text-center py-8">Carregando histórico…</p>
  }
  if (isError) {
    return <p className="text-sm text-red-400 text-center py-8">{error.message}</p>
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="text-4xl">📜</div>
        <p className="font-semibold">Nenhum show no histórico</p>
        <p className="text-sm text-zinc-500">
          Quando você encerrar um show, ele aparecerá aqui com as métricas.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <ShowHistoryCard key={item.id} item={item} />
      ))}
    </ul>
  )
}

function ShowHistoryCard({ item }: { item: ShowHistoryItem }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(item.startTime)
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full p-4 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {formattedDate} <span className="text-zinc-500">· {formattedTime}</span>
            </p>
            <p className="text-xs text-zinc-500">
              {item.durationHours}h · <StatusBadge status={item.status} />
            </p>
          </div>
          <span className="text-zinc-500 text-xs shrink-0" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-800">
          <Metric label="Pedidos" value={String(item.totalRequests)} />
          <Metric label="Tocadas" value={String(item.totalPlayed)} />
          <Metric label="Seu líquido" value={formatBrl(item.artistShareInReal)} />
        </div>
      </button>

      {expanded && <ShowDetailsBlock showId={item.id} />}
    </li>
  )
}

function StatusBadge({ status }: { status: 'finished' | 'expired' }) {
  const label = status === 'finished' ? 'Encerrado' : 'Expirado'
  const color =
    status === 'finished'
      ? 'bg-emerald-900/40 border-emerald-800 text-emerald-400'
      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}
    >
      {label}
    </span>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  )
}

function ShowDetailsBlock({ showId }: { showId: string }) {
  const { data, isLoading, isError, error } = useQuery<ShowDetails, ApiError>({
    queryKey: ['show-details', showId],
    queryFn: () => api.get<ShowDetails>(`/v1/shows/${showId}/details`, { auth: true }),
  })

  if (isLoading) {
    return <p className="px-4 py-4 text-xs text-zinc-500">Carregando pedidos…</p>
  }
  if (isError) {
    return <p className="px-4 py-4 text-xs text-red-400">{error.message}</p>
  }
  if (!data || data.requests.length === 0) {
    return <p className="px-4 py-4 text-xs text-zinc-500">Nenhum pedido nesse show.</p>
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/40">
      <ul className="divide-y divide-zinc-800">
        {data.requests.map((req) => (
          <li key={req.id} className="px-4 py-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{req.songTitle}</p>
                <p className="text-xs text-zinc-500 truncate">{req.songOriginalArtist}</p>
              </div>
              <div className="text-right shrink-0">
                <RequestStatusBadge status={req.status} />
                {req.tipAmountInCents > 0 && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {formatBrl(req.tipAmountInCents / 100)}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              de <span className="text-zinc-300">{req.customerName}</span>
            </p>
            {req.message && <p className="text-xs text-zinc-500 italic">"{req.message}"</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function RequestStatusBadge({
  status,
}: {
  status: 'pending' | 'played' | 'cancelled' | 'refunded'
}) {
  const map = {
    played: { label: 'Tocada', color: 'text-emerald-400' },
    pending: { label: 'Pendente', color: 'text-zinc-400' },
    cancelled: { label: 'Cancelado', color: 'text-zinc-500' },
    refunded: { label: 'Estornado', color: 'text-amber-400' },
  } as const
  const { label, color } = map[status]
  return <span className={`text-[10px] font-semibold uppercase ${color}`}>{label}</span>
}

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
