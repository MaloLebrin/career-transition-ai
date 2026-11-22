/**
 * L'équipe affichée sur `/qui-sommes-nous` (brief jumpUjob, planche 50). Textes du brief,
 * passés au vouvoiement (décision du 22 novembre 2026 : le site garde le « vous »).
 * À confirmer par Clara et Malo : noms de famille, intitulés exacts, rôle d'« expert » des séances payantes.
 * Photos à venir : `photoUrl` reste `null`, le galet prend la couleur de secours.
 */
export interface TeamMember {
  name: string
  role: string
  bio: string
  tags: string[]
  photoUrl: string | null
  /** Classes littérales (détectées par Tailwind) : fond du galet, pastille de l'initiale. */
  fallbackClassName: string
  badgeClassName: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Clara',
    role: 'Psychologue du travail · conseil RH depuis dix ans',
    bio: 'Dix ans en cabinet de conseil : bilans de compétences, outplacement, coaching individuel, recrutement de cadres et de dirigeants. Clara a conçu le parcours jumpUjob à partir des exercices qu’elle utilise avec les personnes qu’elle accompagne. C’est elle, l’expert à qui vous pouvez parler.',
    tags: ['Bilan de compétences', 'Outplacement', 'Recrutement', 'Coaching'],
    photoUrl: null,
    fallbackClassName: 'fill-sun',
    badgeClassName: 'bg-tint-sun-ink',
  },
  {
    name: 'Malo',
    role: 'Psychologue du travail de formation · développeur web',
    bio: 'Psychologue du travail à l’origine, devenu développeur web. Malo a construit la plateforme : les exercices, l’analyse assistée par l’IA, la synthèse. Et la pseudonymisation de vos réponses avant toute analyse, parce qu’un bilan de carrière touche à l’intime.',
    tags: ['Produit', 'Analyse IA', 'Données protégées'],
    photoUrl: null,
    fallbackClassName: 'fill-tint-lake',
    badgeClassName: 'bg-tint-lake-ink',
  },
]

export const WHY_THE_NAME =
  'Jump, you, job. Le U au milieu, c’est vous : vous êtes au centre, pas le poste ni le cabinet. Le galet, c’est ce qu’on vous aide à devenir : quelque chose de solide, poli par le temps, qui rebondit. Et le plongeoir, c’est le parcours. Le saut, oui. Le vide, non.'
