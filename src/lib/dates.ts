/** Toutes les dates sont manipulées en heure locale, au format AAAA-MM-JJ. */

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7)
}

export function currentMonthKey(): string {
  return monthKeyOf(todayISO())
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function firstDayOfMonth(key: string): string {
  return `${key}-01`
}

export function lastDayOfMonth(key: string): string {
  return `${key}-${pad(daysInMonth(key))}`
}

const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const monthOnlyFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long' })
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

/** « novembre 2026 » */
export function monthLabel(key: string): string {
  return monthFmt.format(parseISODate(firstDayOfMonth(key)))
}

/** « novembre » */
export function monthName(key: string): string {
  return monthOnlyFmt.format(parseISODate(firstDayOfMonth(key)))
}

/** « de novembre » / « d'octobre » */
export function ofMonth(key: string): string {
  const name = monthName(key)
  return /^[aeiouyéèh]/i.test(name) ? `d'${name}` : `de ${name}`
}

/** « mercredi 26 novembre » */
export function dayLabel(iso: string): string {
  return dayFmt.format(parseISODate(iso))
}

/** « 26 nov. » */
export function shortDayLabel(iso: string): string {
  return shortDayFmt.format(parseISODate(iso))
}
