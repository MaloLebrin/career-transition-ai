export type Motivation = {
  /** Libellé enregistré dans les résultats (`ranked`, `scores`) : ne jamais le modifier. */
  label: string
  /** Définition courte affichée pendant le duel et au survol des résultats. */
  definition: string
}

/** L'ordre sert d'index à la matrice de comparaison : ne jamais le changer. */
export const MOTIVATIONS: Motivation[] = [
  {
    label: 'La rémunération',
    definition: 'Le niveau de salaire et d’avantages que le poste vous apporte.',
  },
  {
    label: 'La qualité de vie',
    definition: 'L’équilibre entre votre vie professionnelle et votre vie personnelle.',
  },
  {
    label: 'Le développement personnel',
    definition: 'Grandir en tant que personne grâce à votre travail.',
  },
  {
    label: 'Les conditions de travail',
    definition: 'Le cadre concret du poste : locaux, horaires, outils, ambiance.',
  },
  {
    label: 'Le statut social',
    definition: 'L’image et le prestige que votre poste vous donne aux yeux des autres.',
  },
  {
    label: "La pérennité de l'entreprise",
    definition: 'Travailler dans une structure solide, qui durera dans le temps.',
  },
  {
    label: 'La reconnaissance',
    definition: 'Voir votre travail remarqué et valorisé par les autres.',
  },
  {
    label: "La possibilité d'évoluer professionnellement",
    definition: 'Progresser vers des postes de plus haut niveau.',
  },
  {
    label: 'La possibilité de développer une expertise',
    definition: 'Devenir une référence dans un domaine pointu.',
  },
  {
    label: 'La prise de responsabilités',
    definition: 'Porter des missions, des équipes ou des budgets importants.',
  },
  {
    label: "L'autonomie",
    definition: 'Organiser votre travail et décider vous-même de la façon de faire.',
  },
  {
    label: 'Le contenu du poste',
    definition: 'L’intérêt des missions et des tâches que vous faites au quotidien.',
  },
  {
    label: "Le sentiment d'accomplissement",
    definition: 'La satisfaction d’avoir mené un travail à son terme, et bien.',
  },
  {
    label: 'La satisfaction de transmettre des connaissances',
    definition: 'Former, accompagner et partager votre savoir avec d’autres.',
  },
  {
    label: 'Le partage des valeurs',
    definition: 'Être en accord avec ce que défend votre employeur.',
  },
  {
    label: 'Atteindre des objectifs ambitieux',
    definition: 'Vous dépasser pour atteindre des résultats exigeants.',
  },
  {
    label: 'Développer de nouvelles compétences',
    definition: 'Apprendre en continu des choses nouvelles.',
  },
  {
    label: 'La complexité des tâches à réaliser',
    definition: 'Résoudre des problèmes difficiles qui demandent de la réflexion.',
  },
  {
    label: 'La hauteur des enjeux stratégiques',
    definition: 'Travailler sur des sujets qui pèsent sur l’avenir de l’organisation.',
  },
  {
    label: "S'exposer, prendre des risques",
    definition: 'Accepter l’incertitude et le regard des autres pour oser des choses.',
  },
  {
    label: "Le sentiment d'utilité sociale",
    definition: 'Sentir que votre travail sert la société ou les autres.',
  },
  {
    label: 'Prendre des décisions',
    definition: 'Être la personne qui tranche et fait les choix.',
  },
]

export const MOTIVATIONS_LIST: string[] = MOTIVATIONS.map((m) => m.label)

export function motivationDefinition(label: string): string | undefined {
  return MOTIVATIONS.find((m) => m.label === label)?.definition
}
