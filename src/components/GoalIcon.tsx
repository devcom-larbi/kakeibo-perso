import type { GoalKind } from '../lib/types'

/** Un kanji par type d'objectif : 旅 voyage, 買 achat, 守 sécurité, 夢 projet */
const KANJI: Record<GoalKind, string> = { voyage: '旅', achat: '買', securite: '守', projet: '夢' }

export function GoalIcon({ kind, size = 22 }: { kind: GoalKind; size?: number }) {
  return (
    <span className="goal-kanji" style={{ fontSize: size * 0.9 }} aria-hidden="true">
      {KANJI[kind]}
    </span>
  )
}
