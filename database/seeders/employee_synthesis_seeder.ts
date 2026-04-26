import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import Notification from '#models/notification'
import Organization from '#models/organization'
import User from '#models/user'
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  NotificationStatus,
  NotificationType,
} from '#shared/constants/notifications'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class EmployeeSynthesisSeeder extends BaseSeeder {
  async run() {
    const org = await Organization.findBy('slug', 'ftc-paris')
    if (!org) return

    const advisor = await User.query()
      .where('role', USERS_ROLES.ADVISOR)
      .where('organizationId', org.id)
      .first()
    if (!advisor) return

    const admin = await User.findBy('email', 'admin@ftc.fr')
    const expert = await User.findBy('email', 'expert@ftc.fr')

    const synthesisData: Record<
      string,
      { expertCommentsShared: string | null; expertNotesInternal: string | null }
    > = {
      'h.duboc@example.fr': {
        expertCommentsShared:
          "Hubert, votre expérience de création et de gestion de la filiale européenne de resqme démontre une maîtrise complète des dimensions opérationnelles, commerciales et managériales d'une direction. Ce bilan confirme votre légitimité pour des postes de direction générale ou de développement dans des PME à dimension internationale.",
        expertNotesInternal:
          "Profil atypique mais très solide : rare combinaison direction commerciale + création de structure + management. Point de vigilance : secteur très spécialisé (sécurité routière), à élargir le positionnement. Explorer les passerelles vers la direction opérationnelle dans d'autres secteurs industriels B2B.",
      },
      'm.lebrin@example.fr': {
        expertCommentsShared:
          'Malo, votre reconversion vers le développement web, combinée à votre formation en psychologie sociale, constitue un profil différenciant pour des rôles alliant technique et accompagnement humain. Ce bilan identifie des pistes de valorisation de cette double compétence.',
        expertNotesInternal:
          'Double compétence tech/RH à valoriser davantage. Envisager des postes Product Manager ou Tech Lead RH. Travailler la synthèse du discours pour le marché.',
      },
    }

    const employees = await Employee.query().where('organizationId', org.id)
    for (const employee of employees) {
      const shouldShare = employee.onboarded
      const specific = synthesisData[employee.email ?? '']
      const sharedBy = employee.advisorId === expert?.id ? expert : advisor

      await EmployeeSynthesis.updateOrCreate(
        { organizationId: org.id, employeeId: employee.id },
        {
          organizationId: org.id,
          employeeId: employee.id,
          shareStatus: shouldShare
            ? EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED
            : EMPLOYEE_SYNTHESIS_SHARE_STATUSES.DRAFT,
          sharedAt: shouldShare ? DateTime.now() : null,
          sharedByUserId: shouldShare ? sharedBy.id : null,
          expertCommentsShared: shouldShare
            ? (specific?.expertCommentsShared ??
              'Message au talent : voici la synthèse de ton dossier.')
            : null,
          expertNotesInternal:
            specific?.expertNotesInternal ??
            'Prépa entretien (interne) : hypothèses et points à creuser.',
          executiveSummaryOverride: null,
        }
      )
    }

    // ----- Notifications d'exemple -----
    const hubertEmployee = employees.find((e) => e.email === 'h.duboc@example.fr')
    const maloEmployee = employees.find((e) => e.email === 'm.lebrin@example.fr')

    type NotifRow = {
      userId: number
      type: NotificationType
      status: NotificationStatus
      title: string
      body: string
      meta: Record<string, unknown> | null
      readAt: DateTime | null
    }

    const notifRows: NotifRow[] = []

    notifRows.push({
      userId: advisor.id,
      type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
      status: NOTIFICATION_STATUSES.UNREAD,
      title: 'Exercice terminé par Hubert Duboc',
      body: 'L\'exercice "bilan_competences" vient d\'être complété.',
      meta: hubertEmployee
        ? { employeeId: hubertEmployee.id, exerciseType: 'bilan_competences' }
        : null,
      readAt: null,
    })
    notifRows.push({
      userId: advisor.id,
      type: NOTIFICATION_TYPES.AI_SYNTHESIS_READY,
      status: NOTIFICATION_STATUSES.READ,
      title: 'Analyse IA disponible : Malo Lebrin',
      body: 'L\'analyse de l\'exercice "projection_metier" est prête.',
      meta: maloEmployee
        ? { employeeId: maloEmployee.id, exerciseType: 'projection_metier' }
        : null,
      readAt: DateTime.now().minus({ hours: 2 }),
    })
    notifRows.push({
      userId: advisor.id,
      type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
      status: NOTIFICATION_STATUSES.READ,
      title: 'Export PDF prêt : bilan_hubert_duboc.pdf',
      body: 'Votre export PDF est disponible au téléchargement.',
      meta: hubertEmployee
        ? { employeeId: hubertEmployee.id, fileName: 'bilan_hubert_duboc.pdf' }
        : null,
      readAt: DateTime.now().minus({ days: 1 }),
    })

    if (admin) {
      notifRows.push({
        userId: admin.id,
        type: NOTIFICATION_TYPES.PDF_EXPORT_COMPLETED,
        status: NOTIFICATION_STATUSES.UNREAD,
        title: 'Export PDF prêt : bilan_hubert_duboc.pdf',
        body: 'Votre export PDF est disponible au téléchargement.',
        meta: hubertEmployee
          ? { employeeId: hubertEmployee.id, fileName: 'bilan_hubert_duboc.pdf' }
          : null,
        readAt: null,
      })
      notifRows.push({
        userId: admin.id,
        type: NOTIFICATION_TYPES.EXERCISE_COMPLETED,
        status: NOTIFICATION_STATUSES.READ,
        title: 'Exercice terminé par Malo Lebrin',
        body: 'L\'exercice "projection_metier" vient d\'être complété.',
        meta: maloEmployee
          ? { employeeId: maloEmployee.id, exerciseType: 'projection_metier' }
          : null,
        readAt: DateTime.now().minus({ hours: 5 }),
      })
    }

    for (const row of notifRows) {
      const exists = await Notification.query()
        .where('userId', row.userId)
        .where('type', row.type)
        .where('title', row.title)
        .first()
      if (!exists) {
        await Notification.create(row)
      }
    }
  }
}
