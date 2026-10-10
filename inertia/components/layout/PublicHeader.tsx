import { usePage } from '@inertiajs/react'
import { PopoverGroup } from '@headlessui/react'
import { Menu } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import {
  HOME_ACTION,
  LOGIN_ACTION,
  MARKETING_MENU,
  REGISTER_ACTION,
  WAITLIST_ACTION,
  type ActionItem,
  type MenuGroup,
} from '~/config/marketing'
import { useScrolled } from '~/hooks/use_scrolled'
import AppLink from '~/components/ui/AppLink'
import { buttonClassName } from '~/components/ui/Button'
import { Container } from '~/components/ui/Container'
import { Logo } from '~/components/ui/Logo'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'

export interface PublicHeaderProps {
  /** Groupes du méga-menu (défaut : `MARKETING_MENU`). */
  menu?: MenuGroup[]
  /**
   * Action principale ; `null` pour la masquer. Par défaut : « Commencer gratuitement »
   * quand l'inscription des particuliers est ouverte, « Être prévenu de l'ouverture » sinon.
   */
  primaryAction?: ActionItem | null
  /** Action secondaire (défaut : se connecter) ; `null` pour la masquer. */
  secondaryAction?: ActionItem | null
  /** En-tête réduit (auth, onboarding) : logo + retour à l'accueil, sans menu. */
  minimal?: boolean
}

const NAV_LINK_CLASS = 'text-sm font-medium text-ink-soft hover:text-ink transition-colors'

const PublicHeader: React.FC<PublicHeaderProps> = ({
  menu = MARKETING_MENU,
  primaryAction,
  secondaryAction = LOGIN_ACTION,
  minimal = false,
}) => {
  const { url, props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const mainAction =
    primaryAction === undefined
      ? props.b2cRegistrationEnabled
        ? REGISTER_ACTION
        : WAITLIST_ACTION
      : primaryAction
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const scrolled = useScrolled()

  return (
    <header
      data-scrolled={scrolled}
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled
          ? 'border-hairline bg-canvas/90 backdrop-blur'
          : 'border-transparent bg-transparent'
      }`}
    >
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
            <PopoverGroup className="hidden items-center gap-1 lg:flex">
              {menu.map((group) => (
                <MegaMenu key={group.label} group={group} url={url} />
              ))}
            </PopoverGroup>

            <div className="hidden items-center gap-3 lg:flex">
              {secondaryAction && (
                <AppLink
                  href={secondaryAction.href}
                  className={buttonClassName({ variant: 'outline', size: 'sm' })}
                >
                  {secondaryAction.label}
                </AppLink>
              )}
              {mainAction && (
                <AppLink
                  href={mainAction.href}
                  className={buttonClassName({ variant: 'primary', size: 'sm' })}
                >
                  {mainAction.label}
                </AppLink>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-ink-soft hover:bg-surface-soft hover:text-ink lg:hidden cursor-pointer"
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <MobileMenu
              open={menuOpen}
              onClose={closeMenu}
              groups={menu}
              url={url}
              primaryAction={mainAction}
              secondaryAction={secondaryAction}
            />
          </>
        )}
      </Container>
    </header>
  )
}

export default PublicHeader
