import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ApiError, api } from '@/api/client'
import type { AppMetrics, MergeStylesRequest, Style } from '@/api/types'
import { useToast } from '@/components/Toast'

type Tab = 'metricas' | 'estilos'

export default function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('metricas')

  function handleLogout() {
    sessionStorage.removeItem('jwt')
    navigate('/artista/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto">
        <Header onLogout={handleLogout} />
        <nav className="flex border-b border-zinc-800 px-4">
          <TabButton active={tab === 'metricas'} onClick={() => setTab('metricas')}>
            Métricas
          </TabButton>
          <TabButton active={tab === 'estilos'} onClick={() => setTab('estilos')}>
            Estilos
          </TabButton>
        </nav>
        <div className="px-4 py-6 pb-20">
          {tab === 'metricas' ? <MetricasSection /> : <EstilosSection />}
        </div>
      </div>
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
      <div>
        <span className="font-semibold text-sm">Toque Aquela</span>
        <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-900/60 border border-amber-800 text-amber-400 font-semibold">
          Admin
        </span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="text-xs text-zinc-500 hover:text-white transition-colors"
      >
        Sair
      </button>
    </header>
  )
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Seção de Métricas ────────────────────────────────────────────────────────

function MetricasSection() {
  const { data, isLoading, error } = useQuery<AppMetrics, ApiError>({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get<AppMetrics>('/v1/admin/metrics', { auth: true }),
    retry: 1,
  })

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-red-400 font-medium">Acesso negado</p>
        <p className="text-sm text-zinc-500">{error.message}</p>
      </div>
    )
  }

  if (!data) return null

  const pct = Math.round(data.appCommissionPercent * 100)

  return (
    <div className="space-y-8">
      {/* Cards de totais */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Financeiro geral
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Volume total"
            value={formatBRL(data.totalVolumeTransacted)}
            highlight={false}
          />
          <MetricCard
            label={`Comissão app (${pct}%)`}
            value={formatBRL(data.totalAppRevenue)}
            highlight={true}
          />
          <MetricCard
            label="Repasse artistas"
            value={formatBRL(data.totalArtistsRevenue)}
            highlight={false}
          />
        </div>
      </section>

      {/* Top músicas */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Músicas mais pedidas
        </h2>
        {data.topSongsByRequestCount.length === 0 ? (
          <p className="text-sm text-zinc-600 py-4 text-center">Nenhum pedido registrado.</p>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            {data.topSongsByRequestCount.map((s, i) => (
              <div
                key={s.title}
                className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-zinc-600 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm truncate">{s.title}</span>
                </div>
                <span className="text-xs text-zinc-400 shrink-0 ml-3">
                  {s.count} pedido{s.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top artistas */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Artistas por receita
        </h2>
        {data.topArtistsByRevenue.length === 0 ? (
          <p className="text-sm text-zinc-600 py-4 text-center">Sem dados de faturamento.</p>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            {data.topArtistsByRevenue.map((a, i) => (
              <div
                key={a.name}
                className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-zinc-600 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm truncate">{a.name}</span>
                </div>
                <span className="text-xs text-emerald-400 shrink-0 ml-3 font-medium">
                  {formatBRL(a.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-1 ${
        highlight ? 'bg-amber-900/20 border-amber-800/60' : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Seção de Estilos ─────────────────────────────────────────────────────────

function EstilosSection() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [mergeSource, setMergeSource] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [showMerge, setShowMerge] = useState(false)

  const { data: styles = [], isLoading } = useQuery<Style[], ApiError>({
    queryKey: ['styles'],
    queryFn: () => api.get<Style[]>('/v1/styles', { auth: true }),
    staleTime: 30_000,
  })

  const createMutation = useMutation<Style, ApiError, { name: string }>({
    mutationFn: (body) => api.post<Style>('/v1/admin/styles', body, { auth: true }),
    onSuccess: (created) => {
      qc.setQueryData<Style[]>(['styles'], (old) => (old ? [...old, created] : [created]))
      setNewName('')
      showToast(`Estilo "${created.name}" criado.`)
    },
    onError: (err) => showToast(err.message, 'error'),
  })

  const mergeMutation = useMutation<unknown, ApiError, MergeStylesRequest>({
    mutationFn: (body) => api.post('/v1/admin/styles/merge', body, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['styles'] })
      setMergeSource('')
      setMergeTarget('')
      setShowMerge(false)
      showToast('Estilos unificados com sucesso.')
    },
    onError: (err) => showToast(err.message, 'error'),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (newName.trim().length < 2) return
    createMutation.mutate({ name: newName.trim() })
  }

  function handleMerge(e: React.FormEvent) {
    e.preventDefault()
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return
    mergeMutation.mutate({ sourceId: mergeSource, targetId: mergeTarget })
  }

  return (
    <div className="space-y-8">
      {/* Novo estilo */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Novo estilo
        </h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: MPB, Rock, Forró…"
            maxLength={50}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || newName.trim().length < 2}
            className="px-4 py-2 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors shrink-0"
          >
            {createMutation.isPending ? 'Salvando…' : 'Criar'}
          </button>
        </form>
      </section>

      {/* Lista de estilos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Estilos cadastrados ({styles.length})
          </h2>
          {styles.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowMerge((v) => !v)}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              {showMerge ? 'Cancelar merge' : 'Unificar estilos'}
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : styles.length === 0 ? (
          <p className="text-sm text-zinc-600 py-4 text-center">Nenhum estilo cadastrado.</p>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            {styles
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-sm">{s.name}</span>
                  <span className="text-xs text-zinc-700 font-mono">{s.id.slice(0, 8)}</span>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Merge de estilos */}
      {showMerge && styles.length >= 2 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Unificar estilos
          </h2>
          <p className="text-xs text-zinc-500">
            O estilo "origem" será deletado e suas músicas migradas para o "destino".
          </p>
          <form onSubmit={handleMerge} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="merge-source" className="text-xs text-zinc-400">
                Origem (será deletado)
              </label>
              <StyleSelect
                id="merge-source"
                value={mergeSource}
                onChange={setMergeSource}
                styles={styles}
                exclude={mergeTarget}
                placeholder="Selecionar estilo de origem"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="merge-target" className="text-xs text-zinc-400">
                Destino (permanece)
              </label>
              <StyleSelect
                id="merge-target"
                value={mergeTarget}
                onChange={setMergeTarget}
                styles={styles}
                exclude={mergeSource}
                placeholder="Selecionar estilo de destino"
              />
            </div>
            <button
              type="submit"
              disabled={
                mergeMutation.isPending ||
                !mergeSource ||
                !mergeTarget ||
                mergeSource === mergeTarget
              }
              className="w-full py-2.5 rounded-lg bg-red-800 hover:bg-red-700 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {mergeMutation.isPending ? 'Unificando…' : 'Confirmar unificação'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

function StyleSelect({
  id,
  value,
  onChange,
  styles,
  exclude,
  placeholder,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  styles: Style[]
  exclude: string
  placeholder: string
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
    >
      <option value="">{placeholder}</option>
      {styles
        .filter((s) => s.id !== exclude)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
    </select>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
    </div>
  )
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
