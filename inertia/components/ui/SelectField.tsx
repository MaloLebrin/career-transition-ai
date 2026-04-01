import { Description, Field, Label, Select } from '@headlessui/react'
import { useId, useMemo } from 'react'

export type SelectFieldOption<V extends string = string> = {
  value: V
  label: string
  /** Affichée sous le contrôle si `showSelectedOptionDescription` est activé. */
  description?: string
}

export type SelectFieldProps<V extends string> = {
  /** Libellé visible au-dessus du select (sinon utiliser `aria-label`). */
  label?: string
  /** Texte d’aide du champ (Headless `Description`), affiché sous le label. */
  description?: string
  options: SelectFieldOption<V>[]
  value: V
  onChange: (value: V) => void
  name?: string
  disabled?: boolean
  invalid?: boolean
  error?: string
  className?: string
  selectClassName?: string
  /** Affiche la description de l’option actuellement sélectionnée sous le select. */
  showSelectedOptionDescription?: boolean
  id?: string
  'aria-label'?: string
}

const selectBaseClass =
  'w-full border border-brand-navy/10 rounded-xl text-xs px-3 py-2 text-brand-navy/80 bg-white ' +
  'outline-none transition-shadow data-focus:ring-2 data-focus:ring-brand-sage/30 data-focus:border-brand-sage/40 ' +
  'data-hover:border-brand-navy/15 data-invalid:border-rose-300 data-invalid:ring-rose-200/50'

/**
 * Select stylé avec [@headlessui/react Select](https://headlessui.com/react/select),
 * optionnellement groupé dans `Field` + `Label` + `Description`.
 * Les descriptions par option ne sont pas rendues dans la liste native : elles s’affichent
 * sous le contrôle lorsque `showSelectedOptionDescription` est à `true`.
 */
export default function SelectField<V extends string>({
  label,
  description,
  options,
  value,
  onChange,
  name,
  disabled = false,
  invalid = false,
  error,
  className = '',
  selectClassName = '',
  showSelectedOptionDescription = false,
  id: idProp,
  'aria-label': ariaLabel,
}: SelectFieldProps<V>) {
  const reactId = useId()
  const fieldId = idProp ?? reactId
  const selectedDescId = `${fieldId}-selected-option-desc`

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  )

  const describedBy =
    [error ? `${fieldId}-error` : undefined, selected?.description ? selectedDescId : undefined]
      .filter(Boolean)
      .join(' ') || undefined

  const isInvalid = invalid || !!error

  return (
    <Field disabled={disabled} className={className}>
      {label ? (
        <Label
          htmlFor={fieldId}
          className="text-[10px] font-black text-brand-navy/40 uppercase tracking-widest px-0.5 mb-1 block"
        >
          {label}
        </Label>
      ) : null}
      {description && !error ? (
        <Description className="text-[10px] font-medium text-brand-navy/45 mb-1.5 px-0.5">
          {description}
        </Description>
      ) : null}
      <Select
        id={fieldId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        disabled={disabled}
        invalid={isInvalid}
        aria-label={!label ? ariaLabel : undefined}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        className={`${selectBaseClass} ${selectClassName}`.trim()}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {error ? (
        <p id={`${fieldId}-error`} className="text-[10px] font-bold text-rose-500 mt-1 px-0.5" role="alert">
          {error}
        </p>
      ) : null}
      {showSelectedOptionDescription && selected?.description ? (
        <p id={selectedDescId} className="text-[10px] font-medium text-brand-navy/50 mt-1.5 max-w-xs leading-snug">
          {selected.description}
        </p>
      ) : null}
    </Field>
  )
}
