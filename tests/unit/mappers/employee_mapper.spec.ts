import { exerciceTypeToFront, mapEmployee } from '#mappers/employee_mapper'
import Appointment from '#models/appointment'
import Education from '#models/education'
import Employee from '#models/employee'
import ExerciseResult from '#models/exercise_result'
import Experience from '#models/experience'
import Organization from '#models/organization'
import Skill from '#models/skill'
import SupportPlanStep from '#models/support_plan_step'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'

test.group('Employee mapper', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('maps exercice type enum to front constant', ({ assert }) => {
    assert.equal(exerciceTypeToFront('motivation'), 'MOTIVATION')
    assert.equal(exerciceTypeToFront('values'), 'VALUES')
    assert.equal(exerciceTypeToFront('disc'), 'DISC')
  })

  test('maps employee with relations to EmployeeDto shape', async ({ assert }) => {
    const org = await Organization.create({
      name: 'Mapper Org',
      slug: `mapper-org-${Date.now()}`,
      logoUrl: null,
    })
    const orgId = org.id

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Jane Doe',
      email: 'jane@example.com',
      currentRole: 'Développeuse',
      targetRole: 'Lead Dev',
      summary: 'Résumé',
      advisorNotes: 'Notes',
      status: 'active',
      onboarded: true,
      nextAppointment: DateTime.fromISO('2025-01-10T10:00:00'),
    })

    await Experience.create({
      employeeId: employee.id,
      title: 'Dev',
      company: 'ACME',
      type: 'cdi',
      startDate: DateTime.fromISO('2020-01-01'),
      endDate: DateTime.fromISO('2021-01-01'),
      isCurrent: false,
      description: 'Expérience',
      sortOrder: 1,
    })

    await Education.create({
      employeeId: employee.id,
      degree: 'Master',
      school: 'ENS',
      startDate: DateTime.fromISO('2015-01-01'),
      endDate: DateTime.fromISO('2018-01-01'),
      isCurrent: false,
      description: 'Formation',
      sortOrder: 1,
    })

    const skill = await Skill.create({
      organizationId: orgId,
      name: 'React',
      slug: null,
      category: null,
    })
    await employee.related('skills').attach({
      [skill.id]: { level: 4 },
    })

    await ExerciseResult.create({
      employeeId: employee.id,
      type: 'motivation',
      status: 'completed',
      date: DateTime.fromISO('2025-01-02'),
      duration: 30,
      data: { foo: 'bar' },
      quantitativeScore: 10,
      qualitativeAnalysis: 'Analyse',
    })

    await SupportPlanStep.create({
      employeeId: employee.id,
      title: 'Étape 1',
      description: 'Description',
      dueDate: DateTime.fromISO('2025-01-15'),
      completed: false,
      notes: 'Note',
      associatedExercise: 'motivation',
      sortOrder: 1,
    })

    await Appointment.create({
      organizationId: orgId,
      employeeId: employee.id,
      advisorId: null,
      scheduledAt: DateTime.fromISO('2025-01-20T09:00:00'),
      endedAt: null,
      type: 'coaching',
      status: 'scheduled',
      notes: null,
      locationOrLink: null,
    })

    const loaded = await Employee.query()
      .where('id', employee.id)
      .preload('experiences')
      .preload('educations')
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')
      .firstOrFail()

    const dto = mapEmployee(loaded)

    assert.equal(dto.id, employee.id)
    assert.equal(dto.organizationId, orgId)
    assert.isUndefined(dto.advisorId)
    assert.equal(dto.name, 'Jane Doe')
    assert.equal(dto.currentRole, 'Développeuse')
    assert.equal(dto.targetRole, 'Lead Dev')
    assert.equal(dto.status, 'active')
    assert.isTrue(dto.onboarded)

    assert.lengthOf(dto.skills, 1)
    assert.equal(dto.skills[0].name, 'React')
    assert.isNumber(dto.skills[0].level)
    assert.isTrue(dto.skills[0].level >= 1 && dto.skills[0].level <= 5)

    assert.lengthOf(dto.experiences, 1)
    assert.equal(dto.experiences[0].type, 'CDI')

    assert.lengthOf(dto.educations, 1)
    assert.equal(dto.educations[0].degree, 'Master')

    assert.lengthOf(dto.exercises, 1)
    assert.equal(dto.exercises[0].type, 'MOTIVATION')
    assert.equal(dto.exercises[0].quantitativeScore, 10)

    assert.lengthOf(dto.plan, 1)
    assert.equal(dto.plan[0].associatedExercise, 'MOTIVATION')

    assert.isDefined(dto.nextAppointment)
  })
})
