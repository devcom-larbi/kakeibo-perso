import { LOGOS } from '../lib/logos.generated'
import { monogram, type Subscription } from '../lib/subscriptions'

/** Luminance relative d'une couleur #RRGGBB (0 = noir, 1 = blanc). */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Pastille d'un abonnement avec le logo de la marque.
 * Fond à la couleur de la marque ; les marques noires ou blanches passent sur fond blanc
 * pour rester visibles sur l'app en noir.
 */
export function BrandLogo({ sub, size = 40 }: { sub: Subscription; size?: number }) {
  const logo = LOGOS[sub.id]
  const lum = luminance(sub.color)
  const onWhite = lum < 0.03 || lum > 0.9 || logo?.kind === 'color'
  const background = onWhite ? '#ffffff' : sub.color
  const color = onWhite || lum > 0.42 ? '#0b0b10' : '#ffffff'

  return (
    <span
      className={`brand-logo ${logo?.line ? 'is-line' : ''} ${logo?.kind === 'generic' ? 'is-generic' : ''}`}
      style={{ width: size, height: size, background, color }}
      aria-hidden="true"
    >
      {logo ? (
        <svg viewBox={logo.viewBox} width={Math.round(size * 0.56)} height={Math.round(size * 0.56)} dangerouslySetInnerHTML={{ __html: logo.body }} />
      ) : (
        <span className="brand-monogram">{monogram(sub.name)}</span>
      )}
    </span>
  )
}
