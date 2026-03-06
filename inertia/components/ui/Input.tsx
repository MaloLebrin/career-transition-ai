import React, { forwardRef, useState, useCallback, memo } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'

/** Types d'input courants pour formulaires (évite les typos et améliore l'autocomplétion) */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'time'
  | 'color'
  | 'range'

/** Valeurs autocomplete courantes (spec HTML) pour aide à la saisie et accessibilité */
export type InputAutoComplete =
  | 'off'
  | 'on'
  | 'name'
  | 'honorific-prefix'
  | 'given-name'
  | 'additional-name'
  | 'family-name'
  | 'email'
  | 'username'
  | 'new-password'
  | 'current-password'
  | 'one-time-code'
  | 'organization'
  | 'street-address'
  | 'address-line1'
  | 'address-line2'
  | 'address-level1'
  | 'address-level2'
  | 'country'
  | 'postal-code'
  | 'tel'
  | 'url'
  | 'bday'
  | 'sex'

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'autoComplete'
> {
  /** Type du champ (défaut: "text") */
  'type'?: InputType
  /** Indication pour l'autocomplétion du navigateur et des gestionnaires de mots de passe */
  'autoComplete'?: InputAutoComplete
  /** Label au-dessus du champ */
  'label'?: string
  /** Message d'erreur de validation */
  'error'?: string
  /** Texte d'aide sous le champ (hors erreur) */
  'hint'?: string
  /** Taille visuelle du champ */
  'sizeVariant'?: 'sm' | 'md' | 'lg'
  /** Élément optionnel à gauche du champ (icône, préfixe) */
  'leftAddon'?: React.ReactNode
  /** Élément optionnel à droite du champ (icône, suffixe) */
  'rightAddon'?: React.ReactNode
  /** Indique un état de succès (validation OK) */
  'success'?: boolean
  /** Masque le champ aux lecteurs d'écran (à réserver aux champs décoratifs) */
  'aria-hidden'?: boolean
  /** Affiche un bouton pour vider le champ (défaut: true pour types texte/nombre/dates) */
  'showClearButton'?: boolean
  /** Affiche un bouton pour afficher/masquer le mot de passe (défaut: true quand type="password") */
  'showPasswordToggle'?: boolean
}

/** Types pour lesquels le bouton "vider" est proposé par défaut (Set pour lookup O(1)) */
const CLEARABLE_TYPES = new Set<InputType>([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
])

const sizeClasses = {
  sm: 'py-2 px-3 text-xs',
  md: 'py-3 px-4 text-sm',
  lg: 'py-4 px-5 text-base',
} as const

/** Hauteur min. du conteneur pour aligner visuellement tous les champs (avec ou sans bouton d’action). */
const minHeightBySize = {
  sm: 'min-h-[42px]',
  md: 'min-h-[54px]',
  lg: 'min-h-[62px]',
} as const

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      sizeVariant = 'md',
      leftAddon,
      rightAddon,
      success = false,
      className = '',
      'id': providedId,
      disabled,
      required,
      type = 'text',
      autoComplete,
      'aria-hidden': ariaHidden,
      showClearButton,
      showPasswordToggle = true,
      'value': valueProp,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const id = providedId ?? `input-${React.useId()}`
    const hasAddons = Boolean(leftAddon || rightAddon)
    const isPassword = type === 'password'
    const isClearableType = CLEARABLE_TYPES.has(type)

    const [showPassword, setShowPassword] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')

    const isControlled = valueProp !== undefined
    const displayValue = isControlled ? valueProp : internalValue
    const hasValue =
      displayValue !== undefined && displayValue !== null && String(displayValue).trim() !== ''

    const showClear = showClearButton !== false && isClearableType && hasValue && !disabled
    const showPasswordBtn = isPassword && showPasswordToggle && !disabled

    const effectiveType: React.InputHTMLAttributes<HTMLInputElement>['type'] =
      isPassword && showPassword ? 'text' : type

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) setInternalValue(e.target.value)
        onChange?.(e)
      },
      [isControlled, onChange]
    )

    const handleClear = useCallback(() => {
      if (disabled) return
      if (isControlled && onChange) {
        const syntheticEvent = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      } else {
        setInternalValue('')
      }
    }, [disabled, isControlled, onChange])

    const handleTogglePassword = useCallback(() => setShowPassword((p) => !p), [])

    // Accessibilité : décrire par erreur et/ou hint pour les lecteurs d'écran
    const describedByIds =
      [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

    const baseInputClasses = [
      'w-full bg-white border rounded-2xl outline-none font-medium transition-all',
      'placeholder:text-brand-navy/20',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
      sizeClasses[sizeVariant],
      minHeightBySize[sizeVariant],
    ]

    const stateClasses = error
      ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10'
      : success
        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
        : 'border-brand-navy/10 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5'

    const standaloneInputClassName = [...baseInputClasses, stateClasses, className]
      .filter(Boolean)
      .join(' ')

    const addonInputClassName = [
      'flex-1 min-w-0 border-0 rounded-none focus:ring-0 bg-transparent outline-none font-medium',
      'placeholder:text-brand-navy/20 disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses[sizeVariant],
    ].join(' ')

    const wrapperClassName = [
      'flex items-stretch rounded-2xl border overflow-hidden bg-white',
      'focus-within:ring-4 focus-within:outline-none',
      error
        ? 'border-rose-300 bg-rose-50 focus-within:border-rose-400 focus-within:ring-rose-400/10'
        : success
          ? 'border-emerald-300 focus-within:border-emerald-500 focus-within:ring-emerald-500/10'
          : 'border-brand-navy/10 focus-within:border-brand-sage focus-within:ring-brand-sage/5',
    ].join(' ')

    const hasActions = showClear || showPasswordBtn
    const inputClassName = hasAddons || hasActions ? addonInputClassName : standaloneInputClassName
    // Wrapper sans padding : même hauteur que l'input seul (padding porté par l'input à l'intérieur)
    const actionsWrapperClassName = hasActions
      ? [
          'flex items-stretch rounded-2xl border overflow-hidden bg-white outline-none font-medium transition-all',
          'focus-within:ring-4 focus-within:outline-none',
          error
            ? 'border-rose-300 bg-rose-50 focus-within:border-rose-400 focus-within:ring-rose-400/10'
            : success
              ? 'border-emerald-300 focus-within:border-emerald-500 focus-within:ring-emerald-500/10'
              : 'border-brand-navy/10 focus-within:border-brand-sage focus-within:ring-brand-sage/5',
          minHeightBySize[sizeVariant],
          className,
        ].join(' ')
      : ''

    const inputEl = (
      <input
        ref={ref}
        id={id}
        type={effectiveType}
        value={isControlled ? valueProp : internalValue}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={inputClassName}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={describedByIds}
        aria-disabled={disabled}
        aria-hidden={ariaHidden}
        onChange={handleChange}
        {...props}
      />
    )

    const actionButtons = (
      <div className="flex items-center gap-0.5 shrink-0 pr-2">
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sage/50"
            aria-label="Vider le champ"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
        {showPasswordBtn && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-sage/50"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden />
            ) : (
              <Eye className="w-4 h-4" aria-hidden />
            )}
          </button>
        )}
      </div>
    )

    const fieldContent = hasActions ? (
      <div className={hasAddons ? 'flex flex-1 min-w-0' : actionsWrapperClassName}>
        {inputEl}
        {actionButtons}
      </div>
    ) : (
      inputEl
    )

    const labelId = `${id}-label`

    return (
      <div
        className="space-y-1.5 w-full"
        role="group"
        aria-labelledby={label ? labelId : undefined}
      >
        {label && (
          <label
            id={labelId}
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
        {hasAddons ? (
          <div className={wrapperClassName}>
            {leftAddon && (
              <div className="flex items-center pl-4 text-brand-navy/40 bg-slate-50/50">
                {leftAddon}
              </div>
            )}
            {fieldContent}
            {rightAddon && (
              <div className="flex items-center pr-4 text-brand-navy/40 bg-slate-50/50">
                {rightAddon}
              </div>
            )}
          </div>
        ) : (
          fieldContent
        )}
        {error && (
          <p id={`${id}-error`} className="text-[9px] font-bold text-rose-500 px-2" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-[9px] font-medium text-slate-400 px-2">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default memo(Input)
