import { useState } from 'react'
import { useStore } from '../store'
import { getPlan, hasPlan, monthSummary, sumItems } from '../lib/budget'
import { newId, type LineItem } from '../lib/types'
import { formatMoney } from '../lib/money'
import { ofMonth, shiftMonth } from '../lib/dates'
import { MoneyInput } from '../components/MoneyInput'
import { IconClose, IconPlus } from '../components/icons'

interface LineListProps {
  title: string
  hint: string
  items: LineItem[]
  addLabel: string
  placeholder: string
  onChange: (items: LineItem[]) => void
}

function LineList({ title, hint, items, addLabel, placeholder, onChange }: LineListProps) {
  const [addedId, setAddedId] = useState<string | null>(null)
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  return (
    <section className="block" aria-label={title}>
      <div className="block-head">
        <h2 className="block-title">{title}</h2>
        <span className="block-sum">{formatMoney(sumItems(items))}</span>
      </div>
      <p className="block-hint">{hint}</p>
      <ul className="lines">
        {items.map((item) => (
          <li key={item.id} className="line">
            <input
              className="line-label"
              type="text"
              value={item.label}
              placeholder={placeholder}
              autoFocus={item.id === addedId}
              aria-label={`Nom (${title})`}
              onChange={(e) => update(item.id, { label: e.target.value })}
            />
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
          </li>
        ))}
      </ul>
      <button type="button" className="add-line" onClick={() => {
          const id = newId()
          setAddedId(id)
          onChange([...items, { id, label: '', amount: 0 }])
        }}>
        <IconPlus width={18} height={18} />
        {addLabel}
      </button>
    </section>
  )
}

export function BudgetScreen({ monthKey }: { monthKey: string }) {
  const { data, updatePlan, copyPreviousPlan } = useStore()
  const plan = getPlan(data, monthKey)
  const summary = monthSummary(data, monthKey)
  const prevKey = shiftMonth(monthKey, -1)
  const canCopy = !hasPlan(data, monthKey) && hasPlan(data, prevKey)

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Budget {ofMonth(monthKey)}</h1>
        <p className="screen-intro">
          En début de mois, note ce qui rentre, ce qui part forcément et ce que tu veux épargner. Le reste, c'est ton
          budget pour vivre.
        </p>
      </header>

      {canCopy && (
        <div className="callout">
          <p>Ton budget {ofMonth(prevKey)} est prêt à être repris.</p>
          <button type="button" className="secondary-button" onClick={() => copyPreviousPlan(monthKey)}>
            Reprendre le budget {ofMonth(prevKey)}
          </button>
        </div>
      )}

      <LineList
        title="Revenus"
        hint="Salaire, aides, extras attendus ce mois-ci."
        items={plan.incomes}
        addLabel="Ajouter un revenu"
        placeholder="Salaire"
        onChange={(incomes) => updatePlan(monthKey, { incomes })}
      />

      <LineList
        title="Charges fixes"
        hint="Loyer, abonnements, assurances : ce qui part quoi qu'il arrive."
        items={plan.fixed}
        addLabel="Ajouter une charge"
        placeholder="Loyer"
        onChange={(fixed) => updatePlan(monthKey, { fixed })}
      />

      <section className="block" aria-labelledby="savings-title">
        <div className="block-head">
          <h2 id="savings-title" className="block-title">
            Épargne visée
          </h2>
          <MoneyInput
            className="savings-input"
            value={plan.savingsGoal}
            aria-labelledby="savings-title"
            onCommit={(savingsGoal) => updatePlan(monthKey, { savingsGoal })}
          />
        </div>
        <p className="block-hint">Mets-la de côté dès le début du mois, comme une charge.</p>
      </section>

      <section className="block" aria-labelledby="calc-title">
        <h2 id="calc-title" className="visually-hidden">
          Calcul du budget disponible
        </h2>
        <dl className="calc">
          <div>
            <dt>Revenus</dt>
            <dd>{formatMoney(summary.income)}</dd>
          </div>
          <div>
            <dt>Charges fixes</dt>
            <dd>− {formatMoney(summary.fixed)}</dd>
          </div>
          <div>
            <dt>Épargne visée</dt>
            <dd>− {formatMoney(summary.savingsGoal)}</dd>
          </div>
          <div className={`calc-total ${summary.available < 0 ? 'is-over' : ''}`}>
            <dt>Disponible pour le mois</dt>
            <dd>{formatMoney(summary.available)}</dd>
          </div>
        </dl>
        {summary.available < 0 && (
          <p className="form-error">Tes charges et ton épargne dépassent tes revenus. Baisse l'épargne visée ou une charge.</p>
        )}
      </section>
    </div>
  )
}
