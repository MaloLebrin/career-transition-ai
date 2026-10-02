import CandidateExport from '#commands/candidate_export'
import CandidatePurge from '#commands/candidate_purge'
import { ExerciseResultFactory } from '#database/factories/exercise_result_factory'
import { ExpertRequestFactory } from '#database/factories/expert_request_factory'
import { ExperienceFactory } from '#database/factories/experience_factory'
import { MediaFactory } from '#database/factories/media_factory'
import { NotificationFactory } from '#database/factories/notification_factory'
import { PdfExportFactory } from '#database/factories/pdf_export_factory'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Experience from '#models/experience'
import CandidatePayment from '#models/candidate_payment'
import ExpertRequest from '#models/expert_request'
import Media from '#models/media'
import Notification from '#models/notification'
import PdfExport from '#models/pdf_export'
import User from '#models/user'
import { CloudinaryService } from '#services/cloudinary_service'
import { pdfExportKey, storePdf } from '#services/pdf_storage_service'
import {
  CANDIDATE_DATA_FILENAME,
  buildCandidateExportArchive,
  candidateDataSnapshot,
  loadCandidateForExport,
  previewCandidatePurge,
  purgeCandidate,
} from '#services/candidate_data_service'
import {
  createAdvisor,
  createB2cCandidate,
  createCandidate,
  type CandidateActor,
} from '#tests/support/actors'
import ace from '@adonisjs/core/services/ace'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  type FakeCloudinary,
  restoreCloudinary,
  swapFakeCloudinary,
} from '#tests/support/fake_cloudinary'
import { test } from '@japa/runner'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

const TMP_DIR = app.tmpPath('tests-rgpd')

/** Candidat avec un peu de tout : exercice, expérience, PDF et document stockés, notification. */
async function seedCandidate(): Promise<
  CandidateActor & { pdfKey: string; documentKey: string; advisor: User }
> {
  const advisor = await createAdvisor()
  const actor = await createCandidate({ advisor })
  const { employee } = actor

  await ExerciseResultFactory.merge({ employeeId: employee.id }).create()
  await ExperienceFactory.merge({ employeeId: employee.id }).create()

  const pdfExport = await PdfExportFactory.merge({
    userId: advisor.id,
    organizationId: employee.organizationId,
    employeeId: employee.id,
  }).create()
  const pdfKey = pdfExportKey(employee.organizationId, pdfExport.id)
  await storePdf(pdfKey, new TextEncoder().encode('%PDF-1.4 test'))
  pdfExport.filePath = pdfKey
  await pdfExport.save()

  await NotificationFactory.merge({
    userId: advisor.id,
    title: `Analyse IA disponible : ${employee.name}`,
    meta: { employeeId: employee.id },
  }).create()

  // Document déposé (issue #50), présent dans le stockage (fake Cloudinary).
  const documentKey = `career-transition/dev/organizations/${employee.organizationId}/employees/${employee.id}/documents/doc_${employee.id}.pdf`
  const cloudinary = await app.container.make(CloudinaryService)
  await cloudinary.uploadBuffer(new TextEncoder().encode('%PDF-1.4 diplome'), {
    publicId: documentKey,
    resourceType: 'raw',
    deliveryType: 'authenticated',
  })
  await MediaFactory.merge({
    entityId: employee.id,
    organizationId: employee.organizationId,
    cloudinaryPublicId: documentKey,
    originalFilename: 'Diplôme 2020.pdf',
    uploadedById: actor.user.id,
  }).create()

  return { ...actor, pdfKey, documentKey, advisor }
}

test.group('candidate_data_service | purge', (group) => {
  let cloud: FakeCloudinary
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    cloud = swapFakeCloudinary()
    return () => restoreCloudinary()
  })

  test('supprime la fiche, les données liées, le compte, le PDF et les documents stockés', async ({
    assert,
  }) => {
    const { employee, user, pdfKey, documentKey, advisor } = await seedCandidate()
    const other = await seedCandidate()

    const summary = await purgeCandidate(employee.id)

    assert.include(summary!, {
      employeeId: employee.id,
      exerciseResults: 1,
      experiences: 1,
      pdfExports: 1,
      notifications: 1,
      documents: 1,
      filesDeleted: 2,
      userDeleted: true,
    })
    assert.isNull(await Employee.find(employee.id))
    assert.isNull(await User.find(user.id))
    assert.lengthOf(await ExerciseResult.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await Experience.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await PdfExport.query().where('employeeId', employee.id), 0)
    assert.lengthOf(await Notification.query().where('userId', advisor.id), 0)
    assert.isFalse(cloud.has(pdfKey))
    assert.isFalse(cloud.has(documentKey))
    assert.lengthOf(await Media.query().where('entityId', employee.id), 0)

    // Le conseiller et l'autre candidat ne sont pas touchés.
    assert.isNotNull(await User.find(advisor.id))
    assert.isNotNull(await Employee.find(other.employee.id))
    assert.isNotNull(await User.find(other.user.id))
    assert.lengthOf(await ExerciseResult.query().where('employeeId', other.employee.id), 1)
    assert.lengthOf(await Notification.query().where('userId', other.advisor.id), 1)
    assert.isTrue(cloud.has(other.pdfKey))
    assert.isTrue(cloud.has(other.documentKey))
    assert.lengthOf(await Media.query().where('entityId', other.employee.id), 1)
  })

  test('stockage indisponible : la base est purgée, les fichiers restent comptés à part', async ({
    assert,
  }) => {
    const { employee } = await seedCandidate()
    cloud.destroy = async () => {
      throw new Error('cloudinary down')
    }

    const summary = await purgeCandidate(employee.id)

    assert.equal(summary!.filesDeleted, 0)
    assert.isNull(await Employee.find(employee.id))
    assert.lengthOf(await Media.query().where('entityId', employee.id), 0)
  })

  test('particulier (#106) : demandes d’accompagnement supprimées, paiements conservés anonymisés', async ({
    assert,
  }) => {
    const { employee, user } = await createB2cCandidate({ paid: true })
    await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()
    const [payment] = await CandidatePayment.query().where('employeeId', employee.id)

    const preview = await previewCandidatePurge(employee.id)
    assert.include(preview!, { expertRequests: 1, paymentsAnonymized: 1, userDeleted: true })

    const summary = await purgeCandidate(employee.id)

    assert.include(summary!, { expertRequests: 1, paymentsAnonymized: 1 })
    assert.isNull(await Employee.find(employee.id))
    assert.isNull(await User.find(user.id))
    assert.lengthOf(await ExpertRequest.query().where('employeeId', employee.id), 0)
    const kept = await CandidatePayment.findOrFail(payment.id)
    assert.isNull(kept.employeeId)
    assert.isNull(kept.userId)
    assert.equal(kept.status, 'paid')
    assert.equal(kept.amountCents, payment.amountCents)
    assert.notInclude(JSON.stringify(kept.serialize()), employee.email)
    assert.notInclude(JSON.stringify(kept.serialize()), employee.name)
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
    const { employee, pdfKey } = await seedCandidate()

    const preview = await previewCandidatePurge(employee.id)

    assert.equal(preview!.exerciseResults, 1)
    assert.equal(preview!.documents, 1)
    assert.equal(preview!.filesDeleted, 2)
    assert.isNotNull(await Employee.find(employee.id))
    assert.isTrue(cloud.has(pdfKey))
  })

  test('renvoie null pour un candidat introuvable', async ({ assert }) => {
    assert.isNull(await purgeCandidate(999_999_999))
    assert.isNull(await previewCandidatePurge(999_999_999))
  })
})

test.group('candidate_data_service | export', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })
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
    assert.deepEqual(snapshot.payments, [])
    assert.notInclude(json, 'password')
    assert.notInclude(json, user.password)
  })

  test('l’export d’un particulier liste ses paiements du forfait (#94)', async ({ assert }) => {
    const { employee } = await createB2cCandidate({ paid: true })

    const loaded = await loadCandidateForExport(employee.id)
    const snapshot = candidateDataSnapshot(loaded!)

    assert.lengthOf(snapshot.payments, 1)
    assert.equal(snapshot.payments[0].status, 'paid')
    assert.equal(snapshot.payments[0].provider, 'stripe')
    assert.isNotNull(snapshot.payments[0].paidAt)
    assert.match(snapshot.payments[0].stripeCheckoutSessionId ?? '', /^cs_test_/)
  })

  test('l’export d’un particulier liste ses demandes d’accompagnement (#106)', async ({
    assert,
  }) => {
    const { employee } = await createB2cCandidate({ paid: true })
    await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
      message: 'Je veux construire mon plan.',
    })
      .apply('declined')
      .create()

    const loaded = await loadCandidateForExport(employee.id)
    const snapshot = candidateDataSnapshot(loaded!)

    assert.lengthOf(snapshot.expertRequests, 1)
    assert.include(snapshot.expertRequests[0], {
      status: 'declined',
      message: 'Je veux construire mon plan.',
      declineReason: 'Aucun expert disponible pour le moment',
    })
    assert.isNotNull(snapshot.expertRequests[0].createdAt)
    assert.isNotNull(snapshot.expertRequests[0].handledAt)
  })

  test('l’archive contient la liste et le contenu des documents déposés', async ({ assert }) => {
    const { employee } = await seedCandidate()
    const [document] = await Media.query().where('entityId', employee.id)

    const loaded = await loadCandidateForExport(employee.id)
    const chunks: Buffer[] = []
    for await (const chunk of await buildCandidateExportArchive(loaded!)) {
      chunks.push(Buffer.from(chunk))
    }
    const zip = Buffer.concat(chunks).toString('latin1')

    assert.include(zip, `documents/${document.id}_Dipl`)
    assert.include(zip, CANDIDATE_DATA_FILENAME)
    const snapshot = candidateDataSnapshot(loaded!, [document])
    assert.deepEqual(snapshot.documents, [
      {
        kind: document.kind,
        originalFilename: 'Diplôme 2020.pdf',
        bytes: document.bytes,
        createdAt: document.createdAt.toISO(),
        file: `documents/${document.id}_Diplôme 2020.pdf`,
      },
    ])
  })
})

test.group('commandes candidate:export et candidate:purge', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    swapFakeCloudinary()
    return () => restoreCloudinary()
  })
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

  test('candidate:purge affiche les compteurs des demandes et des paiements conservés (#106)', async ({
    assert,
  }) => {
    const { employee } = await createB2cCandidate({ paid: true })
    await ExpertRequestFactory.merge({
      employeeId: employee.id,
      organizationId: employee.organizationId,
    }).create()

    const command = await ace.create(CandidatePurge, [String(employee.id), '--force'])
    await command.exec()

    command.assertSucceeded()
    command.assertLogMatches(/1 demande\(s\) d'accompagnement supprimée\(s\)/)
    command.assertLogMatches(/1 paiement\(s\) conservé\(s\) comme pièce comptable/)
    assert.isNull(await Employee.find(employee.id))
    assert.lengthOf(await CandidatePayment.query().whereNull('employeeId'), 1)
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
