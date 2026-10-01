import { Eye, EyeOff, X } from 'lucide-react'
import React from 'react'
import { ACTION_BUTTON_CLASSES } from './input_classes'

export interface InputActionsProps {
  showClear: boolean
  onClear: () => void
  showPasswordToggle: boolean
  passwordVisible: boolean
  onTogglePassword: () => void
}

/** Boutons « vider » et « afficher le mot de passe » à droite d'un champ. */
export const InputActions: React.FC<InputActionsProps> = ({
  showClear,
  onClear,
  showPasswordToggle,
  passwordVisible,
  onTogglePassword,
}) => {
  if (!showClear && !showPasswordToggle) return null
  return (
    <div className="flex items-center gap-0.5 shrink-0 pr-1.5">
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className={ACTION_BUTTON_CLASSES}
          aria-label="Vider le champ"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      )}
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className={ACTION_BUTTON_CLASSES}
          aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {passwordVisible ? (
            <EyeOff className="w-4 h-4" aria-hidden />
          ) : (
            <Eye className="w-4 h-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  )
}
