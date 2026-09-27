import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Employee from '#models/employee'
import Education from '#models/education'
import Experience from '#models/experience'
import ExerciseResult from '#models/exercise_result'
import SupportPlanStep from '#models/support_plan_step'
import SupportPlanStepExercise from '#models/support_plan_step_exercise'
import EmployeeTransformer from '#transformers/employee_transformer'
import { SkillFactory } from '#database/factories/skill_factory'
import { APPOINTMENTS_STATUSES } from '#shared/constants/appointment'
import { EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import { createCandidate } from '#tests/support/actors'

async function createStep(employeeId: number, title: string, sortOrder: number) {
  return SupportPlanStep.create({
    employeeId,
    title,
    status: APPOINTMENTS_STATUSES.SCHEDULED,
    completed: false,
    isLocked: false,
    sortOrder,
  })
}

/** Employé avec toutes les relations que le transformer renomme. */
async function seedFullEmployee() {
  const { employee } = await createCandidate()
  const skill = await SkillFactory.merge({ name: 'Leadership' }).create()
  await employee.related('skills').attach({ [skill.id]: { level: 4 } })

  await ExerciseResult.create({
    employeeId: employee.id,
    type: EXERCICE_RESULTS_TYPES.DISC,
    status: 'completed',
    data: { scores: { D: 1 } },
  })

  const withExercises = await createStep(employee.id, 'Bilan', 1)
  await SupportPlanStepExercise.createMany([
    { supportPlanStepId: withExercises.id, exerciseType: EXERCICE_RESULTS_TYPES.VALUES },
    { supportPlanStepId: withExercises.id, exerciseType: EXERCICE_RESULTS_TYPES.CV_ANALYSIS },
  ])
  await createStep(employee.id, 'Suivi', 2)

  await Experience.create({
    employeeId: employee.id,
    title: 'Développeuse',
    company: 'ACME',
    type: EXPERIENCES_TYPES.CDI,
    startDate: DateTime.fromISO('2020-01-01'),
    endDate: null,
    isCurrent: true,
    description: null,
  })
  await Education.create({
    employeeId: employee.id,
    degree: 'Master',
    school: 'Université',
    startDate: DateTime.fromISO('2015-09-01'),
    endDate: DateTime.fromISO('2017-06-30'),
    isCurrent: false,
    description: null,
  })

  return Employee.query()
    .where('id', employee.id)
    .preload('skills', (q) => q.pivotColumns(['level']))
    .preload('exerciseResults')
    .preload('supportPlanSteps', (q) => q.orderBy('sort_order', 'asc').preload('exercises'))
    .preload('experiences')
    .preload('educations')
    .firstOrFail()
}

test.group('EmployeeTransformer', () => {
  test('renomme les relations préchargées et expose le niveau de compétence du pivot', async ({
    assert,
  }) => {
    const employee = await seedFullEmployee()

    const output = new EmployeeTransformer(employee).toObject() as Record<string, any>

    assert.equal(output.id, employee.id)
    assert.equal(output.name, employee.name)
    // Les relations brutes sont retirées au profit des clés attendues par le front.
    assert.notProperty(output, 'exerciseResults')
    assert.notProperty(output, 'supportPlanSteps')

    assert.lengthOf(output.skills, 1)
    assert.equal(output.skills[0].name, 'Leadership')
    assert.equal(output.skills[0].level, 4)

    assert.lengthOf(output.exercises, 1)
    assert.equal(output.exercises[0].type, 'disc')

    assert.lengthOf(output.experiences, 1)
    assert.equal(output.experiences[0].title, 'Développeuse')
    assert.lengthOf(output.educations, 1)
    assert.equal(output.educations[0].degree, 'Master')
  })

  test('mappe les exercices associés des étapes vers les types front', async ({ assert }) => {
    const employee = await seedFullEmployee()

    const output = new EmployeeTransformer(employee).toObject() as Record<string, any>

    assert.lengthOf(output.plan, 2)
    const [bilan, suivi] = output.plan
    assert.equal(bilan.title, 'Bilan')
    assert.sameMembers(bilan.associatedExercises, ['VALUES', 'CV_ANALYSIS'])
    // Une étape sans exercice n'expose pas de tableau vide.
    assert.equal(suivi.title, 'Suivi')
    assert.isUndefined(suivi.associatedExercises)
  })

  test('laisse les relations non préchargées à undefined', async ({ assert }) => {
    const { employee } = await createCandidate()
    const fresh = await Employee.findOrFail(employee.id)

    const output = new EmployeeTransformer(fresh).toObject() as Record<string, any>

    assert.equal(output.id, employee.id)
    assert.isUndefined(output.skills)
    assert.isUndefined(output.exercises)
    assert.isUndefined(output.plan)
    assert.isUndefined(output.experiences)
    assert.isUndefined(output.educations)
  })
})
