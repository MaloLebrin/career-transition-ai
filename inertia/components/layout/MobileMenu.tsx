import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { router } from '@inertiajs/react'
import { X } from 'lucide-react'
import React, { useEffect } from 'react'
import type { ActionItem, NavItem } from '~/config/marketing'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Logo } from '~/components/ui/Logo'

export interface MobileMenuProps {
  open: boolean
  onClose: () => void
  items: NavItem[]
  primaryAction?: ActionItem | null
  secondaryAction?: ActionItem | null
}

/** Panneau de navigation plein écran (< md), fermé à la navigation et à Échap. */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  open,
  onClose,
  items,
  primaryAction,
  secondaryAction,
}) => {
  useEffect(() => {
    if (!open || typeof router.on !== 'function') return
    return router.on('navigate', onClose)
  }, [open, onClose])

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 md:hidden">
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
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <AppLink
                  href={item.href}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-surface-soft"
                >
                  {item.label}
                </AppLink>
              </li>
            ))}
          </ul>
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
