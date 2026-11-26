import type { GoalKind } from '../lib/types'
import { IconBag, IconPlane, IconShield, IconStar } from './icons'

const ICONS = { voyage: IconPlane, achat: IconBag, securite: IconShield, projet: IconStar }

export function GoalIcon({ kind, size = 22 }: { kind: GoalKind; size?: number }) {
  const Icon = ICONS[kind]
  return <Icon width={size} height={size} />
}
