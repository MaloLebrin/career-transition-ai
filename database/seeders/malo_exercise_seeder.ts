import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Organization from '#models/organization'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import User from '#models/user'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
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

    const advisor = await User.query()
      .where('organizationId', org.id)
      .where('role', 'advisor')
      .first()

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
      {
        employeeId: malo.id,
        type: 'values' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-06-18'),
        duration: 680,
        data: {
          selectedValues: [
            'La bienveillance',
            "L'autonomie",
            "L'universalisme",
            'La réalisation',
            'La stimulation',
            'La sécurité',
            "L'hédonisme",
            'La tradition',
            'La conformité',
            'Le pouvoir',
          ],
          peopleExercise: [
            {
              name: 'Richard Feynman',
              values:
                'Curiosité insatiable, passion de transmettre des savoirs complexes avec simplicité. Il incarne la conviction que comprendre et expliquer sont des actes profondément humains.',
            },
            {
              name: 'Ma mère',
              values:
                "Bienveillance inconditionnelle et générosité. Elle m'a appris que aider les autres sans attendre de retour est une valeur fondamentale, pas une faiblesse.",
            },
            {
              name: 'Dan Abramov',
              values:
                "Partage de connaissances, transparence sur ses propres limites et doutes. Il montre qu'un expert peut rester humble et que l'open source est un acte de don à la communauté.",
            },
          ],
        },
        quantitativeScore: 10,
        qualitativeAnalysis:
          "Le profil de valeurs de Malo confirme une hiérarchie cohérente avec son projet de transition : la bienveillance et l'autonomie dominent, reflet d'un besoin de donner du sens tout en conservant une liberté d'action. Les figures d'inspiration choisies (transmission, générosité, partage) forment un fil rouge puissant vers le métier de formateur.",
      },
      {
        employeeId: malo.id,
        type: 'personality' as const,
        status: 'completed' as const,
        date: DateTime.fromISO('2024-06-24'),
        duration: 390,
        data: {
          openness: 9,
          conscientiousness: 7,
          extraversion: 8,
          agreeableness: 9,
          neuroticism: 2,
        },
        quantitativeScore: 10,
        qualitativeAnalysis:
          "Le profil Big Five de Malo est très favorable au métier de formateur : une ouverture d'esprit au-dessus de la moyenne (9/10) traduit une curiosité intellectuelle constante et une capacité à s'adapter à des contextes variés. L'extraversion élevée (8/10) combinée à une agréabilité forte (9/10) confirme l'aisance relationnelle observée en entretien. La stabilité émotionnelle exceptionnelle (névrosisme 2/10) est un atout majeur pour gérer des groupes sous tension. Seul point de vigilance : une conscience professionnelle de 7/10 solide mais perfectible sur l'aspect planification long terme.",
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
        instructions: "Préparez-vous à retracer l'évolution de votre satisfaction professionnelle.",
        scheduledAt: DateTime.fromISO('2024-05-10T10:00:00'),
        endedAt: DateTime.fromISO('2024-05-10T11:00:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'Salle 1 - FTC Paris',
        completed: true,
        exercises: ['life_curve'] as const,
        sortOrder: 0,
        isLocked: false,
      },
      {
        instructions: 'Apportez votre CV et une liste de vos principales réalisations.',
        scheduledAt: DateTime.fromISO('2024-05-15T14:00:00'),
        endedAt: DateTime.fromISO('2024-05-15T15:30:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'https://meet.google.com/abc-defg-hij',
        completed: true,
        exercises: ['motivation'] as const,
        sortOrder: 1,
        isLocked: false,
      },
      {
        instructions: 'Nous allons analyser votre profil comportemental DISC.',
        scheduledAt: DateTime.fromISO('2024-06-02T09:30:00'),
        endedAt: DateTime.fromISO('2024-06-02T10:30:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'Salle 2 - FTC Paris',
        completed: true,
        exercises: ['disc'] as const,
        sortOrder: 2,
        isLocked: false,
      },
      {
        instructions: "Réfléchissez aux organismes de formation qui vous intéressent.",
        scheduledAt: DateTime.fromISO('2024-06-05T11:00:00'),
        endedAt: DateTime.fromISO('2024-06-05T12:00:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'https://meet.google.com/xyz-uvwx-rst',
        completed: true,
        exercises: ['targeting'] as const,
        sortOrder: 3,
        isLocked: false,
      },
      {
        instructions: 'Nous travaillerons sur la gestion du stress et des incertitudes.',
        scheduledAt: DateTime.fromISO('2024-06-10T15:00:00'),
        endedAt: DateTime.fromISO('2024-06-10T16:00:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'Salle 1 - FTC Paris',
        completed: true,
        exercises: ['circle_of_control'] as const,
        sortOrder: 4,
        isLocked: false,
      },
      {
        instructions: 'Cartographie complète de vos compétences transférables.',
        scheduledAt: DateTime.fromISO('2024-06-12T10:00:00'),
        endedAt: DateTime.fromISO('2024-06-12T12:00:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'Salle 1 - FTC Paris',
        completed: true,
        exercises: ['skill_mapping'] as const,
        sortOrder: 5,
        isLocked: false,
      },
      {
        instructions:
          "Classez les 10 valeurs de Schwartz par ordre d'importance, puis identifiez 3 figures qui les incarnent.",
        scheduledAt: DateTime.fromISO('2024-06-18T10:00:00'),
        endedAt: DateTime.fromISO('2024-06-18T11:30:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'https://meet.google.com/val-ues-ftc',
        completed: true,
        exercises: ['values'] as const,
        sortOrder: 6,
        isLocked: false,
      },
      {
        instructions:
          'Positionnez-vous sur les 5 traits fondamentaux du modèle Big Five pour affiner votre profil professionnel.',
        scheduledAt: DateTime.fromISO('2024-06-24T14:00:00'),
        endedAt: DateTime.fromISO('2024-06-24T15:00:00'),
        status: APPOINTMENTS_STATUSES.COMPLETED,
        locationOrLink: 'Salle 2 - FTC Paris',
        completed: true,
        exercises: ['personality'] as const,
        sortOrder: 7,
        isLocked: false,
      },
    ]

    for (const step of planSteps) {
      const { exercises, ...stepData } = step

      const createdStep = await SupportPlanStep.updateOrCreate(
        {
          employeeId: malo.id,
          sortOrder: stepData.sortOrder,
        },
        {
          employeeId: malo.id,
          advisorId: advisor?.id ?? null,
          instructions: stepData.instructions,
          scheduledAt: stepData.scheduledAt,
          endedAt: stepData.endedAt,
          status: stepData.status,
          locationOrLink: stepData.locationOrLink,
          completed: stepData.completed,
          sortOrder: stepData.sortOrder,
          isLocked: stepData.isLocked,
        }
      )

      await SupportPlanStepExercise.query().where('supportPlanStepId', createdStep.id).delete()

      for (let i = 0; i < exercises.length; i++) {
        await SupportPlanStepExercise.create({
          supportPlanStepId: createdStep.id,
          exerciseType: exercises[i],
          sortOrder: i,
        })
      }
    }
  }
}
