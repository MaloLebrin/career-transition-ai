import Employee from '#models/employee'
import Notification from '#models/notification'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import { buildDossierArchive } from '#services/dossier_export_service'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import db from '@adonisjs/lucid/services/db'
import type archiver from 'archiver'
import { rm } from 'node:fs/promises'

/**
 * Droits d'accès et d'effacement d'un candidat (RGPD, procédure dans
 * `docs/RGPD.md`). Utilisé par les commandes `candidate:export` et
 * `candidate:purge`.
 */

/** Nom du fichier de données brutes ajouté au dossier PDF de l'export. */
export const CANDIDATE_DATA_FILENAME = 'donnees.json'

/** Charge un candidat avec tout ce que l'export restitue. */
export async function loadCandidateForExport(employeeId: number): Promise<Employee | null> {
  return Employee.query()
    .where('id', employeeId)
    .preload('user')
    .preload('skills', (q) => q.pivotColumns(['level']))
    .preload('experiences')
    .preload('educations')
    .preload('exerciseResults')
    .preload('supportPlanSteps')
    .preload('notes', (q) => q.whereNull('deletedAt'))
    .first()
}

/**
 * Données brutes du candidat (`donnees.json`). Liste explicite des champs du
 * compte : jamais de mot de passe ni de jeton.
 */
export function candidateDataSnapshot(employee: Employee) {
  const user = employee.user
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
      createdAt: employee.createdAt?.toISO() ?? null,
    },
    account: user
      ? {
          email: user.email,
          name: user.name,
          role: user.role,
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
    notes: (employee.notes ?? []).map((note) => ({
      visibility: note.visibility,
      content: note.content,
      createdAt: note.createdAt?.toISO() ?? null,
    })),
  }
}

/** Archive ZIP de l'export : dossier PDF existant + `donnees.json`. */
export async function buildCandidateExportArchive(employee: Employee): Promise<archiver.Archiver> {
  return buildDossierArchive(employee, [
    {
      name: CANDIDATE_DATA_FILENAME,
      content: JSON.stringify(candidateDataSnapshot(employee), null, 2),
    },
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
  /** Fichiers PDF supprimés du disque (`pdf_exports.file_path`). */
  filesDeleted: number
  /** Compte utilisateur supprimé (seulement s'il a le rôle candidat). */
  userDeleted: boolean
}

async function countWhere(table: string, column: string, value: number): Promise<number> {
  const [row] = await db.from(table).where(column, value).count('* as total')
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
    filesDeleted: pdfExports.filter((pdf) => pdf.filePath).length,
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
 *   compétences, notes, étapes du plan, synthèses et exports PDF.
 * - Le compte `users` lié (`employees.user_id` est en `SET NULL`, donc non
 *   couvert par la cascade) est supprimé s'il a le rôle candidat — jamais un
 *   compte conseiller ou admin rattaché par erreur.
 * - Les notifications des conseillers qui le citent sont supprimées.
 * - Les PDF générés sur disque (`pdf_exports.file_path`) sont supprimés après
 *   la validation de la transaction : si la base échoue, rien n'est perdu.
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

  await db.transaction(async (trx) => {
    const employee = await Employee.findOrFail(employeeId, { client: trx })
    const user = employee.userId ? await User.find(employee.userId, { client: trx }) : null

    await notificationsAbout(employeeId).useTransaction(trx).delete()
    await employee.useTransaction(trx).delete()
    if (user?.role === USERS_ROLES.EMPLOYEE) {
      await user.useTransaction(trx).delete()
    }
  })

  let filesDeleted = 0
  for (const path of filePaths) {
    try {
      await rm(path)
      filesDeleted++
    } catch {
      // Fichier déjà absent (tmp/ nettoyé, autre machine) : rien à effacer.
    }
  }

  return { ...summary, filesDeleted }
}
