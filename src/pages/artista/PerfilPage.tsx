import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type {
  ArtistProfile,
  StartPaymentConnectionResponse,
  UpdateProfileRequest,
} from '@/api/types'
import { useToast } from '@/components/Toast'

const SOCIAL_PLATFORMS: { key: string; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'website', label: 'Site pessoal', placeholder: 'https://...' },
]

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto">
        <Header />
        <div className="px-4 pb-20 space-y-6 pt-4">
          <ProfileContent />
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
      <span className="font-semibold text-sm">Perfil</span>
    </header>
  )
}

// ─── Conteúdo principal ───────────────────────────────────────────────────────

function ProfileContent() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  useEffect(() => {
    const status = searchParams.get('status')
    if (!status) return
    if (status === 'connected') {
      showToast('Conta do Mercado Pago conectada!', 'success')
      qc.invalidateQueries({ queryKey: ['artist-profile'] })
    } else if (status === 'error') {
      const reason = searchParams.get('reason') ?? 'Erro desconhecido'
      showToast(`Falha ao conectar: ${reason}`, 'error')
    }
    navigate('/artista/perfil', { replace: true })
  }, [searchParams, navigate, showToast, qc])

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<ArtistProfile>({
    queryKey: ['artist-profile'],
    queryFn: () => api.get<ArtistProfile>('/v1/artists/me', { auth: true }),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !profile) {
    return (
      <p className="text-center text-red-400 text-sm pt-8">
        Erro ao carregar o perfil. Tente novamente.
      </p>
    )
  }

  return (
    <>
      <InfoSection profile={profile} />
      <SocialsSection profile={profile} />
      <PaymentSection profile={profile} />
    </>
  )
}

// ─── Seção de informações básicas ─────────────────────────────────────────────

function InfoSection({ profile }: { profile: ArtistProfile }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) nameInputRef.current?.focus()
  }, [editing])

  const mutation = useMutation<ArtistProfile, ApiError, UpdateProfileRequest>({
    mutationFn: (body) => api.patch<ArtistProfile>('/v1/artists/me', body, { auth: true }),
    onSuccess: (updated) => {
      qc.setQueryData(['artist-profile'], updated)
      setEditing(false)
    },
  })

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === profile.name) {
      setEditing(false)
      return
    }
    mutation.mutate({ name: trimmed })
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Informações</p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          {editing ? (
            <>
              <label htmlFor="profile-nome" className="text-xs text-zinc-500">
                Nome artístico
              </label>
              <input
                id="profile-nome"
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') setEditing(false)
                }}
              />
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-500">Nome artístico</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{profile.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setName(profile.name)
                    setEditing(true)
                  }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Editar
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">E-mail</p>
          <p className="text-sm text-zinc-400">{profile.email}</p>
        </div>
      </div>

      {editing && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-white hover:border-zinc-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mutation.isPending || !name.trim()}
            className="flex-1 py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      )}

      {mutation.isError && <p className="text-red-400 text-xs">{mutation.error?.message}</p>}
    </section>
  )
}

// ─── Seção de redes sociais ───────────────────────────────────────────────────

function SocialsSection({ profile }: { profile: ArtistProfile }) {
  const qc = useQueryClient()
  const [socials, setSocials] = useState<Record<string, string>>(profile.socials ?? {})
  const [dirty, setDirty] = useState(false)

  const mutation = useMutation<ArtistProfile, ApiError, UpdateProfileRequest>({
    mutationFn: (body) => api.patch<ArtistProfile>('/v1/artists/me', body, { auth: true }),
    onSuccess: (updated) => {
      qc.setQueryData(['artist-profile'], updated)
      setDirty(false)
    },
  })

  const handleChange = (key: string, value: string) => {
    setSocials((prev) => {
      const next = { ...prev }
      if (value.trim()) next[key] = value.trim()
      else delete next[key]
      return next
    })
    setDirty(true)
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Redes sociais</p>

      <div className="space-y-3">
        {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label htmlFor={`social-${key}`} className="text-xs text-zinc-500">
              {label}
            </label>
            <input
              id={`social-${key}`}
              type="url"
              value={socials[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="input"
            />
          </div>
        ))}
      </div>

      {mutation.isError && <p className="text-red-400 text-xs">{mutation.error?.message}</p>}

      <button
        type="button"
        onClick={() => mutation.mutate({ socials })}
        disabled={mutation.isPending || !dirty}
        className="w-full py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? 'Salvando…' : 'Salvar redes sociais'}
      </button>
    </section>
  )
}

// ─── Seção de conta de pagamento ──────────────────────────────────────────────

function PaymentSection({ profile }: { profile: ArtistProfile }) {
  const qc = useQueryClient()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const connectMutation = useMutation<StartPaymentConnectionResponse, ApiError, void>({
    mutationFn: () =>
      api.post<StartPaymentConnectionResponse>(
        '/v1/payment-accounts/mercado_pago/connect',
        {},
        { auth: true }
      ),
    onSuccess: ({ authorizeUrl }) => {
      window.location.href = authorizeUrl
    },
  })

  const disconnectMutation = useMutation<unknown, ApiError, void>({
    mutationFn: () => api.delete('/v1/payment-accounts/mercado_pago', { auth: true }),
    onSuccess: () => {
      qc.setQueryData<ArtistProfile>(['artist-profile'], (old) =>
        old ? { ...old, canReceiveTips: false, paymentGateway: undefined } : old
      )
      setConfirmDisconnect(false)
    },
  })

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        Conta de pagamento
      </p>

      {profile.canReceiveTips ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-sm font-medium">Mercado Pago conectado</p>
          </div>
          <p className="text-xs text-zinc-500">
            Você está habilitado para receber gorjetas via PIX.
          </p>

          {!confirmDisconnect ? (
            <button
              type="button"
              onClick={() => setConfirmDisconnect(true)}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Desconectar conta
            </button>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDisconnect(false)}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {disconnectMutation.isPending ? 'Desconectando…' : 'Confirmar desconexão'}
              </button>
            </div>
          )}

          {disconnectMutation.isError && (
            <p className="text-red-400 text-xs">{disconnectMutation.error?.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
            <p className="text-sm text-zinc-400">Nenhuma conta conectada</p>
          </div>
          <p className="text-xs text-zinc-500">
            Conecte sua conta do Mercado Pago para habilitar gorjetas via PIX. Você recebe 85% de
            cada gorjeta diretamente.
          </p>

          {connectMutation.isError && (
            <p className="text-red-400 text-xs">{connectMutation.error?.message}</p>
          )}

          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {connectMutation.isPending ? 'Redirecionando…' : 'Conectar Mercado Pago'}
          </button>
        </div>
      )}
    </section>
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
