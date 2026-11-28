import type { ImpersonationInfo } from '#shared/types/auth/impersonation'
import { useForm, usePage } from '@inertiajs/react'
import { UserRoundCog } from 'lucide-react'
import React from 'react'
import { useAuth } from '~/hooks/use_auth'
import Button from '../ui/Button'

export const LEAVE_IMPERSONATION_URL = '/auth/impersonation/leave'

/**
 * Bandeau de prise d'identité (#143) : rappelle au super admin sous quel
 * compte il navigue et le ramène au sien sans se reconnecter. Présent tant
 * que la prop partagée `impersonation` l'est. Tons `info` du design system.
 */
export function ImpersonationBanner() {
  const { props } = usePage<{ impersonation?: ImpersonationInfo }>()
  const { user } = useAuth()
  const { post, processing } = useForm({})
  const impersonation = props.impersonation

  if (!impersonation || !user) return null

  return (
    <section
      role="status"
      aria-labelledby="impersonation-title"
      className="mb-6 flex flex-col gap-4 rounded-xl border border-info/20 bg-info-soft p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-info"
          aria-hidden
        >
          <UserRoundCog size={18} />
        </span>
        <div>
          <p id="impersonation-title" className="text-title-sm text-ink">
            Vous naviguez en tant que {user.name}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Prise d’identité ouverte par {impersonation.impersonatorName}. Les actions faites ici le
            sont au nom de ce compte.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        isLoading={processing}
        disabled={processing}
        onClick={() => post(LEAVE_IMPERSONATION_URL)}
      >
        Revenir à mon compte
      </Button>
    </section>
  )
}
