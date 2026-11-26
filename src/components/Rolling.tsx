import { useEffect, useState } from 'react'
import { formatMoney } from '../lib/money'
import { reducedMotion } from '../lib/motion'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Dernière valeur affichée par identifiant, pour reprendre le défilement là où il s'était arrêté. */
const lastShown = new Map<string, number>()

interface RollingProps {
  value: number
  /** Mise en forme (par défaut : montant en euros, la valeur étant en centimes) */
  format?: (v: number) => string
  /** Avec un identifiant, le compteur repart de sa dernière valeur au lieu de zéro */
  id?: string
}

/**
 * Compteur à rouleaux : chaque chiffre défile verticalement jusqu'à sa valeur.
 * Le texte réel reste lisible par les lecteurs d'écran.
 */
export function Rolling({ value, format = formatMoney, id }: RollingProps) {
  const [display, setDisplay] = useState<number | null>(() => {
    if (reducedMotion()) return value
    return id !== undefined && lastShown.has(id) ? lastShown.get(id)! : null
  })

  useEffect(() => {
    if (id !== undefined) lastShown.set(id, value)
    // Deux images plus tard, pour que les zéros soient affichés avant de rouler.
    // Le minuteur sert de secours : les navigateurs suspendent requestAnimationFrame en arrière-plan.
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setDisplay(value))
    })
    const fallback = window.setTimeout(() => setDisplay(value), 120)
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
      window.clearTimeout(fallback)
    }
  }, [value, id])

  const real = format(value)
  // Premier affichage : mêmes colonnes que la valeur finale, mais toutes à zéro
  const text = display === null ? real.replace(/\d/g, '0') : format(display)
  const chars = [...text]

  return (
    <span className="odo">
      <span className="visually-hidden">{real}</span>
      <span className="odo-digits" aria-hidden="true">
        {chars.map((ch, i) => {
          const key = chars.length - i // position depuis la droite : les unités restent alignées
          if (ch >= '0' && ch <= '9') {
            return (
              <span key={key} className="odo-col" style={{ ['--d' as string]: Number(ch), ['--k' as string]: i }}>
                <span className="odo-sizer">{ch}</span>
                <span className="odo-window">
                  <span className="odo-strip">
                    {DIGITS.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </span>
                </span>
              </span>
            )
          }
          return (
            <span key={key} className="odo-char">
              {ch}
            </span>
          )
        })}
      </span>
    </span>
  )
}
