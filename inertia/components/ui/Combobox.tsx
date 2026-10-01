import {
  Combobox as HeadlessCombobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { Check, ChevronDown, X } from 'lucide-react'
import { useState, useMemo, useCallback, useId } from 'react'

export interface ComboboxOption {
  id: string | number
  label: string
  description?: string
}

export interface ComboboxProps<T extends ComboboxOption> {
  /** Label au-dessus du champ */
  label?: string
  /** Placeholder du champ de recherche */
  placeholder?: string
  /** Liste des options disponibles */
  options: T[]
  /** Option actuellement sélectionnée */
  value: T | null
  /** Callback appelé lors de la sélection d'une option */
  onChange: (option: T | null) => void
  /** Permet de créer une nouvelle option si la recherche ne retourne rien */
  allowCreate?: boolean
  /** Callback appelé lors de la création d'une nouvelle option */
  onCreate?: (inputValue: string) => void
  /** Message d'erreur de validation */
  error?: string
  /** Texte d'aide sous le champ (hors erreur) */
  hint?: string
  /** Champ obligatoire */
  required?: boolean
  /** Désactivé */
  disabled?: boolean
  /** Taille visuelle */
  sizeVariant?: 'sm' | 'md' | 'lg'
  /** Nombre maximum d'options affichées */
  maxDisplayed?: number
  /** Message quand aucune option ne correspond */
  emptyMessage?: string
  /** Affiche un bouton pour vider la sélection */
  clearable?: boolean
}

const sizeClasses = {
  sm: 'py-2 px-3 text-xs',
  md: 'py-3 px-4 text-sm',
  lg: 'py-4 px-5 text-base',
} as const

const minHeightBySize = {
  sm: 'min-h-[42px]',
  md: 'min-h-[54px]',
  lg: 'min-h-[62px]',
} as const

export default function Combobox<T extends ComboboxOption>({
  label,
  placeholder = 'Rechercher...',
  options,
  value,
  onChange,
  allowCreate = false,
  onCreate,
  error,
  hint,
  required = false,
  disabled = false,
  sizeVariant = 'md',
  maxDisplayed = 10,
  emptyMessage = 'Aucun résultat',
  clearable = true,
}: ComboboxProps<T>) {
  const id = useId()
  const [query, setQuery] = useState('')

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options.slice(0, maxDisplayed)

    const lowerQuery = query.toLowerCase().trim()
    return options
      .filter(
        (option) =>
          option.label.toLowerCase().includes(lowerQuery) ||
          option.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, maxDisplayed)
  }, [options, query, maxDisplayed])

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(null)
      setQuery('')
    },
    [onChange]
  )

  const handleChange = useCallback(
    (option: T | null) => {
      onChange(option)
      setQuery('')
    },
    [onChange]
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  const showCreateOption = allowCreate && query.trim() && filteredOptions.length === 0

  const wrapperClassName = [
    'flex items-stretch rounded-2xl border overflow-hidden bg-white transition-all',
    'focus-within:ring-4 focus-within:outline-none',
    minHeightBySize[sizeVariant],
    error
      ? 'border-rose-300 bg-rose-50 focus-within:border-rose-400 focus-within:ring-rose-400/10'
      : 'border-brand-navy/10 focus-within:border-brand-sage focus-within:ring-brand-sage/5',
    disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const inputClassName = [
    'flex-1 min-w-0 border-0 rounded-none bg-transparent outline-none font-medium',
    'placeholder:text-brand-navy/20 disabled:cursor-not-allowed',
    sizeClasses[sizeVariant],
  ].join(' ')

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block"
        >
          {label}
          {required && (
            <span className="text-rose-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <HeadlessCombobox value={value} onChange={handleChange} disabled={disabled}>
        <div className="relative">
          <div className={wrapperClassName}>
            <ComboboxInput
              id={id}
              className={inputClassName}
              displayValue={(option: T | null) => option?.label ?? ''}
              onChange={handleInputChange}
              placeholder={placeholder}
              autoComplete="off"
            />

            <div className="flex items-center gap-0.5 shrink-0 pr-2">
              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sage/50 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Effacer la sélection"
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              )}
              <ComboboxButton className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sage/50 cursor-pointer disabled:cursor-not-allowed">
                <ChevronDown className="w-4 h-4" aria-hidden />
              </ComboboxButton>
            </div>
          </div>

          <ComboboxOptions className="absolute left-0 right-0 z-[300] mt-2 max-h-60 overflow-auto rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none">
            {filteredOptions.length === 0 && !showCreateOption ? (
              <div className="px-4 py-3 text-sm text-slate-500 italic">{emptyMessage}</div>
            ) : (
              <>
                {filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.id}
                    value={option}
                    className="group cursor-pointer select-none px-4 py-3 text-sm text-brand-navy data-focus:bg-brand-sage/10 data-selected:bg-brand-sage/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block truncate group-data-selected:font-semibold">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="text-xs text-slate-400 block truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                      <Check
                        className="w-4 h-4 text-brand-sage shrink-0 opacity-0 group-data-selected:opacity-100"
                        aria-hidden
                      />
                    </div>
                  </ComboboxOption>
                ))}

                {showCreateOption && onCreate && (
                  <button
                    type="button"
                    onClick={() => onCreate(query.trim())}
                    className="w-full cursor-pointer disabled:cursor-not-allowed select-none px-4 py-3 text-sm text-brand-navy hover:bg-brand-sage/10 transition-colors text-left border-t border-slate-100"
                  >
                    <span className="font-medium">Créer « {query.trim()} »</span>
                  </button>
                )}
              </>
            )}
          </ComboboxOptions>
        </div>
      </HeadlessCombobox>

      {error && (
        <p className="text-[9px] font-bold text-rose-500 px-2" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-[9px] font-medium text-slate-400 px-2">{hint}</p>}
    </div>
  )
}
