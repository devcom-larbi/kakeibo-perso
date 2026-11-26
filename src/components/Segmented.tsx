interface SegmentedProps<T extends string> {
  options: { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
  /** Nom du groupe pour les lecteurs d'écran */
  label: string
}

/** Sous-onglets en haut d'une page : une pastille glisse sous l'onglet choisi. */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  const index = Math.max(
    options.findIndex((o) => o.id === value),
    0,
  )
  return (
    <div className="segmented" role="tablist" aria-label={label} style={{ ['--n' as string]: options.length, ['--i' as string]: index }}>
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={o.id === value}
          className="segmented-option"
          onClick={() => o.id !== value && onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
