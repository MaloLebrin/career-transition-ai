import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import React from 'react'
import type { MenuGroup, MenuItem } from '~/config/marketing'
import AppLink from '~/components/ui/AppLink'
import { MARKETING_TINTS } from '~/components/marketing/tints'

/** Lien courant : même chemin, ou une sous-page (`/cabinets/tarifs` sous `/cabinets`). */
export function isCurrentPath(url: string, href: string): boolean {
  const path = url.split(/[?#]/)[0]
  if (href.includes('#')) return false
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

interface MenuEntryProps {
  item: MenuItem
  current: boolean
  onNavigate?: () => void
}

/** Entrée riche : icône sur tuile teintée, titre, une ligne de description. */
export const MenuEntry: React.FC<MenuEntryProps> = ({ item, current, onNavigate }) => {
  const Icon = item.icon
  const tint = MARKETING_TINTS[item.tint]
  return (
    <AppLink
      href={item.href}
      onClick={onNavigate}
      aria-current={current ? 'page' : undefined}
      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-surface-soft"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${tint.surface} ${tint.ink}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink group-aria-[current=page]:text-accent">
          {item.label}
        </span>
        <span className="text-sm text-muted">{item.description}</span>
      </span>
    </AppLink>
  )
}

export interface MegaMenuProps {
  group: MenuGroup
  /** URL courante (`usePage().url`). */
  url: string
}

/**
 * Onglet du méga-menu (header ≥ lg) : un bouton qui ouvre un panneau d'entrées riches,
 * au clic ou au clavier (Headless UI `Popover` : Échap, focus rendu au bouton).
 */
export const MegaMenu: React.FC<MegaMenuProps> = ({ group, url }) => {
  const active = group.items.some((item) => isCurrentPath(url, item.href))
  const wide = group.items.length > 3

  return (
    <Popover>
      <PopoverButton
        data-current={active || undefined}
        className="group flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus:outline-none data-current:text-accent data-focus:outline-2 data-focus:outline-accent data-open:text-ink"
      >
        {group.label}
        <ChevronDown
          className="h-4 w-4 transition-transform duration-200 group-data-open:rotate-180"
          aria-hidden="true"
        />
      </PopoverButton>
      <PopoverPanel
        transition
        anchor={{ to: 'bottom', gap: 12 }}
        className={`z-50 rounded-2xl border border-hairline bg-surface p-2 shadow-floating transition duration-200 ease-out data-closed:translate-y-2 data-closed:opacity-0 ${
          wide ? 'w-[40rem]' : 'w-[24rem]'
        }`}
      >
        {({ close }) => (
          <>
            <ul className={`grid gap-1 ${wide ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <MenuEntry
                    item={item}
                    current={isCurrentPath(url, item.href)}
                    onNavigate={() => close()}
                  />
                </li>
              ))}
            </ul>
            {group.cta && (
              <div className="mt-2 rounded-xl bg-surface-soft p-3">
                <AppLink
                  href={group.cta.href}
                  onClick={() => close()}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-pressed"
                >
                  {group.cta.label}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </AppLink>
              </div>
            )}
          </>
        )}
      </PopoverPanel>
    </Popover>
  )
}
