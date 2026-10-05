import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'

export interface NavItem {
  label: string
  href: string
}

export interface ActionItem {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: NavItem[]
}

/** Navigation principale des pages publiques (header, menu mobile) : le parcours particulier. */
export const MARKETING_NAV: NavItem[] = [
  { label: 'Le parcours', href: '/#parcours' },
  { label: 'Tarif', href: '/tarifs' },
  { label: 'Cabinets', href: '/cabinets' },
  { label: 'Qui sommes-nous', href: '/qui-sommes-nous' },
]

/** Navigation de l'espace cabinet (`/cabinets`, `/offre`, `/methodologie`, `/cabinets/tarifs`). */
export const CABINET_NAV: NavItem[] = [
  { label: 'Offre', href: '/offre' },
  { label: 'Tarifs', href: '/cabinets/tarifs' },
  { label: 'Méthodologie', href: '/methodologie' },
  { label: 'Particuliers', href: '/' },
]

/** Entrée de l'espace cabinet depuis le parcours particulier. */
export const CABINETS_ACTION: ActionItem = { label: 'Vous êtes un cabinet ?', href: '/cabinets' }

/** Retour au parcours particulier depuis l'espace cabinet (accueil, épic B2C #99). */
export const INDIVIDUALS_ACTION: ActionItem = { label: 'Vous êtes un particulier ?', href: '/' }

export const LOGIN_ACTION: ActionItem = { label: 'Se connecter', href: '/auth/login' }
export const HOME_ACTION: ActionItem = { label: "Retour à l'accueil", href: '/' }

/** Action principale du parcours particulier, selon `b2cRegistrationEnabled`. */
export const REGISTER_ACTION: ActionItem = {
  label: 'Commencer gratuitement',
  href: B2C_PUBLIC_PATHS.register,
}
export const WAITLIST_ACTION: ActionItem = {
  label: 'Être prévenu de l’ouverture',
  href: '/#contact',
}

/** Action principale de l'espace cabinet. */
export const DEMO_ACTION: ActionItem = { label: 'Demander une démo', href: '/cabinets#demo' }

/** En-tête des pages cabinet : navigation et action principale propres à ce public. */
export const CABINET_HEADER = { nav: CABINET_NAV, primaryAction: DEMO_ACTION } as const

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Particuliers',
    links: [...MARKETING_NAV.filter((item) => item.href !== '/cabinets'), LOGIN_ACTION],
  },
  {
    title: 'Cabinets',
    links: [{ label: 'Espace cabinet', href: '/cabinets' }, ...CABINET_NAV.slice(0, 3)],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Sécurité', href: '/securite' },
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
      { label: 'Conditions d’utilisation', href: '/cgu' },
      { label: 'Conditions de vente', href: '/cgv' },
    ],
  },
]

export const CONTACT_EMAIL = PRIVACY_CONTACT_EMAIL
export const COPYRIGHT = '© 2026 Transition Carrière'
export const FOOTER_TAGLINE =
  'Faites le point sur votre carrière à votre rythme : des exercices issus des sciences comportementales, une analyse assistée par l’IA, un expert si vous le souhaitez. Aussi pour les cabinets de transition professionnelle.'
