const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const euroRound = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** 123456 → « 1 234,56 € » */
export function formatMoney(cents: number): string {
  return euro.format(cents / 100)
}

/** 123456 → « 1 235 € » (pour les petits libellés) */
export function formatMoneyShort(cents: number): string {
  return euroRound.format(Math.round(cents / 100))
}

/** Montant en centimes → texte éditable « 12,50 » (vide si 0). */
export function centsToInput(cents: number): string {
  if (!cents) return ''
  const value = cents / 100
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
}

/**
 * Texte saisi → centimes. Accepte « 12,5 », « 12.50 », « 1 200 », « 12 € ».
 * Renvoie null si le texte n'est pas un montant valide.
 */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s  €]/g, '').replace(',', '.')
  if (cleaned === '') return null
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '.') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(value * 100)
}

/** Taux pour 10 000 → « 25,6 % » */
export function formatRate(rate: number): string {
  return `${(rate / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
}

/** « 22,5 » ou « 22,5 % » → 2250 ; null si ce n'est pas un pourcentage entre 0 et 100. */
export function parseRate(input: string): number | null {
  const cleaned = input.replace(/[\s%  ]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const value = Math.round(Number(cleaned) * 100)
  return value <= 10000 ? value : null
}
