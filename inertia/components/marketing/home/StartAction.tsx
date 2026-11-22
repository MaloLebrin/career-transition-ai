import React from 'react'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName, type ButtonVariant } from '~/components/ui/Button'
import { REGISTER_ACTION, WAITLIST_ACTION } from '~/config/marketing'

interface StartActionProps {
  /** Inscription des particuliers ouverte (`b2cRegistrationEnabled`). */
  registrationOpen: boolean
  variant?: ButtonVariant
  /** Sur l'accueil, la liste d'attente est une ancre de la page (`#contact`). */
  onHome?: boolean
  className?: string
}

/**
 * Le bouton « Commencer gratuitement » des pages particuliers, ou « Être prévenu de
 * l'ouverture » (formulaire de l'accueil) quand l'inscription est fermée.
 */
export const StartAction: React.FC<StartActionProps> = ({
  registrationOpen,
  variant = 'primary',
  onHome = false,
  className = '',
}) => {
  const classes = buttonClassName({ variant, size: 'lg', className })
  if (registrationOpen) {
    return (
      <AppLink href={REGISTER_ACTION.href} className={classes}>
        {REGISTER_ACTION.label}
      </AppLink>
    )
  }
  if (onHome) {
    return (
      <a href="#contact" className={classes}>
        {WAITLIST_ACTION.label}
      </a>
    )
  }
  return (
    <AppLink href={WAITLIST_ACTION.href} className={classes}>
      {WAITLIST_ACTION.label}
    </AppLink>
  )
}
