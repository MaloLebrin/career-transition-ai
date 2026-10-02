import React, { type ReactNode } from 'react'
import { LandscapeArt } from '../marketing/LandscapeArt'
import PublicLayout from '../layout/PublicLayout'
import Card from '../ui/Card'

export type AuthShellIconTone = 'primary' | 'warning'
export type AuthShellAccent = 'none' | 'warm'

export interface AuthShellProps {
  title: string
  subtitle?: ReactNode
  /** Icône (lucide) affichée dans une tuile au-dessus du titre. */
  icon?: ReactNode
  iconTone?: AuthShellIconTone
  children: ReactNode
  /** Zone sous la carte (lien de retour, bascule connexion/inscription). */
  footer?: ReactNode
  /** `warm` : filet apricot en haut de la carte (liens invalides, avertissements). */
  accent?: AuthShellAccent
}

const ICON_TONES: Record<AuthShellIconTone, string> = {
  primary: 'bg-tint-sun text-ink',
  warning: 'bg-warning-soft text-warning',
}

const ACCENTS: Record<AuthShellAccent, string> = {
  none: '',
  warm: 'border-t-2 border-t-tint-apricot-bold',
}

/**
 * Coquille commune des écrans d'authentification et d'onboarding (DESIGN.md) :
 * en-tête minimal, carte centrée sur un horizon pastel, titre, sous-titre et pied de carte.
 */
export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  icon,
  iconTone = 'primary',
  children,
  footer,
  accent = 'none',
}) => (
  <PublicLayout header={{ minimal: true }} footer={false}>
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 sm:block md:h-52">
        <LandscapeArt variant="horizon" />
      </div>
      <Card padding="lg" className={`relative w-full max-w-md ${ACCENTS[accent]}`.trim()}>
        <div className="mb-8 text-center">
          {icon && (
            <div
              className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${ICON_TONES[iconTone]}`}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <h1 className="text-display-sm">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        </div>

        {children}

        {footer && (
          <div className="mt-8 border-t border-hairline pt-6 text-center text-sm text-muted">
            {footer}
          </div>
        )}
      </Card>
    </div>
  </PublicLayout>
)
