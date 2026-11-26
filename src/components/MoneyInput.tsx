import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { centsToInput, parseMoney } from '../lib/money'

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number
  onCommit: (cents: number) => void
}

/** Champ de montant : garde le texte tapé, enregistre en centimes à la sortie du champ. */
export function MoneyInput({ value, onCommit, className = '', ...rest }: MoneyInputProps) {
  const [text, setText] = useState(centsToInput(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(centsToInput(value))
  }, [value, focused])

  const commit = () => {
    const cents = parseMoney(text)
    const next = cents ?? 0
    if (next !== value) onCommit(next)
    setText(centsToInput(next))
  }

  return (
    <span className={`money-input ${className}`}>
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={rest.placeholder ?? '0'}
        value={text}
        onFocus={(e) => {
          setFocused(true)
          e.currentTarget.select()
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          setFocused(false)
          commit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <span className="money-input-unit" aria-hidden="true">€</span>
    </span>
  )
}
