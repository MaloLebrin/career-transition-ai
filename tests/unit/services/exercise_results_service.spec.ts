import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { ExerciseResultsService } from '#services/exercise_results_service'
import Employee from '#models/employee'
import SupportPlanStep from '#models/support_plan_step'
import { EXERCICE_RESULTS_TYPES, exerciceResultStatusValues } from '#models/exercise_result'

test.group('ExerciseResultsService', () => {
  test('saveResult creates exercise result and updates plan', async ({ assert }) => {
    const service = new ExerciseResultsService()

    const employee = await Employee.create({
      organizationId: 1,
      advisorId: null,
      userId: null,
      name: 'Exercise Candidate',
      email: 'exercise@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Résumé',
      advisorNotes: null,
      status: 'active',
      onboarded: false,
      nextAppointment: null,
    })

    const step = await SupportPlanStep.create({
      employeeId: employee.id,
      title: 'Étape exercice',
      description: 'Faire un exercice',
      dueDate: DateTime.fromISO('2025-01-10'),
      completed: false,
      notes: null,
      associatedExercise: EXERCICE_RESULTS_TYPES.MOTIVATION,
      sortOrder: 1,
    })

    const dto = await service.saveResult({
      employeeId: employee.id,
      type: EXERCICE_RESULTS_TYPES.MOTIVATION,
      status: exerciceResultStatusValues.COMPLETED,
      date: '2025-01-05',
      duration: 30,
      data: { foo: 'bar' },
      quantitativeScore: 10,
      qualitativeAnalysis: 'Analyse',
      plan: [
        {
          id: String(step.id),
          completed: true,
          lastUpdated: DateTime.fromISO('2025-01-05T10:00:00').toISO() || undefined,
        },
      ],
    })

    assert.equal(dto.id, String(employee.id))
    assert.lengthOf(dto.exercises, 1)
    assert.equal(dto.exercises[0].type, 'MOTIVATION')
    assert.equal(dto.exercises[0].quantitativeScore, 10)
    assert.lengthOf(dto.plan, 1)
    assert.isTrue(dto.plan[0].completed)
  })
})

