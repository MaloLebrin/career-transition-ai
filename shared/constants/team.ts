/**
 * Équipe et avis présentés sur /qui-sommes-nous (et le bloc « L'équipe » de
 * l'accueil). Une seule source : les profils des psychologues et les témoignages
 * se changent ici.
 *
 * Contenu honnête (DESIGN.md §1) : tant que les textes ci-dessous sont des
 * illustrations, `TEAM_CONTENT_IS_PLACEHOLDER` reste à `true` et une note le dit
 * au visiteur. Le PO remplace les profils et les avis réels (avec l'accord de
 * leurs auteurs), puis passe le drapeau à `false`.
 */

/** Profils et témoignages fictifs tant que les vrais textes ne sont pas fournis. */
export const TEAM_CONTENT_IS_PLACEHOLDER = true

/** Note affichée sous l'équipe et les avis tant que le contenu est une illustration. */
export const TEAM_PLACEHOLDER_NOTICE =
  'Profils et témoignages d’illustration, en cours de rédaction : les profils et les avis réels seront publiés avec l’accord de leurs auteurs.'

export interface TeamMember {
  /** Identifiant stable (clé React, ancre). */
  id: string
  firstName: string
  lastName: string
  /** Fonction affichée (titre protégé : psychologue). */
  title: string
  /** Formation et cadre d'exercice, sans chiffres inventés. */
  credentials: string
  /** Parcours et manière d'accompagner, trois à quatre phrases. */
  bio: string
  /** Domaines d'intervention, en casse de phrase. */
  specialties: string[]
}

/** Les psychologues du travail qui portent les accompagnements. */
export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'claire-morel',
    firstName: 'Claire',
    lastName: 'Morel',
    title: 'Psychologue du travail',
    credentials:
      'Master de psychologie du travail et des organisations, titre protégé, inscrite au répertoire des professionnels de santé.',
    bio: 'Claire a accompagné des salariés en reconversion au sein de cabinets de transition professionnelle avant de rejoindre Transition Carrière. Elle conçoit les exercices du parcours et relit les synthèses des personnes qu’elle accompagne. Son approche part de ce qui compte pour vous, valeurs et motivations, avant de regarder le marché. Elle veille à ce que chaque analyse reste une proposition, jamais un verdict.',
    specialties: ['Bilan de compétences', 'Reconversion professionnelle', 'Valeurs et motivations'],
  },
  {
    id: 'julien-ferrand',
    firstName: 'Julien',
    lastName: 'Ferrand',
    title: 'Psychologue du travail',
    credentials:
      'Master de psychologie du travail, formé à l’orientation tout au long de la vie, titre protégé.',
    bio: 'Julien a exercé en organisme de formation et en entreprise, auprès de personnes qui changeaient de métier après une longue carrière. Il accompagne sur Transition Carrière les candidats qui demandent un suivi après le parcours d’exercices. Il s’attache à relier les résultats à des pistes concrètes : formations, métiers, premiers contacts. Il privilégie les séances courtes et régulières, au rythme de chacun.',
    specialties: ['Projet professionnel', 'Changement de métier', 'Entretiens de suivi'],
  },
]

export interface Testimonial {
  /** Identifiant stable (clé React). */
  id: string
  /** Témoignage, à la première personne. */
  quote: string
  /** Prénom et initiale du nom (« Claire M. ») : jamais d'identité complète. */
  author: string
  /** Situation de la personne au moment du parcours. */
  context: string
}

/** Avis de personnes qui ont fait le parcours. Pas de note chiffrée. */
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'sophie-l',
    quote:
      'Les exercices m’ont obligée à mettre des mots sur ce que je voulais vraiment. La synthèse m’a servi de fil conducteur pour mes entretiens.',
    author: 'Sophie L.',
    context: 'Reconversion après une carrière dans la logistique',
  },
  {
    id: 'karim-b',
    quote:
      'J’avais peur d’un outil qui décide à ma place. L’analyse propose des pistes, et l’échange avec le psychologue a fait le reste.',
    author: 'Karim B.',
    context: 'Changement de métier en milieu de carrière',
  },
  {
    id: 'helene-d',
    quote:
      'Faire le point à mon rythme, le soir, sans rendez-vous imposé : c’est ce qui m’a permis d’aller au bout du parcours.',
    author: 'Hélène D.',
    context: 'Reprise d’activité après une pause familiale',
  },
]
