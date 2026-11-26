import { useCallback, useRef } from 'react'
import { buzz, reducedMotion, replayClass } from '../lib/motion'

/** Secoue un élément (champ refusé, message d'erreur). Rejouable à chaque appel. */
export function useShake<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const shake = useCallback(() => {
    if (!reducedMotion()) replayClass(ref.current, 'is-shaking')
    buzz([10, 40, 10])
  }, [])
  return [ref, shake] as const
}
