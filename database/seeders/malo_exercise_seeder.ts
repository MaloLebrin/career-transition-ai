import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import SupportPlanStep from '#models/support_plan_step'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class MaloExercisesSeeder extends BaseSeeder {
  async run() {
    const org = await Organization.findBy('slug', 'ftc-paris')
    if (!org) return

    const malo = await Employee.query()
      .where('organizationId', org.id)
      .where('email', 'm.lebrin@example.fr')
      .first()
    if (!malo) return

    const exerciseResults = [
      {
        employeeId: malo.id,
        type: 'motivation' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-05-15'),
        duration: 840,
        data: {
          ranked: [
            'La satisfaction de transmettre des connaissances',
            "L'autonomie",
            "Le sentiment d'utilité sociale",
            'Le développement personnel',
            'Le contenu du poste',
            'La reconnaissance',
          ],
          scores: {},
          matrix: [],
        },
        quantitativeScore: 10,
        qualitativeAnalysis:
          "Malo est porté par des motivations intrinsèques liées à la transmission. La rémunération, bien qu'importante dans son passif de commercial, est devenue un facteur secondaire face au besoin de sens.",
      },
      {
        employeeId: malo.id,
        type: 'life_curve' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-05-10'),
        duration: 450,
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
        quantitativeScore: 9,
        qualitativeAnalysis:
          "La courbe de vie montre que Malo a besoin d'un projet passionnant pour maintenir sa satisfaction. Le creux de 2021 a été le catalyseur de sa transition actuelle.",
      },
      {
        employeeId: malo.id,
        type: 'disc' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-06-02'),
        duration: 120,
        data: { D: 20, I: 85, S: 75, C: 25 },
        quantitativeScore: 10,
        qualitativeAnalysis:
          "Profil 'Conseiller'. Très fort en Influence (I) et Stabilité (S). Malo est un communicant naturel qui sait créer un climat de sécurité. Idéal pour un formateur : captiver son auditoire tout en étant à l'écoute des besoins individuels.",
      },
      {
        employeeId: malo.id,
        type: 'circle_of_control' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-06-10'),
        duration: 240,
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
        quantitativeScore: 10,
        qualitativeAnalysis:
          'Malo possède un locus de contrôle interne très fort. Il identifie correctement que sa réussite dépend de son attitude et de son énergie plutôt que des événements extérieurs.',
      },
      {
        employeeId: malo.id,
        type: 'targeting' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-06-05'),
        duration: 300,
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
        quantitativeScore: 10,
        qualitativeAnalysis:
          'Malo cible des références du marché. Son profil combiné à son expérience lui ouvre les portes des organismes les plus prestigieux.',
      },
      {
        employeeId: malo.id,
        type: 'skill_mapping' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-06-12'),
        duration: 950,
        data: {
          jobTitle: 'Lead développeur (Lamacompta)',
          experienceId: null,
          mapping: [
            {
              id: 'sk1',
              mission: 'Développement technique et architecture',
              activity: 'Lead technique sur la stack React / Node',
              proof:
                'Refonte et évolution de la plateforme Lamacompta, accompagnement des juniors.',
            },
            {
              id: 'sk2',
              mission: 'Transmission et montée en compétence',
              activity: 'Mentoring et bonnes pratiques',
              proof: 'Formation des équipes sur React, TypeScript et pratiques qualité.',
            },
            {
              id: 'sk3',
              mission: 'Animation et coordination',
              activity: 'Pilotage des chantiers et priorisation',
              proof: 'Organisation des sprints et suivi des livrables.',
            },
          ],
        },
        quantitativeScore: 10,
        qualitativeAnalysis:
          'La cartographie des compétences de Malo révèle une transition naturelle vers la formation. Ses preuves de mentoring et de lead technique sont particulièrement solides pour un rôle de formateur tech.',
      },
    ]

    for (const row of exerciseResults) {
      await ExerciseResult.updateOrCreate(
        {
          employeeId: malo.id,
          type: row.type,
          status: 'completed' as const,
        },
        row
      )
    }

    const planSteps = [
      {
        title: 'La courbe de vie',
        description: "Tracer l'évolution de votre satisfaction.",
        dueDate: DateTime.fromISO('2024-05-10'),
        completed: true,
        associatedExercise: 'life_curve' as const,
        sortOrder: 0,
      },
      {
        title: 'Cartographie des Compétences',
        description: 'Détailler les acquis de votre poste actuel.',
        dueDate: '2024-06-12',
        completed: true,
        associatedExercise: 'skill_mapping' as const,
        sortOrder: 1,
      },
      {
        title: 'Diagnostic DISC',
        description: 'Comprendre votre style de communication.',
        dueDate: DateTime.fromISO('2024-06-02'),
        completed: true,
        associatedExercise: 'disc' as const,
        sortOrder: 2,
      },
      {
        title: 'Analyse Motivations',
        description: "Identifier vos leviers d'engagement.",
        dueDate: DateTime.fromISO('2024-05-15'),
        completed: true,
        associatedExercise: 'motivation' as const,
        sortOrder: 3,
      },
      {
        title: 'Ciblage Organismes',
        description: "Recherche d'organismes de formation.",
        dueDate: DateTime.fromISO('2024-06-05'),
        completed: true,
        associatedExercise: 'targeting' as const,
        sortOrder: 4,
      },
      {
        title: 'Cercle de Contrôle',
        description: "Gérer son énergie face à l'incertitude.",
        dueDate: DateTime.fromISO('2024-06-10'),
        completed: true,
        associatedExercise: 'circle_of_control' as const,
        sortOrder: 5,
      },
    ]

    for (const step of planSteps) {
      await SupportPlanStep.updateOrCreate(
        {
          employeeId: malo.id,
          title: step.title,
          associatedExercise: step.associatedExercise,
        },
        {
          employeeId: malo.id,
          title: step.title,
          description: step.description,
          dueDate: step.dueDate as DateTime,
          completed: step.completed,
          associatedExercise: step.associatedExercise,
          sortOrder: step.sortOrder,
        }
      )
    }
  }
}
