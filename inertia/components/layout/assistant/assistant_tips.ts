import type { CompanionPose } from '~/components/ui/companion/types'
import { FREE_WORD } from '~/components/marketing/individuals/copy'
import { DEMO_ACTION, JOURNEY_PATH } from '~/config/marketing'

/**
 * Conseils du compagnon-assistant des pages publiques : un par page, écrits à l'avance
 * (aucune IA), au vouvoiement, sans chiffre qui ne soit pas déjà sur le site.
 */
export interface AssistantTip {
  title: string
  text: string
  link?: { label: string; href: string }
  /** Posture du compagnon (DESIGN.md § Companion) ; `wave` par défaut. */
  pose?: CompanionPose
}

const CABINET_TIP: AssistantTip = {
  title: 'Vous accompagnez des candidats ?',
  text: 'Une démo vous montre le parcours côté conseiller : exercices, synthèse assistée par l’IA et livrables.',
  link: { label: DEMO_ACTION.label, href: DEMO_ACTION.href },
  pose: 'think',
}

const PRIVACY_TIP: AssistantTip = {
  title: 'Vos données sont protégées',
  text: 'Votre nom et votre e-mail ne sont jamais transmis à l’IA. Vous pouvez exporter ou effacer vos données depuis votre profil.',
  pose: 'guard',
}

const LEGAL_TIP: AssistantTip = {
  title: 'Une question sur ces conditions ?',
  text: 'Écrivez-nous, nous vous répondons.',
  link: { label: 'Nous contacter', href: '/contact' },
  pose: 'think',
}

const TIPS: Record<string, AssistantTip> = {
  '/': {
    title: 'Par où commencer ?',
    text: `Commencez par les ${FREE_WORD} exercices offerts : vos résultats s’affichent tout de suite.`,
    link: { label: 'Voir le parcours', href: JOURNEY_PATH },
  },
  [JOURNEY_PATH]: {
    title: 'À votre rythme',
    text: 'Pas besoin de tout faire d’un coup : chaque exercice est sauvegardé, vous reprenez où vous vous êtes arrêté.',
    link: { label: 'Voir le tarif', href: '/tarifs' },
  },
  '/tarifs': {
    title: 'Sans abonnement',
    text: 'Le forfait se paie une seule fois. Les exercices offerts restent acquis, que vous débloquiez la suite ou non.',
    link: { label: 'Lire les conditions de vente', href: '/cgv' },
    pose: 'guard',
  },
  '/qui-sommes-nous': {
    title: 'Besoin d’en parler ?',
    text: 'Une fois le forfait réglé, vous pouvez demander l’accompagnement d’un expert depuis votre espace.',
    link: { label: 'Voir le tarif', href: '/tarifs' },
  },
  '/contact': {
    title: 'On vous répond',
    text: 'Nous répondons sous 48 h ouvrées.',
    pose: 'cheer',
  },
  '/securite': PRIVACY_TIP,
  '/confidentialite': PRIVACY_TIP,
  '/cabinets': CABINET_TIP,
  '/cabinets/tarifs': CABINET_TIP,
  '/offre': CABINET_TIP,
  '/methodologie': CABINET_TIP,
  '/mentions-legales': LEGAL_TIP,
  '/cgu': LEGAL_TIP,
  '/cgv': LEGAL_TIP,
}

const FALLBACK_TIP: AssistantTip = {
  title: 'Je suis là pour vous guider',
  text: 'Faites le point sur votre carrière à votre rythme, en commençant par les exercices offerts.',
  link: { label: 'Voir le parcours', href: JOURNEY_PATH },
}

/** Chemin sans requête ni ancre ni barre finale (`/tarifs?x#y` → `/tarifs`). */
export function normalizePath(url: string): string {
  const path = url.split(/[?#]/)[0] || '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

/** Le conseil de la page `url`, ou le conseil général. */
export function tipFor(url: string): AssistantTip {
  return TIPS[normalizePath(url)] ?? FALLBACK_TIP
}

/** Sur ces pages, un compagnon est déjà dans le héros : l'assistant attend qu'il sorte de l'écran. */
export const PAGES_WITH_HERO_COMPANION: readonly string[] = ['/']
