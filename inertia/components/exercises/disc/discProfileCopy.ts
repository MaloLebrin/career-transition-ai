import type { DiscTrait } from './discQuestionnaire'

export type DiscProfileSection = {
  title: string
  bullets: string[]
}

export type DiscProfileCopy = {
  title: string
  subtitle: string
  strengths: DiscProfileSection
  watchouts: DiscProfileSection
  prefers: DiscProfileSection
  underStress: DiscProfileSection
}

export const DISC_PROFILE_COPY: Record<DiscTrait, DiscProfileCopy> = {
  D: {
    title: 'Dominant (Rouge)',
    subtitle: 'Direct, orienté résultats, aime décider et avancer vite.',
    strengths: {
      title: 'Forces',
      bullets: ['Décide rapidement', 'Assume la responsabilité', 'Orienté action et résultats'],
    },
    watchouts: {
      title: 'Points de vigilance',
      bullets: ['Peut paraître brusque', 'Tolère mal la lenteur', 'Risque de minimiser les détails'],
    },
    prefers: {
      title: 'Communication préférée',
      bullets: ['Aller à l’essentiel', 'Parler objectifs, délais, impact', 'Proposer des options claires'],
    },
    underStress: {
      title: 'Sous stress',
      bullets: ['Se durcit / devient plus directif', 'Peut couper court aux échanges', 'Veut reprendre le contrôle'],
    },
  },
  I: {
    title: 'Influent (Jaune)',
    subtitle: 'Expressif, relationnel, enthousiaste, aime mobiliser et inspirer.',
    strengths: {
      title: 'Forces',
      bullets: ['Crée du lien', 'Donne de l’énergie au collectif', 'Influence par l’optimisme'],
    },
    watchouts: {
      title: 'Points de vigilance',
      bullets: ['Peut se disperser', 'Peut minimiser les risques', 'A besoin de reconnaissance'],
    },
    prefers: {
      title: 'Communication préférée',
      bullets: ['Échanger à l’oral', 'Partager la vision/le sens', 'Reconnaître les efforts'],
    },
    underStress: {
      title: 'Sous stress',
      bullets: ['Parle davantage pour convaincre', 'Peut éviter les sujets “froids”', 'Cherche du soutien social'],
    },
  },
  S: {
    title: 'Stable (Vert)',
    subtitle: 'Calme, fiable, coopératif, aime la stabilité et la cohésion.',
    strengths: {
      title: 'Forces',
      bullets: ['Fiable et constant', 'Bon soutien d’équipe', 'Patience et écoute'],
    },
    watchouts: {
      title: 'Points de vigilance',
      bullets: ['Peut éviter le conflit', 'S’adapte lentement aux changements', 'Risque de s’effacer'],
    },
    prefers: {
      title: 'Communication préférée',
      bullets: ['Un ton posé et respectueux', 'Du temps pour réfléchir', 'De la clarté sur l’accompagnement'],
    },
    underStress: {
      title: 'Sous stress',
      bullets: ['Se replie / se protège', 'Cherche à préserver l’harmonie', 'Peut résister passivement au changement'],
    },
  },
  C: {
    title: 'Consciencieux (Bleu)',
    subtitle: 'Analytique, rigoureux, recherche la précision et la qualité.',
    strengths: {
      title: 'Forces',
      bullets: ['Analyse et structure', 'Exigeant sur la qualité', 'Fiabilise les décisions'],
    },
    watchouts: {
      title: 'Points de vigilance',
      bullets: ['Peut sur-analyser', 'Peut paraître critique', 'Tolère mal l’approximation'],
    },
    prefers: {
      title: 'Communication préférée',
      bullets: ['Données et faits', 'Écrit et documentation', 'Critères explicites de décision'],
    },
    underStress: {
      title: 'Sous stress',
      bullets: ['Se rigidifie sur les règles', 'Cherche des preuves avant d’agir', 'Peut ralentir pour “sécuriser”'],
    },
  },
}

