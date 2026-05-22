import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type { AddSongRequest, ArtistSong, Style } from '@/api/types'

export default function RepertorioPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto">
        <Header onAdd={() => setShowForm((v) => !v)} showingForm={showForm} />
        <div className="px-4 pb-20 space-y-4">
          {showForm && <AddSongForm onSuccess={() => setShowForm(false)} />}
          <SongList />
        </div>
      </div>
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ onAdd, showingForm }: { onAdd: () => void; showingForm: boolean }) {
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
      <div className="flex items-center gap-3">
        <Link
          to="/artista/dashboard"
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ← Voltar
        </Link>
        <span className="text-zinc-700">|</span>
        <span className="font-semibold text-sm">Repertório</span>
      </div>
      <button
        onClick={onAdd}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors"
      >
        {showingForm ? 'Cancelar' : '+ Adicionar'}
      </button>
    </header>
  )
}

// ─── Formulário de nova música ────────────────────────────────────────────────

function AddSongForm({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [originalArtist, setOriginalArtist] = useState('')
  const [styleName, setStyleName] = useState('')

  const { data: styles = [], isLoading: stylesLoading } = useQuery<Style[]>({
    queryKey: ['styles'],
    queryFn: () => api.get<Style[]>('/v1/styles', { auth: true }),
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation<ArtistSong, ApiError, AddSongRequest>({
    mutationFn: (body) => api.post<ArtistSong>('/v1/songs', body, { auth: true }),
    onSuccess: (newSong) => {
      qc.setQueryData<ArtistSong[]>(['artist-songs'], (old) =>
        old ? [...old, newSong] : [newSong]
      )
      onSuccess()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      title: title.trim(),
      originalArtist: originalArtist.trim(),
      styleName,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3"
    >
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Nova música</p>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-500">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Evidências"
          className="input"
          required
          minLength={1}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-500">Artista original</label>
        <input
          type="text"
          value={originalArtist}
          onChange={(e) => setOriginalArtist(e.target.value)}
          placeholder="Ex: Chitãozinho & Xororó"
          className="input"
          required
          minLength={1}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-500">Estilo musical</label>
        {stylesLoading ? (
          <div className="input flex items-center">
            <span className="text-zinc-600 text-sm">Carregando estilos…</span>
          </div>
        ) : styles.length === 0 ? (
          <div className="input flex items-center">
            <span className="text-zinc-600 text-sm">
              Nenhum estilo cadastrado pelo admin ainda.
            </span>
          </div>
        ) : (
          <select
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
            className="input"
            required
          >
            <option value="">Selecione um estilo…</option>
            {styles.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {mutation.isError && <p className="text-red-400 text-sm">{mutation.error?.message}</p>}

      <button
        type="submit"
        disabled={mutation.isPending || stylesLoading || styles.length === 0}
        className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? 'Salvando…' : 'Salvar música'}
      </button>
    </form>
  )
}

// ─── Lista de músicas ─────────────────────────────────────────────────────────

function SongList() {
  const { data: songs = [], isLoading } = useQuery<ArtistSong[]>({
    queryKey: ['artist-songs'],
    queryFn: () => api.get<ArtistSong[]>('/v1/songs', { auth: true }),
    staleTime: 60_000,
  })

  if (isLoading) return <LoadingSpinner />

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <p className="text-zinc-500 text-sm">Nenhuma música no repertório ainda.</p>
        <p className="text-zinc-600 text-xs">Adicione músicas para que os clientes possam pedir.</p>
      </div>
    )
  }

  const available = songs.filter((s) => s.isAvailable)
  const unavailable = songs.filter((s) => !s.isAvailable)

  return (
    <div className="space-y-6">
      {available.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Disponíveis ({available.length})
          </p>
          {available.map((song) => (
            <SongRow key={song.id} song={song} />
          ))}
        </section>
      )}

      {unavailable.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">
            Indisponíveis ({unavailable.length})
          </p>
          {unavailable.map((song) => (
            <SongRow key={song.id} song={song} />
          ))}
        </section>
      )}
    </div>
  )
}

// ─── Linha de música ──────────────────────────────────────────────────────────

function SongRow({ song }: { song: ArtistSong }) {
  const qc = useQueryClient()

  const toggleMutation = useMutation<unknown, ApiError, boolean>({
    mutationFn: (isAvailable) =>
      api.patch(`/v1/songs/${song.id}/availability`, { isAvailable }, { auth: true }),
    onMutate: async (isAvailable) => {
      await qc.cancelQueries({ queryKey: ['artist-songs'] })
      const prev = qc.getQueryData<ArtistSong[]>(['artist-songs'])
      qc.setQueryData<ArtistSong[]>(['artist-songs'], (old) =>
        old?.map((s) => (s.id === song.id ? { ...s, isAvailable } : s))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx != null && typeof ctx === 'object' && 'prev' in ctx) {
        qc.setQueryData(['artist-songs'], (ctx as { prev: ArtistSong[] }).prev)
      }
    },
  })

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
        song.isAvailable ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/40 border-zinc-800/40'
      }`}
    >
      <div className="min-w-0">
        <p
          className={`font-medium text-sm truncate ${song.isAvailable ? 'text-white' : 'text-zinc-500'}`}
        >
          {song.title}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5 truncate">{song.originalArtist}</p>
      </div>

      <button
        onClick={() => toggleMutation.mutate(!song.isAvailable)}
        disabled={toggleMutation.isPending}
        aria-label={song.isAvailable ? 'Tornar indisponível' : 'Tornar disponível'}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${
          song.isAvailable ? 'bg-emerald-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            song.isAvailable ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
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
