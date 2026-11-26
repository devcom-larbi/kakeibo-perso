/**
 * Le bilan automatique : rang du mois, constats et conseils, calculés à partir des chiffres.
 * Pour le mois en cours, on projette les dépenses jusqu'à la fin du mois au rythme actuel.
 */
import { expensesOfMonth, getPlan, hasPlan, monthSummary, weeklyBreakdown } from './budget'
import { daysInMonth, monthKeyOf, monthName, ofMonth, shiftMonth, shortDayLabel } from './dates'
import { activeGoals, savedInMonth } from './goals'
import { formatMoney, formatMoneyShort } from './money'
import { subscriptionById } from './subscriptions'
import { CATEGORIES, categoryById, type AppData } from './types'

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'

/** Chaque rang a son titre de shōnen. */
export const RANKS: Record<Rank, { title: string; line: string }> = {
  S: { title: "Super Saiyan de l'épargne", line: 'Ta puissance explose : tu as gardé bien plus que prévu.' },
  A: { title: 'Capitaine du Gotei 13', line: 'Budget tenu, épargne assurée. Solide comme un capitaine.' },
  B: { title: 'Ninja de rang Jōnin', line: "Presque parfait : l'épargne a été un peu entamée." },
  C: { title: 'Genin en entraînement', line: 'Le budget a craqué, mais tu as encore mis de côté.' },
  D: { title: "Direction la Salle de l'Esprit et du Temps", line: 'Tu as dépensé plus que ce qui rentrait. On s’entraîne le mois prochain.' },
}

export type InsightKind = 'save' | 'up' | 'down' | 'top' | 'big' | 'calm' | 'week' | 'pro' | 'goal' | 'subs'

/** Ordre d'importance des constats */
const PRIORITY: InsightKind[] = ['save', 'up', 'down', 'week', 'subs', 'pro', 'goal', 'big', 'calm', 'top']

export interface Insight {
  tone: 'good' | 'warn' | 'info'
  kind: InsightKind
  label: string
  value: string
  detail?: string
}

export interface MonthReview {
  key: string
  /** done : mois terminé ; live : mois en cours (projection) ; empty : rien à analyser */
  status: 'done' | 'live' | 'empty'
  rank: Rank | null
  /** Dépenses retenues pour le rang : réelles, ou projetées pour le mois en cours */
  spentRef: number
  /** Ce qui reste après dépenses (réel ou projeté) : revenus − cotisations − fixes − dépenses */
  savedRef: number
  insights: Insight[]
  tips: string[]
}

export function rankOf(available: number, spent: number, saved: number): Rank {
  if (saved < 0) return 'D'
  if (available <= 0) return 'C'
  const r = (available - spent) / available
  if (r >= 0.15) return 'S'
  if (r >= 0) return 'A'
  if (r >= -0.1) return 'B'
  return 'C'
}

/** today : date locale AAAA-MM-JJ, pour savoir si le mois est terminé. */
export function reviewMonth(data: AppData, key: string, today: string): MonthReview {
  const todayKey = monthKeyOf(today)
  const expenses = expensesOfMonth(data, key)
  const planned = hasPlan(data, key)
  const empty: MonthReview = { key, status: 'empty', rank: null, spentRef: 0, savedRef: 0, insights: [], tips: [] }
  if (key > todayKey || (!planned && expenses.length === 0)) return empty

  const live = key === todayKey
  const s = monthSummary(data, key)
  const totalDays = daysInMonth(key)
  const elapsed = live ? Number(today.slice(8, 10)) : totalDays
  const spentRef = live ? Math.round((s.spent / Math.max(elapsed, 1)) * totalDays) : s.spent
  const savedRef = s.income - s.contributions - s.fixed - spentRef
  const remainingRef = s.available - spentRef
  // Trop tôt dans le mois pour une projection qui veuille dire quelque chose
  const rank = planned && (!live || elapsed >= 3) ? rankOf(s.available, spentRef, savedRef) : null

  const insights: Insight[] = []
  const tips: string[] = []
  const prevKey = shiftMonth(key, -1)
  const prev = monthSummary(data, prevKey)
  const prevName = monthName(prevKey)

  // 1. L'épargne
  if (planned) {
    if (remainingRef >= 0) {
      insights.push({
        tone: 'good',
        kind: 'save',
        label: live ? 'En bonne voie pour ton épargne' : 'Épargne tenue',
        value: formatMoney(savedRef),
        detail: `${live ? 'prévus en fin de mois' : 'mis de côté'} pour ${formatMoney(s.savingsGoal)} visés`,
      })
    } else if (savedRef >= 0) {
      insights.push({
        tone: 'warn',
        kind: 'save',
        label: live ? 'Ton épargne risque d’être entamée' : 'Épargne entamée',
        value: formatMoney(savedRef),
        detail: `au lieu des ${formatMoney(s.savingsGoal)} visés`,
      })
    } else {
      insights.push({
        tone: 'warn',
        kind: 'save',
        label: live ? 'À ce rythme, tu dépasses tes revenus' : 'Dépenses au-dessus des revenus',
        value: formatMoney(-savedRef),
        detail: 'de plus que ce qui rentrait',
      })
    }
  }

  // 2. Ce qui a bougé par rapport au mois précédent (mois terminés seulement)
  let biggestUp: { label: string; diff: number; prevAmount: number } | null = null
  if (!live && prev.spent > 0) {
    let biggestDown: { label: string; diff: number } | null = null
    for (const c of CATEGORIES) {
      const diff = s.byCategory[c.id] - prev.byCategory[c.id]
      const base = Math.max(prev.byCategory[c.id], 1)
      if (diff >= 1000 && diff / base >= 0.15 && (!biggestUp || diff > biggestUp.diff)) {
        biggestUp = { label: c.label, diff, prevAmount: prev.byCategory[c.id] }
      }
      if (diff <= -1000 && (!biggestDown || diff < biggestDown.diff)) biggestDown = { label: c.label, diff }
    }
    if (biggestUp) {
      insights.push({ tone: 'warn', kind: 'up', label: `${biggestUp.label} en hausse`, value: `+ ${formatMoney(biggestUp.diff)}`, detail: `par rapport à ${prevName}` })
    }
    if (biggestDown) {
      insights.push({ tone: 'good', kind: 'down', label: `${biggestDown.label} en baisse`, value: `− ${formatMoney(-biggestDown.diff)}`, detail: `par rapport à ${prevName}` })
    }
  }

  // 3. Le pilier qui pèse le plus
  if (s.spent > 0) {
    const top = CATEGORIES.reduce((a, b) => (s.byCategory[b.id] > s.byCategory[a.id] ? b : a))
    const share = Math.round((s.byCategory[top.id] / s.spent) * 100)
    insights.push({ tone: 'info', kind: 'top', label: `${top.label}, ton premier pilier`, value: `${share} %`, detail: 'de tes dépenses' })
  }

  // 4. La plus grosse dépense
  const biggest = expenses.reduce<(typeof expenses)[number] | null>((a, e) => (!a || e.amount > a.amount ? e : a), null)
  if (biggest) {
    insights.push({
      tone: 'info',
      kind: 'big',
      label: 'Plus grosse dépense',
      value: formatMoney(biggest.amount),
      detail: `${biggest.note || categoryById(biggest.category).label}, ${shortDayLabel(biggest.date)}`,
    })
  }

  // 5. Les jours sans dépense
  const spendDays = new Set(expenses.map((e) => e.date))
  const calmDays = elapsed - [...spendDays].filter((d) => Number(d.slice(8, 10)) <= elapsed).length
  if (calmDays >= 5) {
    insights.push({ tone: 'good', kind: 'calm', label: 'Jours sans dépense', value: String(calmDays), detail: live ? 'depuis le début du mois' : `sur ${totalDays}` })
  }

  // 6. Les semaines
  if (planned && s.available > 0) {
    const ended = weeklyBreakdown(data, key).filter((w) => !live || w.end < today)
    const over = ended.filter((w) => w.spent > w.budget).length
    if (over > 0) {
      insights.push({ tone: 'warn', kind: 'week', label: over > 1 ? 'Semaines au-dessus du budget' : 'Semaine au-dessus du budget', value: String(over), detail: `sur ${ended.length}` })
    } else if (ended.length >= 2) {
      insights.push({ tone: 'good', kind: 'week', label: 'Toutes tes semaines sous le budget', value: String(ended.length), detail: ended.length > 1 ? 'semaines tenues' : 'semaine tenue' })
    }
  }

  // 7. L'activité pro
  if (s.proIncome > 0) {
    insights.push({ tone: 'info', kind: 'pro', label: 'Ton activité a encaissé', value: formatMoney(s.proIncome), detail: `dont ${formatMoney(s.contributions)} pour l'URSSAF` })
  }

  // 8. Les objectifs
  const toGoals = savedInMonth(data.goals, key)
  if (toGoals > 0) {
    insights.push({ tone: 'good', kind: 'goal', label: 'Mis de côté pour tes objectifs', value: formatMoney(toGoals) })
  }

  // 9. Les abonnements
  const subs = getPlan(data, key).fixed.filter((f) => subscriptionById(f.catalogId))
  const subsTotal = subs.reduce((t, f) => t + f.amount, 0)
  if (subsTotal > 0) {
    insights.push({ tone: 'info', kind: 'subs', label: 'Abonnements', value: formatMoney(subsTotal), detail: `${subs.length} ${subs.length > 1 ? 'abonnements' : 'abonnement'} par mois` })
  }

  // Les conseils
  if (biggestUp) {
    tips.push(`Vise ${formatMoneyShort(biggestUp.prevAmount)} en ${biggestUp.label.toLowerCase()} le mois prochain, comme en ${prevName}.`)
  }
  if (live && planned && remainingRef < 0) {
    const left = s.available - s.spent
    const daysLeft = totalDays - elapsed + 1
    tips.push(
      left > 0
        ? `Il te reste ${formatMoney(left)} pour ${daysLeft} jours : garde ${formatMoneyShort(left / daysLeft)} par jour pour tenir.`
        : `Ton budget du mois est déjà dépensé : chaque dépense en plus vient de ton épargne.`,
    )
  }
  if (!live && planned && remainingRef < 0 && s.available > 0) {
    tips.push(`Le mois prochain, garde ${formatMoneyShort(s.available / totalDays)} par jour : c'est ton budget divisé par le nombre de jours.`)
  }
  if (s.income > 0 && subsTotal / s.income > 0.15) {
    tips.push(`Tes abonnements prennent ${Math.round((subsTotal / s.income) * 100)} % de tes revenus : regarde ceux que tu utilises le moins.`)
  }
  const goals = activeGoals(data.goals)
  if (rank === 'S' && goals.length > 0 && remainingRef > 0) {
    tips.push(`Tu as ${formatMoney(remainingRef)} de marge : mets-les sur « ${goals[0].name} » pour y arriver plus vite.`)
  }
  if (!planned) {
    tips.push(`Prépare le budget ${ofMonth(shiftMonth(key, live ? 0 : 1))} pour obtenir ton rang et un bilan complet.`)
  }
  if (tips.length === 0) {
    tips.push('Garde le même budget le mois prochain : il te réussit.')
  }

  // On garde les six constats les plus utiles
  const ordered = [...insights].sort((x, y) => PRIORITY.indexOf(x.kind) - PRIORITY.indexOf(y.kind)).slice(0, 6)
  return { key, status: live ? 'live' : 'done', rank, spentRef, savedRef, insights: ordered, tips: tips.slice(0, 3) }
}
