import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'
import { IconPlus } from './icons'
import { BrandLogo } from './BrandLogo'
import { useShake } from './useShake'
import { useStore } from '../store'
import { getPlan } from '../lib/budget'
import { newId, type LineItem } from '../lib/types'
import { centsToInput, formatMoney, parseMoney } from '../lib/money'
import { feedback } from '../lib/feedback'
import {
  BILLING_LABEL,
  SUBSCRIPTION_GROUPS,
  monthlyPrice,
  searchSubscriptions,
  type Subscription,
} from '../lib/subscriptions'

/** Noms de formule qu'on n'ajoute pas au nom de la ligne (« Canva Pro », pas « Canva Pro Mensuel ») */
const PLAIN_PLANS = ['Mensuel', 'Annuel', 'Mois']

function lineLabel(sub: Subscription, planLabel: string) {
  return sub.plans.length > 1 && !PLAIN_PLANS.includes(planLabel) ? `${sub.name} ${planLabel}` : sub.name
}

interface RowProps {
  sub: Subscription
  open: boolean
  added: boolean
  onToggle: () => void
  onAdd: (line: Omit<LineItem, 'id'>) => void
}

function SubscriptionRow({ sub, open, added, onToggle, onAdd }: RowProps) {
  const [planIndex, setPlanIndex] = useState(0)
  const plan = sub.plans[planIndex]
  const [price, setPrice] = useState(centsToInput(monthlyPrice(sub.plans[0])))
  const [pro, setPro] = useState(!!sub.pro)
  const [priceRef, shakePrice] = useShake<HTMLSpanElement>()
  const cents = parseMoney(price)
  const from = Math.min(...sub.plans.map(monthlyPrice))

  const choose = (i: number) => {
    setPlanIndex(i)
    setPrice(centsToInput(monthlyPrice(sub.plans[i])))
  }

  const add = () => {
    if (cents === null || cents <= 0) return shakePrice()
    onAdd({ label: lineLabel(sub, plan.label), amount: cents, catalogId: sub.id, ...(pro ? { pro: true } : {}) })
  }

  return (
    <li className={`sub-row ${open ? 'is-open' : ''}`} style={{ ['--g' as string]: sub.color }}>
      <button type="button" className="sub-head" aria-expanded={open} onClick={onToggle}>
        <BrandLogo sub={sub} />
        <span className="sub-name">{sub.name}</span>
        <span className={`sub-price ${added ? 'is-added' : ''}`}>
          {added ? 'Déjà ajouté' : `${sub.plans.length > 1 ? 'dès ' : ''}${formatMoney(from)}`}
        </span>
      </button>
      {open && (
        <div className="sub-panel">
          {sub.plans.length > 1 && (
            <div className="sub-plans" role="radiogroup" aria-label={`Formule ${sub.name}`}>
              {sub.plans.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  role="radio"
                  aria-checked={i === planIndex}
                  className="chip"
                  onClick={() => choose(i)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <label className="sub-amount">
            <span>Montant par mois</span>
            <span className="field-money" ref={priceRef}>
              <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              <span aria-hidden="true">€</span>
            </span>
          </label>
          {plan.billing !== 'mois' && (
            <p className="sub-billing">
              {formatMoney(plan.price)} {BILLING_LABEL[plan.billing]}, soit {formatMoney(monthlyPrice(plan))} par mois.
            </p>
          )}
          <label className="switch-row">
            <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
            <span className="switch" aria-hidden="true" />
            <span>Pour mon activité (charge pro)</span>
          </label>
          <button type="button" className="primary-button" onClick={add}>
            Ajouter {cents ? `${formatMoney(cents)} par mois` : ''}
          </button>
        </div>
      )}
    </li>
  )
}

function CustomRow({ onAdd }: { onAdd: (line: Omit<LineItem, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [pro, setPro] = useState(false)
  const [error, setError] = useState('')
  const [errorRef, shakeError] = useShake<HTMLParagraphElement>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const cents = parseMoney(price)
    const fail = (message: string) => {
      setError(message)
      shakeError()
    }
    if (!name.trim()) return fail('Donne un nom, par exemple « Salle de boxe ».')
    if (cents === null || cents <= 0) return fail('Indique le montant par mois, par exemple 9,99.')
    onAdd({ label: name.trim(), amount: cents, ...(pro ? { pro: true } : {}) })
    setName('')
    setPrice('')
    setPro(false)
  }

  return (
    <form className="sub-custom" onSubmit={submit} noValidate>
      <div className="field-row">
        <label className="field">
          <span>Autre abonnement</span>
          <input type="text" value={name} maxLength={60} placeholder="Ex. salle de boxe" onChange={(e) => { setName(e.target.value); setError('') }} />
        </label>
        <label className="field field-date">
          <span>Par mois</span>
          <span className="field-money">
            <input type="text" inputMode="decimal" value={price} placeholder="9,99" onChange={(e) => { setPrice(e.target.value); setError('') }} />
            <span aria-hidden="true">€</span>
          </span>
        </label>
      </div>
      <label className="switch-row">
        <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
        <span className="switch" aria-hidden="true" />
        <span>Pour mon activité (charge pro)</span>
      </label>
      {error && (
        <p className="form-error" role="alert" ref={errorRef}>
          {error}
        </p>
      )}
      <button type="submit" className="secondary-button">
        <IconPlus width={18} height={18} /> Ajouter cet abonnement
      </button>
    </form>
  )
}

/** La fenêtre « Mes abonnements » : on coche ce qu'on paie déjà, ça part dans les charges fixes. */
export function SubscriptionSheet({ monthKey, onClose }: { monthKey: string; onClose: () => void }) {
  const { data, updatePlan } = useStore()
  const fixed = getPlan(data, monthKey).fixed
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const results = searchSubscriptions(query)
  const added = new Set(fixed.map((f) => f.catalogId).filter(Boolean))
  const groups = SUBSCRIPTION_GROUPS.map((g) => ({ group: g, items: results.filter((s) => s.group === g.id) })).filter(
    (g) => g.items.length > 0,
  )

  const add = (line: Omit<LineItem, 'id'>) => {
    updatePlan(monthKey, { fixed: [...fixed, { ...line, id: newId() }] })
    setOpenId(null)
    feedback.emit({
      kind: 'toast',
      title: `${line.label} ajouté`,
      detail: `${formatMoney(line.amount)} par mois${line.pro ? ', charge pro' : ''}`,
    })
  }

  return (
    <Sheet title="Mes abonnements" onClose={onClose}>
      <div className="subs">
        <p className="sheet-intro">
          Touche ce que tu paies déjà : la formule et le prix se règlent avant d'ajouter. Tout part dans tes charges fixes.
        </p>
        <label className="sub-search">
          <span className="visually-hidden">Chercher un abonnement</span>
          <input type="search" value={query} placeholder="Chercher : Netflix, Basic-Fit, Claude…" onChange={(e) => setQuery(e.target.value)} />
        </label>

        {groups.length === 0 && <p className="empty">Rien trouvé pour « {query} ». Ajoute-le toi-même juste en dessous.</p>}

        {groups.map(({ group, items }) => (
          <section key={group.id} className="sub-group" aria-label={group.label}>
            <h3 className="sub-group-title">
              <span className="kanji-tag" aria-hidden="true">
                {group.kanji}
              </span>
              {group.label}
            </h3>
            <ul className="sub-list">
              {items.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  sub={sub}
                  open={openId === sub.id}
                  added={added.has(sub.id)}
                  onToggle={() => setOpenId(openId === sub.id ? null : sub.id)}
                  onAdd={add}
                />
              ))}
            </ul>
          </section>
        ))}

        <CustomRow onAdd={add} />
        <p className="sheet-note">Prix indicatifs 2026 : le bon montant est celui de ta facture, tu peux le changer à tout moment.</p>
        <button type="button" className="primary-button" onClick={onClose}>
          Terminé
        </button>
      </div>
    </Sheet>
  )
}
