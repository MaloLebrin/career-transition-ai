import React, { forwardRef, memo } from 'react'
import {
  ERROR_MESSAGE_CLASSES,
  FIELD_BASE_CLASSES,
  FIELD_TEXT_CLASSES,
  HINT_MESSAGE_CLASSES,
  LABEL_CLASSES,
  REQUIRED_MARK_CLASSES,
  fieldStateClassName,
  type FieldSize,
} from './input/input_classes'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label au-dessus du champ */
  label?: string
  /** Message d'erreur de validation */
  error?: string
  /** Texte d'aide sous le champ (hors erreur) */
  hint?: string
  /** Taille visuelle du champ */
  sizeVariant?: FieldSize
}

/** Champ multi-lignes, même API et mêmes tokens que `Input`. */
export const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    {
      label,
      error,
      hint,
      sizeVariant = 'md',
      className = '',
      id: providedId,
      required,
      rows = 4,
      ...props
    },
    ref
  ) {
    const id = providedId ?? `textarea-${React.useId()}`
    const describedByIds =
      [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={id} className={LABEL_CLASSES}>
            {label}
            {required && (
              <span className={REQUIRED_MARK_CLASSES} aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error)}
          aria-required={required}
          aria-describedby={describedByIds}
          className={[
            FIELD_BASE_CLASSES,
            'resize-y min-h-24',
            FIELD_TEXT_CLASSES[sizeVariant],
            fieldStateClassName({ error: Boolean(error) }),
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
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
  })
)

Textarea.displayName = 'Textarea'
