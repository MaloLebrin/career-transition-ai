import { Employee, ExerciseType } from '../types'

const generateMockMatrix = (topIndices: number[]) => {
  const matrix: (number | null)[][] = Array(22)
    .fill(null)
    .map(() => Array(22).fill(null))
  for (let i = 0; i < 22; i++) {
    for (let j = i + 1; j < 22; j++) {
      if (topIndices.includes(i)) matrix[i][j] = i
      else if (topIndices.includes(j)) matrix[i][j] = j
      else matrix[i][j] = Math.random() > 0.5 ? i : j
    }
  }
  return matrix
}

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    organizationId: 'ftc-paris',
    advisorId: 'advisor-1',
    name: 'Hubert Duboc',
    email: 'h.duboc@example.fr',
    currentRole: 'Chef de Projet IT',
    targetRole: 'Responsable RSE',
    status: 'active',
    onboarded: true,
    experiences: [
      {
        id: 'exp_h1',
        title: 'Chef de Projet IT',
        company: 'Digital Corp',
        type: 'CDI',
        startDate: '2015-01',
        isCurrent: true,
        description: 'Gestion de projets complexes en environnement agile.',
      },
    ],
    educations: [],
    skills: [
      { name: 'Management de projet', level: 4 },
      { name: 'Agile', level: 5 },
    ],
    exercises: [],
    advisorNotes:
      'Hubert est en début de parcours. Sa motivation pour la RSE est claire mais son profil technique nécessite une mise en avant de ses compétences transverses.',
    nextAppointment: '2024-06-15T10:00:00',
    plan: [
      {
        id: 'h1',
        title: 'La courbe de vie',
        description: "Tracer l'évolution de votre satisfaction.",
        dueDate: '2024-05-30',
        completed: false,
        associatedExercise: ExerciseType.LIFE_CURVE,
      },
      {
        id: 'h_km',
        title: 'Cartographie des Compétences',
        description: 'Détailler les acquis de votre poste actuel.',
        dueDate: '2024-06-02',
        completed: false,
        associatedExercise: ExerciseType.SKILL_MAPPING,
      },
      {
        id: 'h2',
        title: 'Diagnostic DISC',
        description: 'Comprendre votre style de communication.',
        dueDate: '2024-06-08',
        completed: false,
        associatedExercise: ExerciseType.DISC,
      },
      {
        id: 'h3',
        title: 'Analyse Motivations',
        description: "Identifier vos leviers d'engagement.",
        dueDate: '2024-06-05',
        completed: false,
        associatedExercise: ExerciseType.MOTIVATION,
      },
      {
        id: 'h4',
        title: 'Cercle de Contrôle',
        description: "Gérer son énergie face à l'incertitude.",
        dueDate: '2024-06-15',
        completed: false,
        associatedExercise: ExerciseType.CIRCLE_OF_CONTROL,
      },
    ],
  },
  {
    id: '2',
    organizationId: 'ftc-paris',
    advisorId: 'advisor-1',
    name: 'Malo Lebrin',
    email: 'm.lebrin@example.fr',
    currentRole: 'Commercial Senior',
    targetRole: 'Formateur en Vente',
    status: 'active',
    onboarded: true,
    summary:
      "Commercial performant avec une forte appétence pour la pédagogie et l'accompagnement des équipes.",
    skills: [
      { name: 'Vente B2B', level: 5 },
      { name: 'Négociation', level: 5 },
      { name: 'Pédagogie', level: 4 },
      { name: 'Prise de parole', level: 5 },
    ],
    experiences: [
      {
        id: 'e1',
        title: 'Commercial Senior',
        company: 'Salesforce',
        type: 'CDI',
        startDate: '2018-09',
        endDate: '2024-05',
        isCurrent: false,
        description: 'Top performer France sur le segment PME.',
      },
    ],
    educations: [
      {
        id: 'ed1',
        degree: 'Master Commerce',
        school: 'HEC Paris',
        startDate: '2015-09',
        endDate: '2018-06',
        isCurrent: false,
        description: '',
      },
    ],
    nextAppointment: '2024-06-20T14:30:00',
    advisorNotes:
      "Profil exemplaire. Malo a déjà validé toutes les étapes d'auto-diagnostic. Son profil DISC 'Influence' est un atout majeur pour son futur métier de formateur. La cartographie de ses compétences confirme son rôle de mentor naturel.",
    exercises: [
      {
        id: 'res_6',
        type: ExerciseType.SKILL_MAPPING,
        date: '2024-06-12',
        duration: 950,
        quantitativeScore: 10,
        data: {
          jobTitle: 'Commercial Senior (Salesforce)',
          experienceId: 'e1',
          mapping: [
            {
              id: 'sk1',
              mission: 'Développement commercial stratégique',
              activity: 'Prospection et qualification de comptes clés',
              proof: 'Ouverture de 12 comptes stratégiques en 18 mois, CA généré de 1.2M€.',
            },
            {
              id: 'sk2',
              mission: 'Vente complexe et négociation',
              activity: 'Pilotage du cycle de vente de A à Z',
              proof:
                "Signature d'un contrat cadre de 450k€ avec un leader du Retail français (gestion d'interlocuteurs C-Level).",
            },
            {
              id: 'sk3',
              mission: 'Mentoring et Transmission',
              activity: 'Onboarding des nouveaux commerciaux',
              proof:
                "Accompagnement de 4 juniors : réduction du temps de 'ramp-up' de 35% et succès sur leurs premières ventes.",
            },
            {
              id: 'sk4',
              mission: 'Analyse et Reporting',
              activity: 'Utilisation avancée des outils CRM',
              proof:
                "Expert référent sur Salesforce pour l'équipe (dashboarding, prévisionnels, automatisation).",
            },
          ],
        },
        qualitativeAnalysis:
          "La cartographie des compétences de Malo révèle une transition naturelle vers la formation. Ses preuves de mentoring ('sk3') sont particulièrement solides pour son projet cible de formateur en vente.",
      },
      {
        id: 'res_5',
        type: ExerciseType.CIRCLE_OF_CONTROL,
        date: '2024-06-10',
        duration: 240,
        quantitativeScore: 10,
        data: {
          inControl: [
            'Mon attitude',
            'Mon discours interne',
            'Mes limites',
            'Mes réponses',
            'Mon énergie',
            "La façon de m'exprimer",
          ],
          outControl: [
            'Le futur',
            "L'opinion des autres",
            'Vieillir',
            'Le passé',
            'Événements extérieurs',
          ],
        },
        qualitativeAnalysis:
          'Malo possède un locus de contrôle interne très fort. Il identifie correctement que sa réussite dépend de son attitude et de son énergie plutôt que des événements extérieurs.',
      },
      {
        id: 'res_1',
        type: ExerciseType.MOTIVATION,
        date: '2024-05-15',
        duration: 840,
        quantitativeScore: 10,
        data: {
          ranked: [
            'La satisfaction de transmettre des connaissances',
            "L'autonomie",
            "Le sentiment d'utilité sociale",
            'Le développement personnel',
            'Le contenu du poste',
            'La reconnaissance',
            'Le partage des valeurs',
            'La prise de responsabilités',
            "L'évoluer professionnellement",
            'La rémunération',
            'La qualité de vie',
            'Atteindre des objectifs',
            'Les conditions de travail',
            'Développer une expertise',
            'Développer de nouvelles compétences',
            "Le sentiment d'accomplissement",
            'Prendre des décisions',
            "La pérennité de l'entreprise",
            'La hauteur des enjeux',
            'La complexité des tâches',
            "S'exposer, prendre des risks",
            "Le sentiment d'utilité sociale",
            'Prendre des décisions',
          ],
          scores: {},
          matrix: generateMockMatrix([13, 10, 20]),
        },
        qualitativeAnalysis:
          "Malo est porté par des motivations intrinsèques liées à la transmission. La rémunération, bien qu'importante dans son passif de commercial, est devenue un facteur secondaire face au besoin de sens.",
      },
      {
        id: 'res_2',
        type: ExerciseType.LIFE_CURVE,
        date: '2024-05-10',
        duration: 450,
        quantitativeScore: 9,
        data: {
          points: [
            { year: 2018, satisfaction: 8, label: 'Arrivée chez Salesforce' },
            { year: 2021, satisfaction: 3, label: 'Épuisement / Perte de sens' },
            { year: 2024, satisfaction: 9, label: 'Lancement du projet FTC' },
          ],
          reflection: {
            form: 'Une courbe en V qui montre une résilience forte après une période de doute.',
            mostlySatisfied: 'Oui, sur les extrêmes, mais un creux marqué en milieu de parcours.',
            amplitude: 'Forte, traduisant un engagement émotionnel important dans le travail.',
            explanation:
              'Le creux de 2021 est lié à un désalignement entre mes valeurs et mes objectifs chiffrés.',
            surprise: 'Non, cela correspond exactement à mon ressenti interne.',
            coherence: 'Totalement. Le projet actuel explique le rebond de 2024.',
          },
        },
        qualitativeAnalysis:
          "La courbe de vie montre que Malo a besoin d'un projet passionnant pour maintenir sa satisfaction. Le 'creux' de 2021 a été le catalyseur de sa transition actuelle.",
      },
      {
        id: 'res_3',
        type: ExerciseType.DISC,
        date: '2024-06-02',
        duration: 120,
        quantitativeScore: 10,
        data: { D: 20, I: 85, S: 75, C: 25 },
        qualitativeAnalysis:
          "Profil 'Conseiller'. Très fort en Influence (I) et Stabilité (S). Malo est un communicant naturel qui sait créer un climat de sécurité. C'est la combinaison idéale pour un formateur : captiver son auditoire tout en étant à l'écoute des besoins individuels.",
      },
      {
        id: 'res_4',
        type: ExerciseType.TARGETING,
        date: '2024-06-05',
        duration: 300,
        quantitativeScore: 10,
        data: {
          targets: [
            {
              name: 'AFPA',
              type: 'Organisme de formation',
              comment: 'Leader en France, structuré, idéal pour débuter.',
              advisorComment:
                'Très pertinent. Ils cherchent souvent des formateurs avec une expertise terrain comme la vôtre.',
            },
            {
              name: 'Cegos',
              type: 'Organisme de formation',
              comment: 'Excellence pédagogique, prestige.',
              advisorComment: 'Excellent choix pour viser des formations haut de gamme.',
            },
          ],
        },
        qualitativeAnalysis:
          'Malo cible des références du marché. Son profil HEC combiné à son expérience Salesforce lui ouvre les portes des organismes les plus prestigieux.',
      },
    ],
    plan: [
      {
        id: 'm1',
        title: 'La courbe de vie',
        description: "Tracer l'évolution de votre satisfaction.",
        dueDate: '2024-05-10',
        completed: true,
        associatedExercise: ExerciseType.LIFE_CURVE,
        lastUpdated: '10/05/2024 14:20',
      },
      {
        id: 'm_km',
        title: 'Cartographie des Compétences',
        description: 'Détailler les acquis de votre poste actuel.',
        dueDate: '2024-06-12',
        completed: true,
        associatedExercise: ExerciseType.SKILL_MAPPING,
        lastUpdated: '12/06/2024 10:15',
      },
      {
        id: 'm2',
        title: 'Diagnostic DISC',
        description: 'Identifier votre style de communication.',
        dueDate: '2024-06-02',
        completed: true,
        associatedExercise: ExerciseType.DISC,
        lastUpdated: '02/06/2024 16:45',
      },
      {
        id: 'm3',
        title: 'Analyse Motivations',
        description: "Identifier vos leviers d'engagement.",
        dueDate: '2024-05-15',
        completed: true,
        associatedExercise: ExerciseType.MOTIVATION,
        lastUpdated: '15/05/2024 11:30',
      },
      {
        id: 'm4',
        title: 'Ciblage Organismes',
        description: "Recherche d'organismes de formation.",
        dueDate: '2024-06-05',
        completed: true,
        associatedExercise: ExerciseType.TARGETING,
        lastUpdated: '05/06/2024 09:15',
      },
      {
        id: 'm5',
        title: 'Cercle de Contrôle',
        description: "Gérer son énergie face à l'incertitude.",
        dueDate: '2024-06-10',
        completed: true,
        associatedExercise: ExerciseType.CIRCLE_OF_CONTROL,
        lastUpdated: '10/06/2024 17:30',
      },
    ],
  },
]
