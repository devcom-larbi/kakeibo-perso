import { useState } from 'react'
import { useStore } from '../store'
import { contributionsOn, getPlan, hasPlan, monthSummary, proRate, sumItems } from '../lib/budget'
import { ACTIVITIES, newId, type LineItem } from '../lib/types'
import { formatMoney, formatRate } from '../lib/money'
import { activeGoals, totalMonthlyNeeded } from '../lib/goals'
import { monthName, ofMonth, shiftMonth } from '../lib/dates'
import { subscriptionById } from '../lib/subscriptions'
import { BrandLogo } from '../components/BrandLogo'
import { MoneyInput } from '../components/MoneyInput'
import { Segmented } from '../components/Segmented'
import { IconClose, IconPlus } from '../components/icons'
import { Rolling } from '../components/Rolling'
import type { Views } from '../App'

const isSubscription = (item: LineItem) => !!subscriptionById(item.catalogId)

interface LineListProps {
  title: string
  hint?: string
  items: LineItem[]
  addLabel?: string
  placeholder: string
  /** Revenus : on affiche ce que l'URSSAF prendra sur chaque ligne pro */
  showContributions?: boolean
  onChange: (items: LineItem[]) => void
  /** Première ligne passée en « Pro » alors que l'activité n'est pas encore choisie */
  onFirstPro: () => void
}

function LineList({ title, hint, items, addLabel, placeholder, showContributions, onChange, onFirstPro }: LineListProps) {
  const { data } = useStore()
  const [addedId, setAddedId] = useState<string | null>(null)
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  const pro = data.settings.pro

  return (
    <>
      {items.length > 0 && (
        <ul className="lines">
          {items.map((item) => {
            const sub = subscriptionById(item.catalogId)
            const owed = showContributions && item.pro && item.amount > 0 ? contributionsOn(item.amount, pro) : 0
            return (
              <li key={item.id} className={`line ${sub ? 'has-tile' : ''}`}>
                {sub && <BrandLogo sub={sub} size={32} />}
                <input
                  className="line-label"
                  type="text"
                  value={item.label}
                  placeholder={placeholder}
                  autoFocus={item.id === addedId}
                  aria-label={`Nom (${title})`}
                  onChange={(e) => update(item.id, { label: e.target.value })}
                />
                <button
                  type="button"
                  className="pro-toggle"
                  aria-pressed={!!item.pro}
                  aria-label={`${item.label || 'Cette ligne'} : pour mon activité`}
                  onClick={() => {
                    const next = !item.pro
                    update(item.id, { pro: next || undefined })
                    if (next && !data.settings.pro) onFirstPro()
                  }}
                >
                  Pro
                </button>
                <MoneyInput
                  className="line-amount"
                  value={item.amount}
                  aria-label={`Montant ${item.label || placeholder}`}
                  onCommit={(amount) => update(item.id, { amount })}
                />
                <button
                  type="button"
                  className="icon-button small"
                  aria-label={`Retirer ${item.label || 'cette ligne'}`}
                  onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                >
                  <IconClose />
                </button>
                {owed > 0 && (
                  <p className="line-note">
                    URSSAF <strong>− {formatMoney(owed)}</strong> ({formatRate(proRate(pro))}), il te reste{' '}
                    <strong>{formatMoney(item.amount - owed)}</strong>
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {hint && items.length === 0 && <p className="block-hint">{hint}</p>}
      {addLabel && (
        <button
          type="button"
          className="add-line"
          onClick={() => {
            const id = newId()
            setAddedId(id)
            onChange([...items, { id, label: '', amount: 0 }])
          }}
        >
          <IconPlus width={18} height={18} />
          {addLabel}
        </button>
      )}
    </>
  )
}

interface BudgetScreenProps {
  monthKey: string
  view: Views['budget']
  viewDir: number
  onView: (v: Views['budget']) => void
  onGoToGoals: () => void
  onOpenSubscriptions: () => void
  onOpenActivity: () => void
}

export function BudgetScreen({ monthKey, view, viewDir, onView, onGoToGoals, onOpenSubscriptions, onOpenActivity }: BudgetScreenProps) {
  const { data, updatePlan, copyPreviousPlan } = useStore()
  const plan = getPlan(data, monthKey)
  const s = monthSummary(data, monthKey)
  const prevKey = shiftMonth(monthKey, -1)
  const canCopy = !hasPlan(data, monthKey) && hasPlan(data, prevKey)
  const hasGoals = activeGoals(data.goals).length > 0
  const goalsPerMonth = totalMonthlyNeeded(data.goals, monthKey)
  const subs = plan.fixed.filter(isSubscription)
  const others = plan.fixed.filter((f) => !isSubscription(f))
  const subsTotal = sumItems(subs)
  const proSubs = sumItems(subs.filter((f) => f.pro))
  const activity = ACTIVITIES.find((a) => a.id === data.settings.pro?.activity)
  const proLeft = s.proIncome - s.contributions - s.proFixed
  const proLines = [...plan.incomes.filter((i) => i.pro).map((i) => ({ ...i, kind: 'in' as const })), ...plan.fixed.filter((f) => f.pro).map((f) => ({ ...f, kind: 'out' as const }))]

  return (
    <div className="screen">
      <header className="screen-head" data-kanji="予算">
        <h1 className="screen-title">Budget</h1>
        <Segmented
          label="Parties du budget"
          value={view}
          onChange={onView}
          options={[
            { id: 'prevu', label: 'Prévu' },
            { id: 'abonnements', label: 'Abonnements' },
            { id: 'pro', label: 'Pro' },
          ]}
        />
      </header>

      <div key={view} className="substage" style={{ ['--dir' as string]: viewDir }}>
        {view === 'prevu' && (
          <>
            {canCopy && (
              <div className="callout">
                <p>Ton budget {ofMonth(prevKey)} est prêt à être repris.</p>
                <button type="button" className="secondary-button" onClick={() => copyPreviousPlan(monthKey)}>
                  Reprendre le budget {ofMonth(prevKey)}
                </button>
              </div>
            )}

            <section className="block" aria-label="Revenus">
              <div className="section-head">
                <h2>Revenus</h2>
                <span className="section-sum">{formatMoney(s.income)}</span>
              </div>
              <p className="block-hint">Coche « Pro » sur ce que ton activité encaisse : l'app calcule ce que tu devras à l'URSSAF.</p>
              <div className="panel">
                <LineList
                  title="Revenus"
                  items={plan.incomes}
                  addLabel="Ajouter un revenu"
                  placeholder="Salaire"
                  showContributions
                  onChange={(incomes) => updatePlan(monthKey, { incomes })}
                  onFirstPro={onOpenActivity}
                />
              </div>
            </section>

            <section className="block" aria-label="Charges fixes">
              <div className="section-head">
                <h2>Charges fixes</h2>
                <span className="section-sum">{formatMoney(s.fixed)}</span>
              </div>
              <div className="panel">
                <button type="button" className="subs-row" onClick={() => onView('abonnements')}>
                  <span className="subs-row-logos" aria-hidden="true">
                    {subs.slice(0, 4).map((f) => {
                      const sub = subscriptionById(f.catalogId)
                      return sub ? <BrandLogo key={f.id} sub={sub} size={26} /> : null
                    })}
                  </span>
                  <span className="subs-row-text">
                    <strong>Abonnements</strong>
                    <span>{subs.length ? `${subs.length} ${subs.length > 1 ? 'abonnements' : 'abonnement'}` : 'Netflix, salle, IA…'}</span>
                  </span>
                  <span className="subs-row-amount">{formatMoney(subsTotal)}</span>
                </button>
                <LineList
                  title="Charges fixes"
                  items={others}
                  addLabel="Ajouter une charge (loyer, assurance…)"
                  placeholder="Loyer"
                  onChange={(next) => updatePlan(monthKey, { fixed: [...next, ...subs] })}
                  onFirstPro={onOpenActivity}
                />
              </div>
            </section>

            <section className="block" aria-labelledby="savings-title">
              <div className="section-head">
                <h2 id="savings-title">Épargne visée</h2>
                <MoneyInput
                  className="savings-input"
                  value={plan.savingsGoal}
                  aria-labelledby="savings-title"
                  onCommit={(savingsGoal) => updatePlan(monthKey, { savingsGoal })}
                />
              </div>
              <p className="block-hint">Mets-la de côté dès le début du mois, comme une charge.</p>
              {hasGoals && (
                <div className="goals-hint">
                  <p>
                    {goalsPerMonth > 0 ? (
                      <>
                        Tes objectifs demandent <strong>{formatMoney(goalsPerMonth)}</strong> par mois pour tenir leurs dates.
                      </>
                    ) : (
                      <>Tes objectifs n'ont pas de date : choisis librement ce que tu mets de côté.</>
                    )}
                  </p>
                  <div className="goals-hint-actions">
                    {goalsPerMonth > 0 && plan.savingsGoal !== goalsPerMonth && (
                      <button type="button" className="secondary-button small" onClick={() => updatePlan(monthKey, { savingsGoal: goalsPerMonth })}>
                        Viser {formatMoney(goalsPerMonth)}
                      </button>
                    )}
                    <button type="button" className="text-button" onClick={onGoToGoals}>
                      Voir mes objectifs
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="block" aria-labelledby="calc-title">
              <h2 id="calc-title" className="visually-hidden">
                Calcul du budget disponible
              </h2>
              <dl className="calc">
                <div>
                  <dt>Revenus</dt>
                  <dd>{formatMoney(s.income)}</dd>
                </div>
                {s.contributions > 0 && (
                  <div>
                    <dt>Cotisations URSSAF</dt>
                    <dd>− {formatMoney(s.contributions)}</dd>
                  </div>
                )}
                <div>
                  <dt>Charges fixes</dt>
                  <dd>− {formatMoney(s.fixed)}</dd>
                </div>
                <div>
                  <dt>Épargne visée</dt>
                  <dd>− {formatMoney(s.savingsGoal)}</dd>
                </div>
                <div className={`calc-total ${s.available < 0 ? 'is-over' : ''}`}>
                  <dt>Disponible pour le mois</dt>
                  <dd>
                    <Rolling value={s.available} id={`available-${monthKey}`} />
                  </dd>
                </div>
              </dl>
              {s.available < 0 && (
                <p className="form-error">Tes charges et ton épargne dépassent tes revenus. Baisse l'épargne visée ou une charge.</p>
              )}
            </section>
          </>
        )}

        {view === 'abonnements' && (
          <>
            <div className="summary-card">
              <div>
                <small>Par mois</small>
                <strong>
                  <Rolling value={subsTotal} id={`subs-${monthKey}`} />
                </strong>
              </div>
              <div>
                <small>Par an</small>
                <strong>{formatMoney(subsTotal * 12)}</strong>
              </div>
              <div>
                <small>Dont pro</small>
                <strong>{formatMoney(proSubs)}</strong>
              </div>
            </div>

            <section className="block" aria-label="Mes abonnements">
              {subs.length > 0 ? (
                <div className="panel">
                  <LineList
                    title="Abonnements"
                    items={subs}
                    placeholder="Abonnement"
                    onChange={(next) => updatePlan(monthKey, { fixed: [...others, ...next] })}
                    onFirstPro={onOpenActivity}
                  />
                </div>
              ) : (
                <p className="empty">Aucun abonnement ce mois-ci. Ajoute ceux que tu paies déjà : Netflix, Basic-Fit, Claude, Canva…</p>
              )}
              <button type="button" className="primary-button block-action" onClick={onOpenSubscriptions}>
                Ajouter un abonnement
              </button>
            </section>
          </>
        )}

        {view === 'pro' && (
          <>
            <button type="button" className="activity-card" onClick={onOpenActivity}>
              <span className="stamp" aria-hidden="true">
                仕
              </span>
              <span className="activity-card-text">
                <strong>{activity ? activity.label : 'Choisis ton activité'}</strong>
                <span>
                  {activity
                    ? `${formatRate(proRate(data.settings.pro))} retenus sur ce que tu encaisses${data.settings.pro?.liberatoire ? ', impôt libératoire compris' : ''}`
                    : 'Pour calculer tes cotisations URSSAF au bon taux'}
                </span>
              </span>
              <span className="text-button">{activity ? 'Changer' : 'Choisir'}</span>
            </button>

            {proLines.length > 0 ? (
              <>
                <section className="block" aria-labelledby="pro-title">
                  <div className="section-head">
                    <h2 id="pro-title">Ton activité en {monthName(monthKey)}</h2>
                  </div>
                  <dl className="calc pro-calc">
                    <div>
                      <dt>Encaissé</dt>
                      <dd>{formatMoney(s.proIncome)}</dd>
                    </div>
                    <div>
                      <dt>URSSAF</dt>
                      <dd>− {formatMoney(s.contributions)}</dd>
                    </div>
                    <div>
                      <dt>Abonnements et charges pro</dt>
                      <dd>− {formatMoney(s.proFixed)}</dd>
                    </div>
                    <div className={`calc-total ${proLeft < 0 ? 'is-over' : ''}`}>
                      <dt>Ce que ton activité te laisse</dt>
                      <dd>
                        <Rolling value={proLeft} id={`pro-left-${monthKey}`} />
                      </dd>
                    </div>
                  </dl>
                </section>
                <section className="block" aria-labelledby="pro-lines-title">
                  <div className="section-head">
                    <h2 id="pro-lines-title">Lignes pro</h2>
                  </div>
                  <ul className="ledger">
                    {proLines.map((l) => {
                      const sub = subscriptionById(l.catalogId)
                      return (
                        <li key={l.id} className="ledger-row is-static">
                          {sub ? <BrandLogo sub={sub} size={30} /> : <span className={`flow-dot ${l.kind === 'in' ? 'is-in' : 'is-out'}`} aria-hidden="true" />}
                          <span className="ledger-text">
                            <span className="ledger-title">{l.label || 'Sans nom'}</span>
                            <span className="ledger-sub">{l.kind === 'in' ? 'Encaissé' : 'Charge pro'}</span>
                          </span>
                          <span className={`ledger-amount ${l.kind === 'in' ? 'is-in' : ''}`}>
                            {l.kind === 'in' ? '+' : '−'} {formatMoney(l.amount)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="block-hint">Pour en ajouter, coche « Pro » sur une ligne dans Prévu ou Abonnements.</p>
                </section>
              </>
            ) : (
              <p className="empty">
                Rien de pro ce mois-ci. Dans Prévu, coche « Pro » sur un revenu de ton activité : l'app met de côté ce que tu
                devras à l'URSSAF.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
