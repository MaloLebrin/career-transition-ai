import CandidateExport from '#commands/candidate_export'
import CandidatePurge from '#commands/candidate_purge'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { ExperienceFactory } from '#database/factories/experience_factory'
import { NotificationFactory } from '#database/factories/notification_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Experience from '#models/experience'
import Notification from '#models/notification'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import {
  CANDIDATE_DATA_FILENAME,
  candidateDataSnapshot,
  loadCandidateForExport,
  previewCandidatePurge,
  purgeCandidate,
} from '#services/candidate_data_service'
import { createAdvisor, createCandidate, type CandidateActor } from '#tests/support/actors'
import ace from '@adonisjs/core/services/ace'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const TMP_DIR = app.tmpPath('tests-rgpd')

/** Candidat avec un peu de tout : exercice, expérience, PDF sur disque, notification. */
async function seedCandidate(): Promise<CandidateActor & { pdfPath: string; advisor: User }> {
  const advisor = await createAdvisor()
  const actor = await createCandidate({ advisor })
  const { employee } = actor

  await ExerciseResultFactory.merge({ employeeId: employee.id }).create()
  await ExperienceFactory.merge({ employeeId: employee.id }).create()

  await mkdir(TMP_DIR, { recursive: true })
  const pdfPath = join(TMP_DIR, `synthese-${employee.id}.pdf`)
  await writeFile(pdfPath, '%PDF-1.4 test')
  await PdfExportFactory.merge({
    userId: advisor.id,
    organizationId: employee.organizationId,
    employeeId: employee.id,
    filePath: pdfPath,
  }).create()

  await NotificationFactory.merge({
    userId: advisor.id,
    title: `Analyse IA disponible : ${employee.name}`,
    meta: { employeeId: employee.id },
  }).create()

  return { ...actor, pdfPath, advisor }
}

test.group('candidate_data_service | purge', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.teardown(() => rm(TMP_DIR, { recursive: true, force: true }))

  test('supprime la fiche, les données liées, le compte et le PDF sur disque', async ({
    assert,
  }) => {
    const { employee, user, pdfPath, advisor } = await seedCandidate()
    const other = await seedCandidate()

    const summary = await purgeCandidate(employee.id)

    assert.include(summary!, {
      employeeId: employee.id,
      exerciseResults: 1,
      experiences: 1,
      pdfExports: 1,
      notifications: 1,
      filesDeleted: 1,
      userDeleted: true,
    })
    assert.isNull(await Employee.find(employee.id))
    assert.isNull(await User.find(user.id))
    assert.lengthOf(await ExerciseResult.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await Experience.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await PdfExport.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await Notification.query().where('userId', advisor.id), 0)
    assert.isFalse(existsSync(pdfPath))

    // Le conseiller et l'autre candidat ne sont pas touchés.
    assert.isNotNull(await User.find(advisor.id))
    assert.isNotNull(await Employee.find(other.employee.id))
    assert.isNotNull(await User.find(other.user.id))
    assert.lengthOf(await ExerciseResult.query().where('employeeId', other.employee.id), 1)
    assert.lengthOf(await Notification.query().where('userId', other.advisor.id), 1)
    assert.isTrue(existsSync(other.pdfPath))
  })

  test("ne supprime jamais un compte qui n'a pas le rôle candidat", async ({ assert }) => {
    const advisor = await createAdvisor()
    const { employee } = await createCandidate()
    employee.userId = advisor.id
    await employee.save()

    const summary = await purgeCandidate(employee.id)

    assert.isFalse(summary!.userDeleted)
    assert.isNull(await Employee.find(employee.id))
    assert.isNotNull(await User.find(advisor.id))
  })

  test("l'aperçu ne supprime rien", async ({ assert }) => {
    const { employee, pdfPath } = await seedCandidate()

    const preview = await previewCandidatePurge(employee.id)

    assert.equal(preview!.exerciseResults, 1)
    assert.isNotNull(await Employee.find(employee.id))
    assert.isTrue(existsSync(pdfPath))
  })

  test('renvoie null pour un candidat introuvable', async ({ assert }) => {
    assert.isNull(await purgeCandidate(999_999_999))
    assert.isNull(await previewCandidatePurge(999_999_999))
  })
})

test.group('candidate_data_service | export', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.teardown(() => rm(TMP_DIR, { recursive: true, force: true }))

  test('restitue profil, compte et exercices, sans mot de passe', async ({ assert }) => {
    const { employee, user } = await seedCandidate()

    const loaded = await loadCandidateForExport(employee.id)
    const snapshot = candidateDataSnapshot(loaded!)
    const json = JSON.stringify(snapshot)

    assert.equal(snapshot.candidate.email, employee.email)
    assert.equal(snapshot.account?.email, user.email)
    assert.lengthOf(snapshot.exerciseResults, 1)
    assert.lengthOf(snapshot.experiences, 1)
    assert.notInclude(json, 'password')
    assert.notInclude(json, user.password)
  })
})

test.group('commandes candidate:export et candidate:purge', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  // Sortie des commandes capturée plutôt qu'affichée (assertLog disponible).
  group.setup(() => {
    ace.ui.switchMode('raw')
    return () => ace.ui.switchMode('normal')
  })
  group.teardown(() => rm(TMP_DIR, { recursive: true, force: true }))

  test('candidate:export écrit un ZIP contenant donnees.json', async ({ assert }) => {
    const { employee } = await seedCandidate()
    const out = join(TMP_DIR, `export-${employee.id}.zip`)

    const command = await ace.create(CandidateExport, [String(employee.id), `--out=${out}`])
    await command.exec()

    command.assertSucceeded()
    const zip = await readFile(out)
    assert.equal(zip.subarray(0, 2).toString(), 'PK')
    assert.include(zip.toString('latin1'), CANDIDATE_DATA_FILENAME)
  })

  test('candidate:purge --force supprime le candidat', async ({ assert }) => {
    const { employee } = await seedCandidate()

    const command = await ace.create(CandidatePurge, [String(employee.id), '--force'])
    await command.exec()

    command.assertSucceeded()
    assert.isNull(await Employee.find(employee.id))
  })

  test('candidate:purge sans confirmation ne supprime rien', async ({ assert }) => {
    const { employee } = await seedCandidate()

    const command = await ace.create(CandidatePurge, [String(employee.id)])
    command.prompt.trap('Confirmer la suppression définitive ?').reject()
    await command.exec()

    command.assertSucceeded()
    assert.isNotNull(await Employee.find(employee.id))
  })

  test('les deux commandes échouent pour un candidat introuvable', async () => {
    const exportCommand = await ace.create(CandidateExport, ['999999999'])
    await exportCommand.exec()
    exportCommand.assertFailed()

    const purgeCommand = await ace.create(CandidatePurge, ['999999999', '--force'])
    await purgeCommand.exec()
    purgeCommand.assertFailed()
  })
})
