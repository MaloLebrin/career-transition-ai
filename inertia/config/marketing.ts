import { B2C_PUBLIC_PATHS } from '#shared/constants/b2c'
import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import {
  Building2,
  Compass,
  FlaskConical,
  Gift,
  LayoutGrid,
  Lock,
  Receipt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { MarketingTint } from '~/components/marketing/tints'

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

/** Entrée riche du méga-menu : icône sur tuile teintée, titre, une ligne de description. */
export interface MenuItem extends NavItem {
  description: string
  icon: LucideIcon
  tint: MarketingTint
}

/** Panneau du méga-menu (header desktop), section du menu mobile, colonne du pied de page. */
export interface MenuGroup {
  label: string
  items: MenuItem[]
  /** Appel à l'action en pied de panneau. */
  cta?: ActionItem
}

/** Action principale de l'espace cabinet. */
export const DEMO_ACTION: ActionItem = { label: 'Demander une démo', href: '/cabinets#demo' }

export const INDIVIDUALS_MENU: MenuGroup = {
  label: 'Particuliers',
  items: [
    {
      label: 'Le parcours',
      href: '/#parcours',
      description: 'Huit exercices pour faire le point, à votre rythme.',
      icon: Compass,
      tint: 'lake',
    },
    {
      label: 'Tarif',
      href: '/tarifs',
      description: 'Deux exercices offerts, puis un forfait unique.',
      icon: Gift,
      tint: 'sun',
    },
  ],
}

export const CABINETS_MENU: MenuGroup = {
  label: 'Cabinets',
  items: [
    {
      label: 'Espace cabinet',
      href: '/cabinets',
      description: 'Structurer vos bilans de compétences.',
      icon: Building2,
      tint: 'lavender',
    },
    {
      label: 'Offre',
      href: '/offre',
      description: 'Exercices, synthèse assistée par l’IA, livrables.',
      icon: LayoutGrid,
      tint: 'blossom',
    },
    {
      label: 'Méthodologie',
      href: '/methodologie',
      description: 'Les fondements scientifiques des exercices.',
      icon: FlaskConical,
      tint: 'meadow',
    },
    {
      label: 'Tarifs',
      href: '/cabinets/tarifs',
      description: 'Des formules selon la taille de votre équipe.',
      icon: Receipt,
      tint: 'apricot',
    },
  ],
  cta: DEMO_ACTION,
}

export const RESOURCES_MENU: MenuGroup = {
  label: 'Ressources',
  items: [
    {
      label: 'Qui sommes-nous',
      href: '/qui-sommes-nous',
      description: 'Notre mission et nos engagements.',
      icon: Users,
      tint: 'sky',
    },
    {
      label: 'Sécurité',
      href: '/securite',
      description: 'Hébergement européen, pseudonymisation avant l’IA.',
      icon: ShieldCheck,
      tint: 'lake',
    },
    {
      label: 'Politique de confidentialité',
      href: '/confidentialite',
      description: 'Vos données, vos droits, nos sous-traitants.',
      icon: Lock,
      tint: 'lavender',
    },
  ],
}

/** Méga-menu des pages publiques (header, menu mobile) : le parcours particulier d'abord. */
export const MARKETING_MENU: MenuGroup[] = [INDIVIDUALS_MENU, CABINETS_MENU, RESOURCES_MENU]

/** Méga-menu de l'espace cabinet (`/cabinets`, `/offre`, `/methodologie`, `/cabinets/tarifs`). */
export const CABINET_MENU: MenuGroup[] = [CABINETS_MENU, INDIVIDUALS_MENU, RESOURCES_MENU]

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

/** En-tête des pages cabinet : navigation et action principale propres à ce public. */
export const CABINET_HEADER = { menu: CABINET_MENU, primaryAction: DEMO_ACTION } as const

/** Colonnes du pied de page : les groupes du méga-menu, puis les documents légaux. */
export const FOOTER_COLUMNS: FooterColumn[] = [
  { title: INDIVIDUALS_MENU.label, links: [...INDIVIDUALS_MENU.items, LOGIN_ACTION] },
  { title: CABINETS_MENU.label, links: [...CABINETS_MENU.items, DEMO_ACTION] },
  { title: RESOURCES_MENU.label, links: RESOURCES_MENU.items },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Conditions d’utilisation', href: '/cgu' },
      { label: 'Conditions de vente', href: '/cgv' },
    ],
  },
]

export const CONTACT_EMAIL = PRIVACY_CONTACT_EMAIL
export const COPYRIGHT = '© 2026 Transition Carrière'
export const FOOTER_TAGLINE =
  'Faites le point sur votre carrière à votre rythme : des exercices issus des sciences comportementales, une analyse assistée par l’IA, un expert si vous le souhaitez. Aussi pour les cabinets de transition professionnelle.'
