import Education from '#models/education'
import Employee from '#models/employee'
import Experience from '#models/experience'
import Organization from '#models/organization'
import Skill from '#models/skill'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class EmployeeSeeder extends BaseSeeder {
  async run() {
    const org = await Organization.findBy('slug', 'ftc-paris')
    if (!org) return

    const advisor = await User.query()
      .where('role', 'admin')
      .where('organizationId', org.id)
      .first()
    if (!advisor) return

    const skills = await Skill.query().whereNull('organizationId').select('id', 'slug')
    const bySlug = Object.fromEntries(skills.map((s) => [s.slug, s.id]))

    const hubertUser = await User.findBy('email', 'h.duboc@example.fr')
    const maloUser = await User.findBy('email', 'm.lebrin@example.fr')

    // ----- Hubert Duboc (CV réel) -----
    const hubert = await Employee.updateOrCreate(
      { email: 'h.duboc@example.fr', organizationId: org.id },
      {
        organizationId: org.id,
        advisorId: advisor.id,
        userId: hubertUser?.id ?? null,
        name: 'Hubert Duboc',
        email: 'h.duboc@example.fr',
        currentRole: 'Directeur Adjoint - RESQME Europe',
        targetRole: 'Responsable développement / Direction',
        summary:
          'En charge du développement et de la gestion de la filiale Européenne de resqme, Inc. (RESQME Europe). Compétences en gestion, management, commercial, comptable, logistique et organisation. Expert solutions de premiers secours et sécurité clients.',
        advisorNotes:
          'Profil direction avec forte dimension commerciale et opérationnelle. Expérience création et gestion d’un centre de profits 1,5 M€+, management d’équipe, B2B international.',
        status: 'active',
        onboarded: true,
      }
    )

    const hubertExps = [
      {
        employeeId: hubert.id,
        title: 'Directeur Adjoint - RESQME EUROPE',
        company: 'resqme, Inc.',
        type: 'cdi' as const,
        startDate: DateTime.fromISO('2017-11-01'),
        endDate: null,
        isCurrent: true,
        description:
          'Mise en place et développement de la structure Européenne (Commercial, Logistique, Comptabilité, Rentabilité, Marketing, Administratif & RH). Création d’outils de gestion des commandes, stock et compte Amazon Europe. Gestion d’un centre de profits de plus de 1,5 M€ (croissance 30%+ sur 5 ans). Recrutement et management d’équipe. Dialogue B2B avec grands groupes internationaux.',
        sortOrder: 0,
      },
      {
        employeeId: hubert.id,
        title: 'Responsable de secteur',
        company: 'ALTIDOM ALP',
        type: 'cdi' as const,
        startDate: DateTime.fromISO('2016-10-01'),
        endDate: DateTime.fromISO('2017-10-01'),
        isCurrent: false,
        description:
          'Développement commercial 78 nord. Gestion de +500h facturées mensuellement. Management en binôme avec le directeur de +120 intervenants. Recrutement de +50 intervenants.',
        sortOrder: 1,
      },
      {
        employeeId: hubert.id,
        title: 'Chef de Pub',
        company: 'Le Petit Futé',
        type: 'cdd' as const,
        startDate: DateTime.fromISO('2015-01-01'),
        endDate: DateTime.fromISO('2015-06-01'),
        isCurrent: false,
        description:
          'Vente d’espaces publicitaires. Création et suivi d’encarts publicitaires. Mise en place d’outils de vente. Gestion budget et trajets commerciaux pour 4 pays.',
        sortOrder: 2,
      },
    ]
    for (const row of hubertExps) {
      await Experience.updateOrCreate(
        { employeeId: hubert.id, company: row.company, title: row.title },
        row
      )
    }

    await Education.updateOrCreate(
      { employeeId: hubert.id, degree: 'Master 2', school: 'EBS Paris - European Business School' },
      {
        employeeId: hubert.id,
        degree: 'Master 2 (M2)',
        school: 'EBS Paris - European Business School',
        startDate: DateTime.fromISO('2013-09-01'),
        endDate: DateTime.fromISO('2014-06-01'),
        isCurrent: false,
        description: '',
        sortOrder: 0,
      }
    )

    if (bySlug.budget && bySlug.reporting && bySlug.leadership) {
      await hubert.related('skills').sync(
        {
          [bySlug.budget]: { level: 5 },
          [bySlug.reporting]: { level: 5 },
          [bySlug.leadership]: { level: 5 },
          [bySlug['gestion-equipe']]: { level: 5 },
          [bySlug.excel]: { level: 4 },
        },
        false
      )
    }

    // ----- Malo Lebrin (CV réel) -----
    const malo = await Employee.updateOrCreate(
      { email: 'm.lebrin@example.fr', organizationId: org.id },
      {
        organizationId: org.id,
        advisorId: advisor.id,
        userId: maloUser?.id ?? null,
        name: 'Malo Lebrin',
        email: 'm.lebrin@example.fr',
        currentRole: 'Lead développeur',
        targetRole: 'Lead Developer / Formateur tech',
        summary:
          'Full stack developer React & React Native / VueJS / NuxtJS / TypeScript - Node.js (Express) - JavaScript. Lead developer chez Lamacompta. Profil psychologie du travail (Master Nantes) et développement web & mobile.',
        advisorNotes:
          'Profil technique fort (React, Vue, Node) avec expérience management d’équipe (Portique club) et entrepreneuriat (MAIA MATER). Double compétence psychologie et dev.',
        status: 'active',
        onboarded: true,
      }
    )

    const maloExps = [
      {
        employeeId: malo.id,
        title: 'Lead développeur',
        company: 'Lamacompta',
        type: 'cdi' as const,
        startDate: DateTime.fromISO('2024-11-01'),
        endDate: null,
        isCurrent: true,
        description: 'Lead developer, Nantes.',
        sortOrder: 0,
      },
      {
        employeeId: malo.id,
        title: 'Full Stack Developer',
        company: 'Zenika',
        type: 'cdi' as const,
        startDate: DateTime.fromISO('2022-08-01'),
        endDate: DateTime.fromISO('2024-11-01'),
        isCurrent: false,
        description: 'Full Stack Developer, Nantes (2 ans 4 mois).',
        sortOrder: 1,
      },
      {
        employeeId: malo.id,
        title: 'Développeur web',
        company: 'kiss my',
        type: 'cdi' as const,
        startDate: DateTime.fromISO('2021-01-01'),
        endDate: DateTime.fromISO('2022-07-01'),
        isCurrent: false,
        description: 'Développeur web, Nantes (1 an 7 mois).',
        sortOrder: 2,
      },
      {
        employeeId: malo.id,
        title: 'Développeur Full Stack',
        company: 'Akanthas',
        type: 'cdd' as const,
        startDate: DateTime.fromISO('2020-12-01'),
        endDate: DateTime.fromISO('2020-12-01'),
        isCurrent: false,
        description:
          'Création app mobile React Native (iOS/Android) pour localiser des conteneurs industriels. Création web app React pour la gestion de flotte. Serveur Node.js MongoDB.',
        sortOrder: 3,
      },
      {
        employeeId: malo.id,
        title: 'Développeur web',
        company: 'Lamacompta',
        type: 'cdd' as const,
        startDate: DateTime.fromISO('2020-06-01'),
        endDate: DateTime.fromISO('2020-10-01'),
        isCurrent: false,
        description:
          'Start-up 6 personnes. Refonte site v2.0 VueJs/NuxtJs, CVthèque et Job board. Librairie de composants Vue.js.',
        sortOrder: 4,
      },
      {
        employeeId: malo.id,
        title: 'Animateur puis Manager d’équipe',
        company: 'Portique club',
        type: 'cdi' as const,
        startDate: DateTime.fromISO('2011-07-01'),
        endDate: DateTime.fromISO('2018-09-01'),
        isCurrent: false,
        description:
          'Recrutement des équipes d’animation. Préqualification candidats, entretiens, formation. Management et accompagnement des équipes. Optimisation des statuts et dynamique managériale. La Tranche-sur-Mer.',
        sortOrder: 5,
      },
    ]
    for (const row of maloExps) {
      await Experience.updateOrCreate(
        { employeeId: malo.id, company: row.company, title: row.title },
        row
      )
    }

    const maloEdu = [
      {
        employeeId: malo.id,
        degree: 'Développeur web & Mobile',
        school: 'Le Reacteur',
        startDate: DateTime.fromISO('2020-01-01'),
        endDate: DateTime.fromISO('2020-12-01'),
        isCurrent: false,
        description: 'Programmation / développeur informatique.',
        sortOrder: 0,
      },
      {
        employeeId: malo.id,
        degree: 'Master Psychologie sociale du travail et des organisations',
        school: 'Université de Nantes',
        startDate: DateTime.fromISO('2016-09-01'),
        endDate: DateTime.fromISO('2018-06-01'),
        isCurrent: false,
        description: 'Psychologie sociale.',
        sortOrder: 1,
      },
    ]
    for (const row of maloEdu) {
      await Education.updateOrCreate(
        { employeeId: malo.id, degree: row.degree, school: row.school },
        row
      )
    }

    if (bySlug.redaction && bySlug.communication && bySlug['travail-equipe']) {
      await malo.related('skills').sync(
        {
          [bySlug.redaction]: { level: 5 },
          [bySlug.communication]: { level: 5 },
          [bySlug['travail-equipe']]: { level: 5 },
          [bySlug.leadership]: { level: 4 },
          [bySlug['gestion-equipe']]: { level: 4 },
        },
        false
      )
    }
  }
}
