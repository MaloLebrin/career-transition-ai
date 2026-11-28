export type SchwartzValue = {
  id: string
  label: string
  /** Définition courte et explicite, affichée au choix et au survol des résultats. */
  definition: string
  /** Mots-clés de la valeur (Schwartz). */
  desc: string
  /** Portrait d’une personne pour qui cette valeur compte. */
  portrait: string
  /** Situation de travail où cette valeur l’emporte. */
  situation: string
}

export const SCHWARTZ_VALUES: SchwartzValue[] = [
  {
    id: 'uni',
    label: "L'universalisme",
    definition: 'Agir pour la justice, l’égalité et le bien de tous, au-delà de son entourage.',
    desc: "Largeur d'esprit, sensibilité à la justice sociale et à l'égalité.",
    portrait: 'Quelqu’un qui défend l’équité et le bien commun, au-delà de son cercle proche.',
    situation:
      'Un projet augmente les marges mais exclut une équipe ou un public fragile : la personne refuse et cherche une option plus juste.',
  },
  {
    id: 'bien',
    label: 'La bienveillance',
    definition: 'Prendre soin des personnes proches et être quelqu’un sur qui l’on peut compter.',
    desc: 'Altruisme, loyauté, honnêteté, responsabilité.',
    portrait: 'Quelqu’un qui prend soin des autres et tient ses engagements envers son équipe.',
    situation:
      'Un collègue est en difficulté avant une échéance : la personne met son propre dossier en pause pour l’aider à tenir le délai.',
  },
  {
    id: 'conf',
    label: 'La conformité',
    definition: 'Respecter les règles et les attentes des autres, et se tenir à ses engagements.',
    desc: 'Obéissance, autodiscipline, politesse.',
    portrait: 'Quelqu’un qui respecte les règles et attend le même sérieux de son entourage.',
    situation:
      'Une pratique « informalise » le process pour aller plus vite : la personne insiste pour suivre la procédure, même si cela ralentit.',
  },
  {
    id: 'trad',
    label: 'La tradition',
    definition: 'S’appuyer sur les usages, l’héritage et ce qui a fait ses preuves.',
    desc: 'Respect de la tradition, humilité.',
    portrait:
      'Quelqu’un qui s’appuie sur l’héritage, les usages et ce qui a déjà fait ses preuves.',
    situation:
      'On propose de tout réinventer : la personne défend de conserver les rituels et méthodes qui structurent l’équipe.',
  },
  {
    id: 'secu',
    label: 'La sécurité',
    definition:
      'Chercher la stabilité, la prévisibilité et la protection, pour soi et ses proches.',
    desc: 'Ordre social, sécurité familiale.',
    portrait: 'Quelqu’un qui privilégie la stabilité, la prévisibilité et la protection du foyer.',
    situation:
      'Une offre mieux payée mais précaire arrive : la personne choisit le poste durable, même avec moins de perspective.',
  },
  {
    id: 'pouv',
    label: 'Le pouvoir',
    definition: 'Avoir de l’influence, de l’autorité et du poids dans les décisions.',
    desc: 'Importance sociale, richesse, autorité.',
    portrait: 'Quelqu’un qui veut influencer, décider et compter dans l’organisation.',
    situation:
      'Deux missions s’offrent : une expertise technique ou un rôle de direction. La personne prend le poste avec autorité et visibilité.',
  },
  {
    id: 'real',
    label: 'La réalisation',
    definition: 'Réussir, être reconnu pour ses compétences et atteindre ses objectifs.',
    desc: 'Ambition personnelle, succès, compétence.',
    portrait:
      'Quelqu’un qui vise l’excellence, les objectifs ambitieux et la reconnaissance du résultat.',
    situation:
      'Un défi difficile s’ouvre avec un risque d’échec public : la personne le prend pour prouver sa compétence et avancer.',
  },
  {
    id: 'hedo',
    label: "L'hédonisme",
    definition: 'Prendre du plaisir et profiter de la vie, au travail comme ailleurs.',
    desc: 'Attrait vers les plaisirs de la vie.',
    portrait: 'Quelqu’un qui cherche le plaisir, le confort et la joie au quotidien.',
    situation:
      'Un poste prestigieux impose des soirées et week-ends chargés : la personne préfère un rôle plus léger qui laisse place au plaisir.',
  },
  {
    id: 'stim',
    label: 'La stimulation',
    definition: 'Vivre de la nouveauté, des défis et de la variété, loin de la routine.',
    desc: "Curiosité, goût pour l'aventure.",
    portrait: 'Quelqu’un qui a besoin de nouveauté, de défis et de sortir de la routine.',
    situation:
      'Le poste est stable mais répétitif : la personne change pour un environnement plus imprévisible, même moins confortable.',
  },
  {
    id: 'auto',
    label: "L'autonomie",
    definition: 'Penser et agir librement, choisir sa façon de faire.',
    desc: 'Créativité, liberté, indépendance.',
    portrait: 'Quelqu’un qui veut choisir sa façon de faire et garder sa liberté de décision.',
    situation:
      'Un cahier des charges très cadré est imposé : la personne négocie la méthode, quitte à rendre un résultat moins standard.',
  },
]

export function valueDefinition(label: string): string | undefined {
  return SCHWARTZ_VALUES.find((v) => v.label === label)?.definition
}
