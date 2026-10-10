import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { router } from '@inertiajs/react'
import { X } from 'lucide-react'
import React, { useEffect } from 'react'
import type { ActionItem, MenuGroup } from '~/config/marketing'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Logo } from '~/components/ui/Logo'
import { MenuEntry, isCurrentPath } from './MegaMenu'

export interface MobileMenuProps {
  open: boolean
  onClose: () => void
  groups: MenuGroup[]
  /** URL courante, pour marquer la page active. */
  url?: string
  primaryAction?: ActionItem | null
  secondaryAction?: ActionItem | null
}

/** Panneau de navigation (< lg) : les groupes du méga-menu, fermé à la navigation et à Échap. */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  open,
  onClose,
  groups,
  url = '',
  primaryAction,
  secondaryAction,
}) => {
  useEffect(() => {
    if (!open || typeof router.on !== 'function') return
    return router.on('navigate', onClose)
  }, [open, onClose])

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop className="fixed inset-0 bg-ink/40" />
      <DialogPanel className="fixed inset-y-0 right-0 flex w-full max-w-sm flex-col bg-canvas shadow-raised">
        <div className="flex h-16 items-center justify-between border-b border-hairline px-6">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-ink cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label} aria-labelledby={`mobile-menu-${group.label}`}>
                <h2
                  id={`mobile-menu-${group.label}`}
                  className="px-3 pb-1 text-sm font-semibold text-muted"
                >
                  {group.label}
                </h2>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <MenuEntry item={item} current={isCurrentPath(url, item.href)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>
        {(primaryAction || secondaryAction) && (
          <div className="space-y-3 border-t border-hairline px-6 py-6">
            {primaryAction && (
              <AppLink
                href={primaryAction.href}
                className={buttonClassName({ variant: 'primary', size: 'lg', className: 'w-full' })}
              >
                {primaryAction.label}
              </AppLink>
            )}
            {secondaryAction && (
              <AppLink
                href={secondaryAction.href}
                className={buttonClassName({ variant: 'outline', size: 'lg', className: 'w-full' })}
              >
                {secondaryAction.label}
              </AppLink>
            )}
          </div>
        )}
      </DialogPanel>
    </Dialog>
  )
}
