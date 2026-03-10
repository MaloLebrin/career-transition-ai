import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  buildDossierArchive,
  dossierZipFilename,
} from '#services/dossier_export_service'
import Employee from '#models/employee'
import Organization from '#models/organization'
import ExerciseResult, {
  EXERCICE_RESULTS_TYPES,
  exerciceResultStatusValues,
} from '#models/exercise_result'

test.group('dossier_export_service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('dossierZipFilename returns safe filename', ({ assert }) => {
    assert.equal(dossierZipFilename('Jean Dupont'), 'Dossier_Jean_Dupont.zip')
    assert.equal(dossierZipFilename('Marie-Claire'), 'Dossier_Marie-Claire.zip')
    assert.include(dossierZipFilename('  '), 'Dossier_')
    assert.include(dossierZipFilename(''), 'candidat')
  })

  test('buildDossierArchive returns stream with pipe and produces zip entries', async ({
    assert,
  }) => {
    const org = await Organization.create({
      name: 'Dossier Test Org',
      slug: `dossier-test-org-${Date.now()}`,
      logoUrl: null,
    })
    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Archive Test',
      email: `archive-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: null,
      summary: 'Summary',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
      nextAppointment: null,
    })
    await employee.load((loader) =>
      loader.load('experiences').load('educations').load('skills').load('exerciseResults')
    )

    const archive = await buildDossierArchive(employee)
    assert.isDefined(archive.pipe)
    assert.isFunction(archive.pipe)
    assert.isFunction(archive.finalize)

    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('end', () => resolve())
      archive.on('error', reject)
    })
    const total = Buffer.concat(chunks)
    assert.isTrue(total.length > 0)
    assert.isTrue(total[0] === 0x50 && total[1] === 0x4b)
  })

  test('buildDossierArchive includes profil and resultats when employee has data', async ({
    assert,
  }) => {
    const org = await Organization.create({
      name: 'Dossier Full Org',
      slug: `dossier-full-org-${Date.now()}`,
      logoUrl: null,
    })
    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Full Candidate',
      email: `full-${Date.now()}@example.com`,
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'My summary',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
      nextAppointment: null,
    })

    await ExerciseResult.create({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      date: null,
      duration: 60,
      data: { ranked: ['a', 'b'] },
      quantitativeScore: 8,
      qualitativeAnalysis: 'Good',
    })

    await employee.load((loader) =>
      loader.load('experiences').load('educations').load('skills').load('exerciseResults')
    )

    const archive = await buildDossierArchive(employee)
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('end', () => resolve())
      archive.on('error', reject)
    })
    const total = Buffer.concat(chunks).toString('binary')
    assert.include(total, 'profil.pdf')
    assert.include(total, 'resultats/')
    assert.include(total, 'motivation')
  })
})
