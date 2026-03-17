import React from 'react'
import Button, { type ButtonVariant } from '~/components/ui/Button'
import Card from '~/components/ui/Card'

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'success'
export type ConfirmModalState = 'idle' | 'loading' | 'success' | 'error'

type Props = {
  isOpen: boolean
  title: string
  description?: string

  /** Visual intent for the confirm action. */
  variant?: ConfirmModalVariant

  /** Controlled state to reflect async operations. */
  state?: ConfirmModalState

  confirmLabel?: string
  cancelLabel?: string

  /** Optional status copy when state=success/error */
  successMessage?: string
  errorMessage?: string

  /**
   * If false, the modal can only be closed with explicit actions (cancel / confirm).
   * Defaults to true.
   */
  closeOnBackdrop?: boolean

  onCancel: () => void
  onConfirm: () => void
}

function variantToButton(variant: ConfirmModalVariant): ButtonVariant {
  switch (variant) {
    case 'danger':
      return 'danger'
    case 'warning':
      return 'terracotta'
    case 'success':
      return 'lime'
    case 'info':
    default:
      return 'primary'
  }
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  variant = 'danger',
  state = 'idle',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  successMessage,
  errorMessage,
  closeOnBackdrop = true,
  onCancel,
  onConfirm,
}: Props) {
  if (!isOpen) return null

  const isLoading = state === 'loading'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => {
        if (closeOnBackdrop) onCancel()
      }}
    >
      <Card
        className="w-full max-w-md p-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-xl font-bold text-brand-navy mb-2">
          {title}
        </h2>
        {description && <p className="text-brand-navy/60 text-sm mb-6">{description}</p>}

        {(isError || isSuccess) && (
          <div
            className={`mb-6 rounded-2xl p-4 text-sm font-bold ${
              isError
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-brand-sage/10 text-brand-navy border border-brand-sage/20'
            }`}
            role={isError ? 'alert' : undefined}
          >
            {isError ? errorMessage ?? 'Une erreur est survenue.' : successMessage ?? 'Terminé.'}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" size="md" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variantToButton(variant)}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isSuccess}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}

