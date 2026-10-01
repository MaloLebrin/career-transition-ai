import { usePage } from '@inertiajs/react'
import { Menu } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import {
  DEMO_ACTION,
  HOME_ACTION,
  LOGIN_ACTION,
  MARKETING_NAV,
  type ActionItem,
  type NavItem,
} from '~/config/marketing'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Container } from '~/components/ui/Container'
import { Logo } from '~/components/ui/Logo'
import { MobileMenu } from './MobileMenu'

export interface PublicHeaderProps {
  /** Liens de navigation (défaut : `MARKETING_NAV`). */
  nav?: NavItem[]
  /** Action principale (défaut : demander une démo) ; `null` pour la masquer. */
  primaryAction?: ActionItem | null
  /** Action secondaire (défaut : se connecter) ; `null` pour la masquer. */
  secondaryAction?: ActionItem | null
  /** En-tête réduit (auth, onboarding) : logo + retour à l'accueil, sans menu. */
  minimal?: boolean
}

function isCurrent(url: string, href: string): boolean {
  const path = url.split(/[?#]/)[0]
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

const NAV_LINK_CLASS =
  'text-sm font-medium text-ink-soft hover:text-ink transition-colors aria-[current=page]:text-primary'

const PublicHeader: React.FC<PublicHeaderProps> = ({
  nav = MARKETING_NAV,
  primaryAction = DEMO_ACTION,
  secondaryAction = LOGIN_ACTION,
  minimal = false,
}) => {
  const { url } = usePage()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
      <Container
        as="nav"
        aria-label="Navigation principale"
        className="flex h-16 items-center justify-between gap-6"
      >
        <AppLink href="/" className="shrink-0" aria-label="Accueil">
          <Logo size="md" />
        </AppLink>

        {minimal ? (
          <AppLink href={HOME_ACTION.href} className={NAV_LINK_CLASS}>
            {HOME_ACTION.label}
          </AppLink>
        ) : (
          <>
            <ul className="hidden items-center gap-8 md:flex">
              {nav.map((item) => (
                <li key={item.href}>
                  <AppLink
                    href={item.href}
                    className={NAV_LINK_CLASS}
                    aria-current={isCurrent(url, item.href) ? 'page' : undefined}
                  >
                    {item.label}
                  </AppLink>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-3 md:flex">
              {secondaryAction && (
                <AppLink
                  href={secondaryAction.href}
                  className={buttonClassName({ variant: 'outline', size: 'sm' })}
                >
                  {secondaryAction.label}
                </AppLink>
              )}
              {primaryAction && (
                <AppLink
                  href={primaryAction.href}
                  className={buttonClassName({ variant: 'primary', size: 'sm' })}
                >
                  {primaryAction.label}
                </AppLink>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-ink md:hidden cursor-pointer"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <MobileMenu
              open={menuOpen}
              onClose={closeMenu}
              items={nav}
              primaryAction={primaryAction}
              secondaryAction={secondaryAction}
            />
          </>
        )}
      </Container>
    </header>
  )
}

export default PublicHeader
