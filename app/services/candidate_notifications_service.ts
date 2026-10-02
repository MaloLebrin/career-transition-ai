import type Employee from '#models/employee'
import type ExerciseResult from '#models/exercise_result'
import type SupportPlanStep from '#models/support_plan_step'
import User from '#models/user'
import { NotificationService } from '#services/notification_service'
import { ACCOUNT_TYPES } from '#shared/constants/b2c'
import { BILLING_PATHS } from '#shared/constants/billing'
import { NOTIFICATION_TYPES } from '#shared/constants/notifications'
import { formatDateTimeFR } from '#shared/helpers/date'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { inject } from '@adonisjs/core'

/** Pages du candidat vers lesquelles pointent ses notifications (`meta.href`). */
export const CANDIDATE_NOTIFICATION_LINKS = {
  step: (stepId: number) => `/dashboard/candidat/steps/${stepId}`,
  synthesis: '/dashboard/candidat/synthesis',
  exercise: (type: string) => `/dashboard/candidat/exercises/${type}`,
  home: '/dashboard/candidat',
  offer: BILLING_PATHS.offer,
} as const

/**
 * Notifications liées au parcours du candidat (#70) : étape débloquée,
 * rendez-vous planifié, synthèse partagée, et demande d'effacement RGPD
 * adressée à l'équipe.
 *
 * Un candidat sans compte (`employees.user_id` nul, invitation non acceptée)
 * n'est pas notifié. Les notifications de l'équipe ne portent que l'id du
 * candidat : elles survivent à `candidate:purge`, qui ne doit rien laisser
 * d'identifiant derrière lui.
 */
@inject()
export class CandidateNotificationsService {
  constructor(private notifications: NotificationService) {}

  async stepUnlocked(employee: Employee, step: SupportPlanStep): Promise<void> {
    if (!employee.userId) return
    await this.notifications.notify({
      userId: employee.userId,
      type: NOTIFICATION_TYPES.STEP_UNLOCKED,
      title: step.title ? `Nouvelle étape disponible : ${step.title}` : 'Nouvelle étape disponible',
      body: 'Votre conseiller a débloqué une étape de votre parcours.',
      meta: { stepId: step.id, href: CANDIDATE_NOTIFICATION_LINKS.step(step.id) },
    })
  }

  async appointmentScheduled(employee: Employee, step: SupportPlanStep): Promise<void> {
    if (!employee.userId || !step.scheduledAt) return
    const when = formatDateTimeFR(step.scheduledAt.toISO() ?? undefined)
    const body = [
      step.title ? `Rendez-vous : ${step.title}` : null,
      step.locationOrLink ? `Lieu ou lien : ${step.locationOrLink}` : null,
    ]
      .filter(Boolean)
      .join('\n')
    await this.notifications.notify({
      userId: employee.userId,
      type: NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED,
      title: `Rendez-vous planifié le ${when}`,
      body: body || undefined,
      meta: {
        stepId: step.id,
        scheduledAt: step.scheduledAt.toISO(),
        href: CANDIDATE_NOTIFICATION_LINKS.step(step.id),
      },
    })
  }

  async synthesisShared(employee: Employee): Promise<void> {
    if (!employee.userId) return
    await this.notifications.notify({
      userId: employee.userId,
      type: NOTIFICATION_TYPES.SYNTHESIS_SHARED,
      title: 'Votre synthèse est disponible',
      body: 'Votre expert a partagé votre synthèse de parcours.',
      meta: { href: CANDIDATE_NOTIFICATION_LINKS.synthesis },
    })
  }

  /**
   * Analyse IA d'un exercice prête (#100) : seuls les particuliers B2C, qui
   * n'ont pas de conseiller pour la leur relayer, sont prévenus directement.
   */
  async aiAnalysisReady(employee: Employee, result: ExerciseResult): Promise<void> {
    if (!employee.userId || employee.accountType !== ACCOUNT_TYPES.B2C) return
    await this.notifications.notify({
      userId: employee.userId,
      type: NOTIFICATION_TYPES.AI_ANALYSIS_READY_CANDIDATE,
      title: 'Votre analyse IA est disponible',
      body: `L'analyse de votre exercice "${result.type}" est prête.`,
      meta: {
        exerciseResultId: result.id,
        exerciseType: result.type,
        href: CANDIDATE_NOTIFICATION_LINKS.exercise(result.type),
      },
    })
  }

  /**
   * Forfait réglé (webhook ou réconciliation, #104) ou octroi manuel (#107) :
   * le particulier est prévenu que tout son parcours est ouvert.
   */
  async resultsUnlocked(employee: Employee): Promise<void> {
    if (!employee.userId || employee.accountType !== ACCOUNT_TYPES.B2C) return
    await this.notifications.notify({
      userId: employee.userId,
      type: NOTIFICATION_TYPES.RESULTS_UNLOCKED,
      title: 'Vos résultats sont débloqués',
      body: 'Tous les exercices, vos résultats, vos analyses et votre synthèse sont désormais accessibles.',
      meta: { employeeId: employee.id, href: CANDIDATE_NOTIFICATION_LINKS.home },
    })
  }

  /** Remboursement Stripe (#104) ou révocation par un super admin (#107). */
  async resultsAccessRevoked(employee: Employee): Promise<void> {
    if (!employee.userId || employee.accountType !== ACCOUNT_TYPES.B2C) return
    await this.notifications.notify({
      userId: employee.userId,
      type: NOTIFICATION_TYPES.RESULTS_ACCESS_REVOKED,
      title: 'Votre accès aux résultats a été retiré',
      body: 'Les exercices gratuits restent disponibles. Contactez-nous si vous pensez qu’il s’agit d’une erreur.',
      meta: { employeeId: employee.id, href: CANDIDATE_NOTIFICATION_LINKS.offer },
    })
  }

  /**
   * Demande d'effacement : prévient les super admins (qui appliquent
   * `candidate:purge`, docs/RGPD.md) et le conseiller du candidat.
   */
  async erasureRequested(employee: Employee): Promise<void> {
    const superAdmins = await User.query()
      .where('role', USERS_ROLES.SUPER_ADMIN)
      .whereNull('deletedAt')
      .select('id')
    const recipients = new Set(superAdmins.map((user) => user.id))
    if (employee.advisorId) recipients.add(employee.advisorId)

    for (const userId of recipients) {
      await this.notifications.notify({
        userId,
        type: NOTIFICATION_TYPES.DATA_ERASURE_REQUESTED,
        title: `Demande d'effacement des données — candidat #${employee.id}`,
        body: "À traiter sous un mois : procédure d'effacement de docs/RGPD.md (node ace candidate:purge).",
        meta: { employeeId: employee.id },
      })
    }
  }
}
