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

/** Navigation principale des pages publiques (header, menu mobile). */
export const MARKETING_NAV: NavItem[] = [
  { label: 'Offre', href: '/offre' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Méthodologie', href: '/methodologie' },
]

export const LOGIN_ACTION: ActionItem = { label: 'Se connecter', href: '/auth/login' }
export const DEMO_ACTION: ActionItem = { label: 'Demander une démo', href: '/#demo' }
export const HOME_ACTION: ActionItem = { label: "Retour à l'accueil", href: '/' }

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Produit',
    links: [...MARKETING_NAV, { label: 'Sécurité', href: '/securite' }, LOGIN_ACTION],
  },
  {
    title: 'Légal',
    links: [
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
  'Logiciel de bilan de compétences et de transition professionnelle pour les cabinets. Une méthode structurée, une IA copilote, le conseiller décide.'
