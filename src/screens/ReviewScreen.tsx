import { useStore } from '../store'
import { getPlan, monthSummary } from '../lib/budget'
import { RANKS, reviewMonth, type InsightKind, type Rank } from '../lib/review'
import { CATEGORIES } from '../lib/types'
import { formatMoney } from '../lib/money'
import { lastDayOfMonth, monthName, shiftMonth, shortDayLabel, todayISO } from '../lib/dates'
import { Rolling } from '../components/Rolling'
import { Aura } from '../components/Aura'
import { Segmented } from '../components/Segmented'
import type { Views } from '../App'

/** Un kanji par type de constat */
const INSIGHT_KANJI: Record<InsightKind, string> = {
  save: '貯',
  up: '上',
  down: '下',
  week: '週',
  subs: '契',
  pro: '仕',
  goal: '夢',
  big: '大',
  calm: '静',
  top: '柱',
}

export function RankBadge({ rank }: { rank: Rank }) {
  return (
    <span className={`rank-badge rank-${rank}`} aria-hidden="true">
      <Aura lightning={rank === 'S'} />
      <span className="rank-letter">{rank}</span>
    </span>
  )
}

interface ReviewScreenProps {
  monthKey: string
  view: Views['bilan']
  viewDir: number
  onView: (v: Views['bilan']) => void
  /** Rejoue l'animation de révélation du bilan pour ce mois */
  onReplay: (key: string) => void
}

export function ReviewScreen({ monthKey, view, viewDir, onView, onReplay }: ReviewScreenProps) {
  const { data, updatePlan } = useStore()
  const review = reviewMonth(data, monthKey, todayISO())
  const s = monthSummary(data, monthKey)
  const prevKey = shiftMonth(monthKey, -1)
  const prev = monthSummary(data, prevKey)
  const hasPrev = prev.spent > 0
  const live = review.status === 'live'
  const maxCat = Math.max(...CATEGORIES.map((c) => s.byCategory[c.id]), 1)
  const plan = getPlan(data, monthKey)

  return (
    <div className="screen">
      <header className="screen-head" data-kanji="反省">
        <h1 className="screen-title">Bilan</h1>
        <Segmented
          label="Parties du bilan"
          value={view}
          onChange={onView}
          options={[
            { id: 'bilan', label: 'Rang et conseils' },
            { id: 'details', label: 'Par pilier' },
          ]}
        />
        <p className="screen-intro">
          {review.status === 'empty'
            ? `Rien à analyser pour ${monthName(monthKey)} : ajoute un budget ou des dépenses.`
            : live
              ? `Calculé tout seul. Le mois n'est pas fini : projection au ${shortDayLabel(lastDayOfMonth(monthKey))} à ton rythme actuel.`
              : 'Calculé tout seul à partir de ton budget et de tes dépenses.'}
        </p>
      </header>

      {review.status !== 'empty' && view === 'bilan' && (
        <div key="bilan" className="substage" style={{ ['--dir' as string]: viewDir }}>
          {review.rank ? (
            <section className={`rank-card rank-${review.rank}`} aria-label={`Rang ${review.rank} : ${RANKS[review.rank].title}`}>
              <RankBadge rank={review.rank} />
              <div className="rank-text">
                <span className="rank-kicker">{live ? 'Rang provisoire' : 'Rang du mois'}</span>
                <strong>{RANKS[review.rank].title}</strong>
                <p>{RANKS[review.rank].line}</p>
                {!live && (
                  <button type="button" className="text-button" onClick={() => onReplay(monthKey)}>
                    Revoir la révélation
                  </button>
                )}
              </div>
            </section>
          ) : (
            <p className="callout">
              {plan.incomes.length || plan.fixed.length
                ? 'Encore trop tôt pour un rang : reviens dans quelques jours.'
                : 'Prépare le budget de ce mois pour obtenir ton rang.'}
            </p>
          )}

          <dl className="stats">
            <div>
              <dt>Ce que tu avais</dt>
              <dd>
                <Rolling value={s.income - s.contributions - s.fixed} />
              </dd>
            </div>
            <div>
              <dt>Épargne visée</dt>
              <dd>
                <Rolling value={s.savingsGoal} />
              </dd>
            </div>
            <div>
              <dt>{live ? 'Dépensé à ce jour' : 'Dépensé'}</dt>
              <dd>
                <Rolling value={s.spent} />
              </dd>
            </div>
            <div className={review.savedRef < 0 ? 'is-over' : 'is-good'}>
              <dt>{live ? 'Épargne prévue' : 'Épargne réelle'}</dt>
              <dd>
                <Rolling value={review.savedRef} />
              </dd>
            </div>
          </dl>

          {review.insights.length > 0 && (
            <section className="block" aria-labelledby="insights-title">
              <h2 id="insights-title" className="block-title">
                Ce que l'app a remarqué
              </h2>
              <ul className="insights">
                {review.insights.map((i, n) => (
                  <li key={i.kind + n} className={`insight is-${i.tone}`} style={{ ['--i' as string]: n }}>
                    <span className="insight-icon" aria-hidden="true">
                      {INSIGHT_KANJI[i.kind]}
                    </span>
                    <span className="insight-text">
                      <span className="insight-label">{i.label}</span>
                      {i.detail && <span className="insight-detail">{i.detail}</span>}
                    </span>
                    <span className="insight-value">{i.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="block" aria-labelledby="tips-title">
            <h2 id="tips-title" className="block-title">
              Pour le mois prochain
            </h2>
            <ul className="tips">
              {review.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {review.status !== 'empty' && view === 'details' && (
        <div key="details" className="substage" style={{ ['--dir' as string]: viewDir }}>
          {s.spent > 0 ? (
            <section className="block" aria-labelledby="cats-title">
              <h2 id="cats-title" className="block-title">
                Par pilier
              </h2>
              <ul className="cat-bars">
                {CATEGORIES.map((c, i) => {
                  const amount = s.byCategory[c.id]
                  const diff = amount - prev.byCategory[c.id]
                  return (
                    <li key={c.id} style={{ ['--c' as string]: `var(--cat-${c.id})`, ['--i' as string]: i }}>
                      <span className="cat-bars-name">{c.label}</span>
                      <span className="cat-bars-amount">{formatMoney(amount)}</span>
                      <span className="cat-bars-track" aria-hidden="true">
                        <span style={{ width: `${(amount / maxCat) * 100}%` }} />
                      </span>
                      {hasPrev && (
                        <span className={`cat-bars-diff ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}`}>
                          {diff === 0
                            ? 'comme le mois dernier'
                            : `${diff > 0 ? '+' : '−'} ${formatMoney(Math.abs(diff))} par rapport à ${monthName(prevKey)}`}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : (
            <p className="empty">Aucune dépense ce mois-ci : rien à répartir.</p>
          )}

          <details className="note" open={plan.improve.length > 0}>
            <summary>{plan.improve ? 'Ta note du mois' : 'Ajouter une note pour toi'}</summary>
            <textarea
              aria-label="Ta note du mois"
              rows={4}
              value={plan.improve}
              placeholder="Ce que tu retiens de ce mois, ce que tu changes le mois prochain…"
              onChange={(e) => updatePlan(monthKey, { improve: e.target.value })}
            />
          </details>
        </div>
      )}
    </div>
  )
}
