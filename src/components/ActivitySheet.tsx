import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'
import { useShake } from './useShake'
import { useStore } from '../store'
import { ACTIVITIES, DEFAULT_PRO, type ActivityId, type ProSettings } from '../lib/types'
import { contributionsOn } from '../lib/budget'
import { formatMoney, formatRate, parseRate } from '../lib/money'
import { feedback } from '../lib/feedback'

/** Choix du type d'activité en micro-entreprise : fixe la part que l'URSSAF prendra. */
export function ActivitySheet({ onClose }: { onClose: () => void }) {
  const { data, setProSettings } = useStore()
  const current = data.settings.pro ?? DEFAULT_PRO
  const [activity, setActivity] = useState<ActivityId>(current.activity)
  const [custom, setCustom] = useState(current.activity === 'perso' ? String(current.rate / 100).replace('.', ',') : '')
  const [liberatoire, setLiberatoire] = useState(current.liberatoire)
  const [error, setError] = useState('')
  const [errorRef, shakeError] = useShake<HTMLParagraphElement>()

  const preset = ACTIVITIES.find((a) => a.id === activity) ?? ACTIVITIES[0]
  const isCustom = activity === 'perso'
  const customRate = parseRate(custom)
  const draft: ProSettings = {
    activity,
    rate: isCustom ? customRate ?? 0 : preset.rate,
    liberatoire: !isCustom && liberatoire,
  }
  const onHundred = contributionsOn(10000, draft)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (isCustom && customRate === null) {
      setError('Indique un pourcentage entre 0 et 100, par exemple 22,5.')
      shakeError()
      return
    }
    setProSettings(draft)
    feedback.emit({ kind: 'toast', title: 'Activité enregistrée', detail: `${formatRate(draft.rate + (draft.liberatoire ? preset.liberatoire : 0))} retenus sur tes revenus pro` })
    onClose()
  }

  return (
    <Sheet title="Mon activité" onClose={onClose}>
      <form className="expense-form" onSubmit={submit} noValidate>
        <p className="sheet-intro">
          En micro-entreprise, l'URSSAF prend un pourcentage de ce que tu encaisses. Coche « Pro » sur un revenu et l'app
          met cette part de côté dans ton budget.
        </p>

        <fieldset className="activity-picker">
          <legend>Type d'activité</legend>
          {ACTIVITIES.map((a) => (
            <label key={a.id} className="activity-option">
              <input type="radio" name="activity" value={a.id} checked={activity === a.id} onChange={() => setActivity(a.id)} />
              <span className="activity-option-text">
                <span className="activity-option-label">{a.label}</span>
                <span className="activity-option-hint">{a.hint}</span>
              </span>
              {a.id !== 'perso' && <span className="activity-option-rate">{formatRate(a.rate)}</span>}
            </label>
          ))}
        </fieldset>

        {isCustom && (
          <label className="field">
            <span>Ton pourcentage total</span>
            <span className="field-money">
              <input
                type="text"
                inputMode="decimal"
                placeholder="22,5"
                value={custom}
                autoFocus
                onChange={(e) => {
                  setCustom(e.target.value)
                  setError('')
                }}
              />
              <span aria-hidden="true">%</span>
            </span>
          </label>
        )}

        {!isCustom && (
          <label className="switch-row">
            <input type="checkbox" checked={liberatoire} onChange={(e) => setLiberatoire(e.target.checked)} />
            <span className="switch" aria-hidden="true" />
            <span>
              J'ai choisi le versement libératoire de l'impôt <strong>(+ {formatRate(preset.liberatoire)})</strong>
            </span>
          </label>
        )}

        <p className="pro-example">
          Sur <strong>100,00 €</strong> encaissés, mets <strong>{formatMoney(onHundred)}</strong> de côté pour l'URSSAF. Il
          te reste <strong>{formatMoney(10000 - onHundred)}</strong>.
        </p>

        {error && (
          <p className="form-error" role="alert" ref={errorRef}>
            {error}
          </p>
        )}

        <button type="submit" className="primary-button">
          Enregistrer
        </button>
        <p className="sheet-note">Taux 2026. Vérifie le tien sur urssaf.fr : ils changent parfois en début d'année.</p>
      </form>
    </Sheet>
  )
}
