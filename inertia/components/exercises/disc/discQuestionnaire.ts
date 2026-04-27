export type DiscTrait = 'D' | 'I' | 'S' | 'C'

export type DiscChoice = {
  label: string
  trait: DiscTrait
}

export type DiscBlock = {
  id: number
  /** 4 propositions, une par trait. */
  choices: [DiscChoice, DiscChoice, DiscChoice, DiscChoice]
}

/**
 * Questionnaire DISC (items originaux).
 *
 * Format: forced-choice par bloc, 4 propositions D/I/S/C, l’utilisateur choisit:
 * - celui qui lui ressemble LE PLUS
 * - celui qui lui ressemble LE MOINS
 *
 * Note: on s’aligne sur le modèle DISC (couleurs/axes) sans recopier un questionnaire propriétaire.
 */
export const DISC_BLOCKS: DiscBlock[] = [
  {
    id: 1,
    choices: [
      { trait: 'D', label: 'Je prends facilement les devants et j’aime décider.' },
      { trait: 'I', label: 'Je mets de l’énergie à embarquer les autres avec moi.' },
      { trait: 'S', label: 'Je cherche à créer un climat serein et stable.' },
      { trait: 'C', label: 'Je préfère analyser avant d’agir et vérifier les détails.' },
    ],
  },
  {
    id: 2,
    choices: [
      { trait: 'D', label: 'Je vais droit au but, même si cela peut bousculer.' },
      { trait: 'I', label: 'Je communique spontanément et avec enthousiasme.' },
      { trait: 'S', label: 'Je suis constant(e) et je privilégie la continuité.' },
      { trait: 'C', label: 'Je m’appuie sur des faits et une logique structurée.' },
    ],
  },
  {
    id: 3,
    choices: [
      { trait: 'D', label: 'Je suis à l’aise avec la confrontation si c’est nécessaire.' },
      { trait: 'I', label: 'J’aime convaincre par le relationnel et l’optimisme.' },
      { trait: 'S', label: 'Je prends le temps d’écouter et de soutenir.' },
      { trait: 'C', label: 'Je questionne pour comprendre précisément le problème.' },
    ],
  },
  {
    id: 4,
    choices: [
      { trait: 'D', label: 'J’avance vite et je préfère l’action aux discussions.' },
      { trait: 'I', label: 'Je suis stimulé(e) par les échanges et la nouveauté.' },
      { trait: 'S', label: 'Je suis patient(e) et je garde un rythme régulier.' },
      { trait: 'C', label: 'Je suis attentif(ve) aux risques et aux contraintes.' },
    ],
  },
  {
    id: 5,
    choices: [
      { trait: 'D', label: 'Je fixe des objectifs ambitieux et j’attends des résultats.' },
      { trait: 'I', label: 'Je valorise l’ambiance et la reconnaissance.' },
      { trait: 'S', label: 'Je privilégie la coopération et la fiabilité.' },
      { trait: 'C', label: 'Je recherche la qualité et la précision du travail.' },
    ],
  },
  {
    id: 6,
    choices: [
      { trait: 'D', label: 'Sous pression, je deviens plus directif(ve).' },
      { trait: 'I', label: 'Sous pression, je parle davantage pour mobiliser.' },
      { trait: 'S', label: 'Sous pression, je cherche à apaiser et à protéger l’équipe.' },
      { trait: 'C', label: 'Sous pression, je m’accroche aux règles et aux preuves.' },
    ],
  },
  {
    id: 7,
    choices: [
      { trait: 'D', label: 'Je tranche rapidement quand une décision est bloquée.' },
      { trait: 'I', label: 'Je propose des idées et je fais bouger les lignes.' },
      { trait: 'S', label: 'Je facilite l’accord et le compromis.' },
      { trait: 'C', label: 'Je clarifie les critères avant de choisir.' },
    ],
  },
  {
    id: 8,
    choices: [
      { trait: 'D', label: 'Je suis motivé(e) par les défis et la compétition.' },
      { trait: 'I', label: 'Je suis motivé(e) par les interactions et l’influence.' },
      { trait: 'S', label: 'Je suis motivé(e) par la sécurité et l’harmonie.' },
      { trait: 'C', label: 'Je suis motivé(e) par l’expertise et la maîtrise.' },
    ],
  },
  {
    id: 9,
    choices: [
      { trait: 'D', label: 'Dans une réunion, je veux des décisions et un plan.' },
      { trait: 'I', label: 'Dans une réunion, j’aime l’échange et l’adhésion.' },
      { trait: 'S', label: 'Dans une réunion, je veille à ce que chacun soit entendu.' },
      { trait: 'C', label: 'Dans une réunion, je veux des données et des points clairs.' },
    ],
  },
  {
    id: 10,
    choices: [
      { trait: 'D', label: 'Je préfère une communication concise et orientée action.' },
      { trait: 'I', label: 'Je préfère une communication chaleureuse et expressive.' },
      { trait: 'S', label: 'Je préfère une communication posée et respectueuse.' },
      { trait: 'C', label: 'Je préfère une communication écrite, précise et complète.' },
    ],
  },
  {
    id: 11,
    choices: [
      { trait: 'D', label: 'Je supporte mal la lenteur quand l’urgence est là.' },
      { trait: 'I', label: 'Je supporte mal la froideur ou le manque d’enthousiasme.' },
      { trait: 'S', label: 'Je supporte mal les changements brusques non expliqués.' },
      { trait: 'C', label: 'Je supporte mal l’improvisation sans méthode.' },
    ],
  },
  {
    id: 12,
    choices: [
      { trait: 'D', label: 'Quand ça déraille, je cherche la cause et je corrige vite.' },
      { trait: 'I', label: 'Quand ça déraille, je remobilise et je redonne confiance.' },
      { trait: 'S', label: 'Quand ça déraille, je protège la relation et la cohésion.' },
      { trait: 'C', label: 'Quand ça déraille, je reviens au process et aux preuves.' },
    ],
  },
  {
    id: 13,
    choices: [
      { trait: 'D', label: 'Je préfère gérer plusieurs sujets en parallèle pour aller vite.' },
      { trait: 'I', label: 'Je préfère varier les tâches pour garder l’énergie.' },
      { trait: 'S', label: 'Je préfère avancer étape par étape, sans précipitation.' },
      { trait: 'C', label: 'Je préfère terminer proprement avant de commencer autre chose.' },
    ],
  },
  {
    id: 14,
    choices: [
      { trait: 'D', label: 'Je donne un feedback franc et orienté amélioration.' },
      { trait: 'I', label: 'Je donne un feedback encourageant et motivant.' },
      { trait: 'S', label: 'Je donne un feedback avec tact pour préserver la confiance.' },
      { trait: 'C', label: 'Je donne un feedback factuel, avec exemples précis.' },
    ],
  },
  {
    id: 15,
    choices: [
      { trait: 'D', label: 'Je préfère négocier fermement pour obtenir un accord rapide.' },
      { trait: 'I', label: 'Je préfère négocier en créant une relation positive.' },
      { trait: 'S', label: 'Je préfère négocier en cherchant un terrain d’entente durable.' },
      { trait: 'C', label: 'Je préfère négocier avec des critères et des points écrits.' },
    ],
  },
  {
    id: 16,
    choices: [
      { trait: 'D', label: 'Je mesure ma réussite aux résultats visibles.' },
      { trait: 'I', label: 'Je mesure ma réussite à l’impact et à l’adhésion.' },
      { trait: 'S', label: 'Je mesure ma réussite à la stabilité et à la confiance.' },
      { trait: 'C', label: 'Je mesure ma réussite à la qualité et à la conformité.' },
    ],
  },
  {
    id: 17,
    choices: [
      { trait: 'D', label: 'Je prends des risques si le gain potentiel est important.' },
      { trait: 'I', label: 'Je suis à l’aise avec l’incertitude si l’aventure est stimulante.' },
      { trait: 'S', label: 'Je limite les risques pour assurer la continuité.' },
      { trait: 'C', label: 'Je minimise les risques en évaluant systématiquement.' },
    ],
  },
  {
    id: 18,
    choices: [
      { trait: 'D', label: 'Je préfère un environnement rapide, exigeant, compétitif.' },
      { trait: 'I', label: 'Je préfère un environnement vivant, social, inspirant.' },
      { trait: 'S', label: 'Je préfère un environnement prévisible, bienveillant, stable.' },
      { trait: 'C', label: 'Je préfère un environnement structuré, rigoureux, clair.' },
    ],
  },
  {
    id: 19,
    choices: [
      { trait: 'D', label: 'Quand je délègue, je fixe le résultat et j’attends l’autonomie.' },
      { trait: 'I', label: 'Quand je délègue, je donne envie et je clarifie la vision.' },
      { trait: 'S', label: 'Quand je délègue, je sécurise et je reste disponible.' },
      { trait: 'C', label: 'Quand je délègue, je précise les standards et les étapes.' },
    ],
  },
  {
    id: 20,
    choices: [
      { trait: 'D', label: 'Je suis perçu(e) comme exigeant(e) ou impatient(e).' },
      { trait: 'I', label: 'Je suis perçu(e) comme très communicant(e), parfois dispersé(e).' },
      { trait: 'S', label: 'Je suis perçu(e) comme calme, parfois trop réservé(e).' },
      { trait: 'C', label: 'Je suis perçu(e) comme précis(e), parfois trop critique.' },
    ],
  },
  {
    id: 21,
    choices: [
      { trait: 'D', label: 'En désaccord, je défends ma position de façon ferme.' },
      { trait: 'I', label: 'En désaccord, je cherche à influencer par la discussion.' },
      { trait: 'S', label: 'En désaccord, je cherche à préserver la relation.' },
      { trait: 'C', label: 'En désaccord, je reviens aux faits et aux règles.' },
    ],
  },
  {
    id: 22,
    choices: [
      { trait: 'D', label: 'Je préfère des consignes courtes: qui fait quoi, pour quand.' },
      { trait: 'I', label: 'Je préfère comprendre le “pourquoi” et l’élan collectif.' },
      { trait: 'S', label: 'Je préfère être rassuré(e) sur l’impact et l’accompagnement.' },
      { trait: 'C', label: 'Je préfère des consignes détaillées et documentées.' },
    ],
  },
  {
    id: 23,
    choices: [
      { trait: 'D', label: 'Je suis à l’aise pour dire non et poser des limites.' },
      { trait: 'I', label: 'Je suis à l’aise pour créer du lien et fédérer.' },
      { trait: 'S', label: 'Je suis à l’aise pour soutenir et stabiliser une équipe.' },
      { trait: 'C', label: 'Je suis à l’aise pour améliorer un système et fiabiliser.' },
    ],
  },
  {
    id: 24,
    choices: [
      { trait: 'D', label: 'Je préfère décider rapidement quitte à ajuster ensuite.' },
      { trait: 'I', label: 'Je préfère explorer plusieurs options avant de me fixer.' },
      { trait: 'S', label: 'Je préfère prendre le temps pour embarquer tout le monde.' },
      { trait: 'C', label: 'Je préfère valider chaque étape avant de conclure.' },
    ],
  },
]
