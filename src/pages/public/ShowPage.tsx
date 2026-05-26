import { useMutation, useQuery } from '@tanstack/react-query'
import { cloneElement, type ReactElement, useEffect, useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError, api } from '@/api/client'
import type { CreateRequestBody, CreateRequestResponse, PublicShow, PublicSong } from '@/api/types'

export default function ShowPage() {
  const { showId } = useParams<{ showId: string }>()

  const { data, isLoading, isError, error } = useQuery<PublicShow>({
    queryKey: ['public-show', showId],
    queryFn: () => api.get<PublicShow>(`/v1/shows/${showId}`),
    enabled: !!showId,
    retry: 1,
  })

  if (!showId)
    return (
      <PageShell>
        <ErrorState error={new ApiError(400, 'Link inválido — código do show ausente.')} />
      </PageShell>
    )

  if (isLoading)
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    )
  if (isError || !data)
    return (
      <PageShell>
        <ErrorState error={error} />
      </PageShell>
    )

  const isExpiredOrFinished = data.show.status !== 'active'
  const isScheduled = new Date(data.show.startTime) > new Date()

  return (
    <PageShell>
      <ArtistHeader artist={data.artist} />
      {isExpiredOrFinished ? (
        <div className="mt-8 text-center text-zinc-400 text-sm">
          Este show já foi encerrado. Obrigado por participar!
        </div>
      ) : isScheduled ? (
        <ScheduledState startTime={data.show.startTime} />
      ) : (
        <SongList songs={data.songs} showId={showId} canReceiveTips={data.artist.canReceiveTips} />
      )}
    </PageShell>
  )
}

// ─── Layout shell ────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pb-20">{children}</div>
    </main>
  )
}

// ─── Header do artista ────────────────────────────────────────────────────────

function ArtistHeader({ artist }: { artist: PublicShow['artist'] }) {
  const socialLinks = Object.entries(artist.socials ?? {})

  return (
    <header className="py-8 text-center space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{artist.name}</h1>
      {socialLinks.length > 0 && (
        <div className="flex justify-center gap-4 flex-wrap">
          {socialLinks.map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-white capitalize transition-colors"
            >
              {platform}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

// ─── Show agendado (countdown) ────────────────────────────────────────────────

function ScheduledState({ startTime }: { startTime: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(startTime).getTime() - Date.now())
  )

  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, new Date(startTime).getTime() - Date.now())
      setRemaining(diff)
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="mt-12 flex flex-col items-center gap-4 text-center">
      <p className="text-zinc-400 text-sm">O show começa em</p>
      <p className="text-4xl font-bold tabular-nums tracking-tight">
        {h > 0 && <>{pad(h)}:</>}
        {pad(m)}:{pad(s)}
      </p>
      <p className="text-zinc-500 text-xs">
        às {new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-zinc-600 text-xs mt-2">
        Fique por aqui — o repertório aparecerá quando o show iniciar.
      </p>
    </div>
  )
}

// ─── Lista de músicas ─────────────────────────────────────────────────────────

function SongList({
  songs,
  showId,
  canReceiveTips,
}: {
  songs: PublicSong[]
  showId: string
  canReceiveTips: boolean
}) {
  const [selected, setSelected] = useState<PublicSong | null>(null)

  if (songs.length === 0) {
    return (
      <div className="mt-8 text-center text-zinc-500 text-sm">
        O artista ainda não cadastrou músicas no repertório.
      </div>
    )
  }

  const grouped = groupByStyle(songs)

  return (
    <section className="space-y-6 mt-2">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Repertório</h2>
      {Object.entries(grouped).map(([style, items]) => (
        <div key={style}>
          {style !== 'Sem estilo' && (
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{style}</p>
          )}
          <ul className="space-y-2">
            {items.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => setSelected(song)}
                  className="w-full text-left p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800 hover:border-zinc-600"
                >
                  <span className="block font-medium text-sm">{song.title}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{song.originalArtist}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {selected && (
        <RequestModal
          song={selected}
          showId={showId}
          canReceiveTips={canReceiveTips}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}

// ─── Modal de pedido ──────────────────────────────────────────────────────────

function RequestModal({
  song,
  showId,
  canReceiveTips,
  onClose,
}: {
  song: PublicSong
  showId: string
  canReceiveTips: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [tipCents, setTipCents] = useState(0)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation<CreateRequestResponse, ApiError, CreateRequestBody>({
    mutationFn: (body) => api.post<CreateRequestResponse>(`/v1/shows/${showId}/requests`, body),
    onSuccess: (data) => {
      if (data.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl
      } else {
        setSuccess(true)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({
      songId: song.id,
      customerName: name.trim(),
      message: message.trim() || undefined,
      tipAmountInCents: tipCents,
    })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
        className="relative w-full max-w-md bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-800 p-6 space-y-5"
      >
        {success ? (
          <SuccessState songTitle={song.title} onClose={onClose} />
        ) : (
          <>
            <div>
              <h3 id="request-modal-title" className="font-semibold text-base">
                {song.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{song.originalArtist}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Seu nome">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Como devo te chamar?"
                  className="input"
                  required
                />
              </Field>

              <Field label="Dedicatória (opcional)">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={280}
                  rows={2}
                  placeholder="Uma mensagem para o artista..."
                  className="input resize-none"
                />
              </Field>

              {canReceiveTips && <TipSelector value={tipCents} onChange={setTipCents} />}

              {mutation.isError && (
                <p className="text-red-400 text-sm">{mutation.error?.message}</p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || !name.trim()}
                className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mutation.isPending
                  ? 'Enviando…'
                  : tipCents > 0
                    ? `Pedir + pagar R$ ${(tipCents / 100).toFixed(2)}`
                    : 'Pedir esta música'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Seletor de gorjeta ───────────────────────────────────────────────────────

const TIP_OPTIONS = [0, 200, 500, 1000, 2000]

function TipSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-400">Gorjeta (opcional)</p>
      <div className="flex gap-2 flex-wrap">
        {TIP_OPTIONS.map((cents) => (
          <button
            key={cents}
            type="button"
            onClick={() => onChange(cents)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${
                value === cents
                  ? 'bg-white text-zinc-950 border-white'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
              }`}
          >
            {cents === 0 ? 'Sem gorjeta' : `R$ ${(cents / 100).toFixed(2)}`}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-400">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  )
}

function SuccessState({ songTitle, onClose }: { songTitle: string; onClose: () => void }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="text-4xl">🎵</div>
      <div>
        <p className="font-semibold">Pedido enviado!</p>
        <p className="text-sm text-zinc-400 mt-1">
          <span className="font-medium text-white">{songTitle}</span> está na fila do artista.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-sm text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
      >
        Fechar
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
    </div>
  )
}

function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof ApiError ? error.message : 'Não foi possível carregar o show.'

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <p className="text-zinc-400 text-sm">{msg}</p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByStyle(songs: PublicSong[]): Record<string, PublicSong[]> {
  return songs.reduce<Record<string, PublicSong[]>>((acc, song) => {
    const key = song.styleName ?? 'Sem estilo'
    if (!acc[key]) acc[key] = []
    acc[key].push(song)
    return acc
  }, {})
}
