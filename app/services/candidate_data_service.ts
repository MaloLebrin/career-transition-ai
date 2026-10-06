import Employee from '#models/employee'
import type Media from '#models/media'
import Notification from '#models/notification'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import { buildDossierArchive } from '#services/dossier_export_service'
import { employeeMediaOwner } from '#services/candidate_documents_service'
import { MediaService } from '#services/media_service'
import { deletePdf } from '#services/pdf_storage_service'
import { MEDIA_ENTITY_TYPES } from '#shared/constants/media'
import { NOTE_VISIBILITY } from '#shared/constants/note'
import type { CandidateExportOptions } from '#shared/types/candidate_data/export_options'
import type {
  CandidateExportNotification,
  CandidateExportSynthesis,
} from '#shared/types/candidate_data/snapshot'
import { PRIVATE_NOTES_IN_EXPORT } from '#shared/constants/legal'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import type archiver from 'archiver'
import type { Readable } from 'node:stream'

/**
 * Droits d'accès et d'effacement d'un candidat (RGPD, procédure dans
 * `docs/RGPD.md`). Utilisé par les commandes `candidate:export` et
 * `candidate:purge`.
 */

/** Nom du fichier de données brutes ajouté au dossier PDF de l'export. */
export const CANDIDATE_DATA_FILENAME = 'donnees.json'

/** Dossier des documents déposés (issue #50) dans l'archive d'export. */
export const CANDIDATE_DOCUMENTS_DIR = 'documents'

/** Par défaut, l'export suit la politique `PRIVATE_NOTES_IN_EXPORT` (#97). */
export const DEFAULT_EXPORT_OPTIONS: CandidateExportOptions = {
  includePrivateNotes: PRIVATE_NOTES_IN_EXPORT,
}

/** Résolu à chaque appel : le fake Cloudinary de test (`app.container.swap`) s'applique. */
function mediaService(): Promise<MediaService> {
  return app.container.make(MediaService)
}

/** Charge un candidat avec tout ce que l'export restitue. */
export async function loadCandidateForExport(employeeId: number): Promise<Employee | null> {
  return Employee.query()
    .where('id', employeeId)
    .preload('user', (q) => q.preload('notifications'))
    .preload('skills', (q) => q.pivotColumns(['level']))
    .preload('experiences')
    .preload('educations')
    .preload('exerciseResults')
    .preload('supportPlanSteps')
    .preload('notes', (q) => q.whereNull('deletedAt'))
    .preload('syntheses')
    .preload('payments')
    .preload('expertRequests')
    .first()
}

/**
 * Données brutes du candidat (`donnees.json`). Liste explicite des champs du
 * compte : jamais de mot de passe ni de jeton.
 *
 * Notes (#97) : `notes` ne contient que les notes partagées avec le candidat ;
 * les notes `private` des conseillers vont dans `advisorPrivateNotes`, incluses
 * selon `options.includePrivateNotes` (`null` sinon, avec leur nombre dans
 * `advisorPrivateNotesWithheld`).
 */
export function candidateDataSnapshot(
  employee: Employee,
  documents: Media[] = [],
  options: CandidateExportOptions = DEFAULT_EXPORT_OPTIONS
) {
  const user = employee.user
  const notes = employee.notes ?? []
  const sharedNotes = notes.filter((note) => note.visibility === NOTE_VISIBILITY.SHARED)
  const privateNotes = notes.filter((note) => note.visibility === NOTE_VISIBILITY.PRIVATE)
  const serializeNote = (note: (typeof notes)[number]) => ({
    visibility: note.visibility,
    content: note.content,
    createdAt: note.createdAt?.toISO() ?? null,
  })
  return {
    exportedAt: new Date().toISOString(),
    candidate: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      currentRole: employee.currentRole,
      targetRole: employee.targetRole,
      summary: employee.summary,
      status: employee.status,
      accountType: employee.accountType,
      erasureRequestedAt: employee.erasureRequestedAt?.toISO() ?? null,
      createdAt: employee.createdAt?.toISO() ?? null,
    },
    account: user
      ? {
          email: user.email,
          name: user.name,
          role: user.role,
          termsAcceptedAt: user.termsAcceptedAt?.toISO() ?? null,
          termsVersion: user.termsVersion,
          emailVerifiedAt: user.emailVerifiedAt?.toISO() ?? null,
          createdAt: user.createdAt?.toISO() ?? null,
        }
      : null,
    skills: (employee.skills ?? []).map((skill) => ({
      name: skill.name,
      level: skill.$extras?.pivot_level ?? null,
    })),
    experiences: (employee.experiences ?? []).map((item) => item.serialize()),
    educations: (employee.educations ?? []).map((item) => item.serialize()),
    exerciseResults: (employee.exerciseResults ?? []).map((result) => ({
      type: result.type,
      status: result.status,
      data: result.data,
      qualitativeAnalysis: result.qualitativeAnalysis,
      createdAt: result.createdAt?.toISO() ?? null,
    })),
    supportPlanSteps: (employee.supportPlanSteps ?? []).map((step) => step.serialize()),
    notes: sharedNotes.map(serializeNote),
    advisorPrivateNotes: options.includePrivateNotes ? privateNotes.map(serializeNote) : null,
    advisorPrivateNotesWithheld: options.includePrivateNotes ? 0 : privateNotes.length,
    // Synthèses d'accompagnement ; les notes internes de l'expert suivent la politique des notes privées.
    syntheses: (employee.syntheses ?? []).map(
      (synthesis): CandidateExportSynthesis => ({
        shareStatus: synthesis.shareStatus,
        sharedAt: synthesis.sharedAt?.toISO() ?? null,
        expertCommentsShared: synthesis.expertCommentsShared,
        expertNotesInternal: options.includePrivateNotes ? synthesis.expertNotesInternal : null,
        executiveSummaryOverride: synthesis.executiveSummaryOverride,
        createdAt: synthesis.createdAt?.toISO() ?? null,
        updatedAt: synthesis.updatedAt?.toISO() ?? null,
      })
    ),
    // Notifications reçues par le compte du candidat (cloche et e-mails).
    notifications: (user?.notifications ?? []).map(
      (notification): CandidateExportNotification => ({
        type: notification.type,
        status: notification.status,
        title: notification.title,
        body: notification.body,
        readAt: notification.readAt?.toISO() ?? null,
        createdAt: notification.createdAt?.toISO() ?? null,
      })
    ),
    // Forfait particuliers (#94) : la pièce comptable survit anonymisée à la purge.
    payments: (employee.payments ?? []).map((payment) => ({
      product: payment.productCode,
      provider: payment.provider,
      status: payment.status,
      amountCents: payment.amountCents,
      // Code promo Stripe (#139) : remise, libellé et id du code.
      discountCents: payment.discountCents,
      promoCode: payment.promoCode,
      stripePromotionCodeId: payment.stripePromotionCodeId,
      currency: payment.currency,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      paidAt: payment.paidAt?.toISO() ?? null,
      refundedAt: payment.refundedAt?.toISO() ?? null,
      revokedAt: payment.revokedAt?.toISO() ?? null,
      revokeReason: payment.revokeReason,
      withdrawalWaivedAt: payment.withdrawalWaivedAt?.toISO() ?? null,
      createdAt: payment.createdAt?.toISO() ?? null,
    })),
    // Demandes d'accompagnement par un expert (#103) : supprimées avec la fiche.
    expertRequests: (employee.expertRequests ?? []).map((request) => ({
      status: request.status,
      message: request.message,
      availability: request.availability,
      declineReason: request.declineReason,
      createdAt: request.createdAt?.toISO() ?? null,
      handledAt: request.handledAt?.toISO() ?? null,
    })),
    documents: documents.map((document) => ({
      kind: document.kind,
      originalFilename: document.originalFilename,
      bytes: document.bytes,
      createdAt: document.createdAt?.toISO() ?? null,
      file: `${CANDIDATE_DOCUMENTS_DIR}/${documentEntryName(document)}`,
    })),
  }
}

/** Nom du fichier dans l'archive : id (unicité) + nom d'origine assaini. */
function documentEntryName(document: Media): string {
  const safe = document.originalFilename.replace(/[^\p{L}\p{N} ._()-]/gu, '_')
  return `${document.id}_${safe}`
}

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

/** Archive ZIP de l'export : dossier PDF existant + `donnees.json`. */
export async function buildCandidateExportArchive(
  employee: Employee,
  options: CandidateExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<archiver.Archiver> {
  const media = await mediaService()
  const documents = await media.list(employeeMediaOwner(employee))

  const files = []
  for (const document of documents) {
    try {
      const { stream } = await media.download(document)
      files.push({
        name: `${CANDIDATE_DOCUMENTS_DIR}/${documentEntryName(document)}`,
        content: await readAll(stream),
      })
    } catch {
      // Fichier absent du stockage : le document reste listé dans donnees.json.
    }
  }

  return buildDossierArchive(employee, [
    {
      name: CANDIDATE_DATA_FILENAME,
      content: JSON.stringify(candidateDataSnapshot(employee, documents, options), null, 2),
    },
    ...files,
  ])
}

export interface CandidatePurgeSummary {
  employeeId: number
  exerciseResults: number
  experiences: number
  educations: number
  notes: number
  supportPlanSteps: number
  pdfExports: number
  notifications: number
  /** Documents déposés (table `media`, issue #50). */
  documents: number
  /** Demandes d'accompagnement par un expert (#103), supprimées en cascade. */
  expertRequests: number
  /**
   * Paiements du forfait (#94) **conservés** comme pièces comptables (10 ans,
   * art. L123-22 Code de commerce) : leurs FK `employee_id` / `user_id`
   * passent à `NULL` (`ON DELETE SET NULL`), aucun champ identifiant n'y est
   * stocké — c'est l'anonymisation.
   */
  paymentsAnonymized: number
  /** Fichiers supprimés du stockage : PDF (`pdf_exports.file_path`) et documents. */
  filesDeleted: number
  /** Compte utilisateur supprimé (seulement s'il a le rôle candidat). */
  userDeleted: boolean
}

async function countWhere(
  table: string,
  column: string,
  value: number,
  entityType?: string
): Promise<number> {
  const [row] = await db
    .from(table)
    .where(column, value)
    .if(entityType, (query) => query.where('entity_type', entityType!))
    .count('* as total')
  return Number(row.total)
}

/**
 * Aperçu de ce que {@link purgeCandidate} supprimera, sans rien toucher.
 * `null` si le candidat n'existe pas.
 */
export async function previewCandidatePurge(
  employeeId: number
): Promise<CandidatePurgeSummary | null> {
  const employee = await Employee.find(employeeId)
  if (!employee) return null

  const user = employee.userId ? await User.find(employee.userId) : null
  const pdfExports = await PdfExport.query().where('employeeId', employeeId)
  const documents = await countWhere('media', 'entity_id', employeeId, MEDIA_ENTITY_TYPES.EMPLOYEE)

  return {
    employeeId,
    exerciseResults: await countWhere('exercise_results', 'employee_id', employeeId),
    experiences: await countWhere('experiences', 'employee_id', employeeId),
    educations: await countWhere('educations', 'employee_id', employeeId),
    notes: await countWhere('notes', 'employee_id', employeeId),
    supportPlanSteps: await countWhere('support_plan_steps', 'employee_id', employeeId),
    pdfExports: pdfExports.length,
    notifications: await notificationsAbout(employeeId)
      .count('* as total')
      .then(([row]) => Number(row.$extras.total)),
    documents,
    expertRequests: await countWhere('expert_requests', 'employee_id', employeeId),
    paymentsAnonymized: await countWhere('candidate_payments', 'employee_id', employeeId),
    filesDeleted: pdfExports.filter((pdf) => pdf.filePath).length + documents,
    userDeleted: user?.role === USERS_ROLES.EMPLOYEE,
  }
}

/**
 * Notifications (des conseillers) qui portent sur ce candidat : leur titre
 * contient son nom (« Analyse IA disponible : … »).
 */
function notificationsAbout(employeeId: number) {
  return Notification.query().whereRaw(`meta->>'employeeId' = ?`, [String(employeeId)])
}

/**
 * Effacement définitif d'un candidat.
 *
 * - La fiche `employees` est supprimée ; les clés étrangères `ON DELETE
 *   CASCADE` emportent résultats d'exercices, expériences, formations,
 *   compétences, notes, étapes du plan, synthèses, exports PDF et demandes
 *   d'accompagnement par un expert (#103).
 * - Les paiements du forfait (#94) sont conservés : `candidate_payments`
 *   est en `ON DELETE SET NULL`, la ligne reste comme pièce comptable sans
 *   aucun identifiant (voir `CandidatePurgeSummary.paymentsAnonymized`).
 * - Le compte `users` lié (`employees.user_id` est en `SET NULL`, donc non
 *   couvert par la cascade) est supprimé s'il a le rôle candidat — jamais un
 *   compte conseiller ou admin rattaché par erreur.
 * - Les notifications des conseillers qui le citent sont supprimées.
 * - Les documents déposés (table `media`, polymorphe donc hors cascade) sont
 *   supprimés dans la même transaction.
 * - Les fichiers Cloudinary (PDF générés et documents) sont supprimés après la
 *   validation de la transaction : si la base échoue, rien n'est perdu.
 *
 * `null` si le candidat n'existe pas.
 */
export async function purgeCandidate(employeeId: number): Promise<CandidatePurgeSummary | null> {
  const summary = await previewCandidatePurge(employeeId)
  if (!summary) return null

  const pdfExports = await PdfExport.query().where('employeeId', employeeId)
  const filePaths = pdfExports
    .map((pdf) => pdf.filePath)
    .filter((path): path is string => Boolean(path))

  const media = await mediaService()
  const documentFiles = await db.transaction(async (trx) => {
    const employee = await Employee.findOrFail(employeeId, { client: trx })
    const user = employee.userId ? await User.find(employee.userId, { client: trx }) : null

    await notificationsAbout(employeeId).useTransaction(trx).delete()
    const files = await media.deleteAllForEntity(MEDIA_ENTITY_TYPES.EMPLOYEE, employeeId, trx)
    await employee.useTransaction(trx).delete()
    if (user?.role === USERS_ROLES.EMPLOYEE) {
      await user.useTransaction(trx).delete()
    }
    return files
  })

  let filesDeleted = 0
  for (const key of filePaths) {
    try {
      if (await deletePdf(key)) filesDeleted++
    } catch {
      // Stockage indisponible : la base est déjà purgée, le fichier sera
      // retiré par la purge des exports expirés.
    }
  }

  filesDeleted += await media.destroyFiles(documentFiles)

  return { ...summary, filesDeleted }
}
