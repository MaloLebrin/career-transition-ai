import React, { forwardRef, useState, useCallback, memo } from 'react'
import { InputActions } from './input/InputActions'
import {
  ADDON_CLASSES,
  ERROR_MESSAGE_CLASSES,
  HINT_MESSAGE_CLASSES,
  LABEL_CLASSES,
  REQUIRED_MARK_CLASSES,
  fieldClassName,
  innerFieldClassName,
  wrapperClassName,
  type FieldSize,
} from './input/input_classes'

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
  'sizeVariant'?: FieldSize
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

    // Structure stable : conteneur dès qu'on peut avoir des actions (évite un remount de l'input)
    const hasActions =
      showPasswordBtn || (isClearableType && showClearButton !== false && !disabled)

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

    const describedByIds =
      [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

    const state = { error: Boolean(error), success }
    const wrapped = hasAddons || hasActions
    const inputEl = (
      <input
        ref={ref}
        id={id}
        type={effectiveType}
        value={isControlled ? valueProp : internalValue}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={
          wrapped
            ? innerFieldClassName(sizeVariant)
            : fieldClassName({ size: sizeVariant, ...state, className })
        }
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={describedByIds}
        aria-disabled={disabled}
        aria-hidden={ariaHidden}
        onChange={handleChange}
        {...props}
      />
    )

    const actions = (
      <InputActions
        showClear={showClear}
        onClear={handleClear}
        showPasswordToggle={showPasswordBtn}
        passwordVisible={showPassword}
        onTogglePassword={handleTogglePassword}
      />
    )

    const fieldContent = hasActions ? (
      <div
        className={
          hasAddons
            ? 'flex flex-1 min-w-0'
            : wrapperClassName({ size: sizeVariant, ...state, className })
        }
      >
        {inputEl}
        {actions}
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
          <label id={labelId} htmlFor={id} className={LABEL_CLASSES}>
            {label}
            {required && (
              <span className={REQUIRED_MARK_CLASSES} aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        {hasAddons ? (
          <div className={wrapperClassName({ size: sizeVariant, ...state, className })}>
            {leftAddon && <div className={`${ADDON_CLASSES} pl-3.5`}>{leftAddon}</div>}
            {fieldContent}
            {rightAddon && <div className={`${ADDON_CLASSES} pr-3.5`}>{rightAddon}</div>}
          </div>
        ) : (
          fieldContent
        )}
        {error && (
          <p id={`${id}-error`} className={ERROR_MESSAGE_CLASSES} role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className={HINT_MESSAGE_CLASSES}>
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default memo(Input)
