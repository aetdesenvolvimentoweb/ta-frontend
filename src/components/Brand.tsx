interface BrandProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Quando true, oculta o wordmark e mostra apenas o glifo (avatar/favicon). */
  iconOnly?: boolean
  className?: string
}

const SIZES = {
  sm: { glyph: 'h-4 w-4', text: 'text-sm', gap: 'gap-1.5' },
  md: { glyph: 'h-5 w-5', text: 'text-base', gap: 'gap-2' },
  lg: { glyph: 'h-7 w-7', text: 'text-2xl', gap: 'gap-2.5' },
  xl: { glyph: 'h-10 w-10', text: 'text-3xl', gap: 'gap-3' },
} as const

/**
 * Identidade visual do Toque Aquela: glifo de onda sonora (4 barras de
 * equalizador em emerald) + wordmark com tracking apertado.
 *
 * Use `size` para escalar consistentemente em headers/heros. `iconOnly`
 * produz só o glifo — útil pra favicon/avatar do PWA.
 */
export function Brand({ size = 'md', iconOnly = false, className = '' }: BrandProps) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <SoundwaveGlyph className={`${s.glyph} text-emerald-400`} />
      {!iconOnly && (
        <span className={`${s.text} font-bold tracking-tight text-white`}>Toque Aquela</span>
      )}
    </span>
  )
}

function SoundwaveGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Toque Aquela"
    >
      <title>Toque Aquela</title>
      <rect x="3" y="8" width="3" height="8" rx="1.5" />
      <rect x="8" y="4" width="3" height="16" rx="1.5" />
      <rect x="13" y="9" width="3" height="6" rx="1.5" />
      <rect x="18" y="6" width="3" height="12" rx="1.5" />
    </svg>
  )
}
