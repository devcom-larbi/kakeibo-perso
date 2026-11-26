/**
 * Aura d'énergie façon shōnen : des flammes qui montent et quelques éclairs.
 * La couleur vient de la variable CSS --aura du parent (doré pour un rang S, etc.).
 */
const FLAMES = [0, 1, 2, 3, 4, 5, 6, 7]

export function Aura({ lightning = false }: { lightning?: boolean }) {
  return (
    <span className="aura" aria-hidden="true">
      {FLAMES.map((i) => (
        <span key={i} className="aura-flame" style={{ ['--i' as string]: i }} />
      ))}
      {lightning && (
        <svg className="aura-bolts" viewBox="0 0 200 200">
          <polyline points="38,40 58,78 46,84 70,124" />
          <polyline points="162,48 140,86 154,92 128,134" />
          <polyline points="100,8 92,36 104,40 94,66" />
        </svg>
      )}
    </span>
  )
}
