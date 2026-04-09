import Employee from '#models/employee'
import EmployeeSynthesis, { EMPLOYEE_SYNTHESIS_SHARE_STATUSES } from '#models/employee_synthesis'
import Organization from '#models/organization'
import { EmployeeSynthesisService } from '#services/employee_synthesis_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('EmployeeSynthesisService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('buildForCandidate never exposes internal notes', async ({ assert }) => {
    const service = new EmployeeSynthesisService()
    const org = await Organization.create({
      name: 'Synth Org',
      slug: `synth-org-${Date.now()}`,
      logoUrl: null,
    })

    const employee = await Employee.create({
      organizationId: org.id,
      advisorId: null,
      userId: null,
      name: 'Candidate',
      email: 'candidate@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: null,
      advisorNotes: null,
      status: 'active',
      onboarded: true,
    })

    await EmployeeSynthesis.create({
      organizationId: org.id,
      employeeId: employee.id,
      shareStatus: EMPLOYEE_SYNTHESIS_SHARE_STATUSES.SHARED,
      sharedAt: null,
      sharedByUserId: null,
      expertCommentsShared: 'Visible',
      expertNotesInternal: 'SECRET',
      executiveSummaryOverride: null,
    })

    const payload = await service.buildForCandidate({
      organizationId: org.id,
      employeeId: employee.id,
    })

    assert.equal(payload.synthesis.expertCommentsShared, 'Visible')
    assert.isUndefined((payload.synthesis as any).expertNotesInternal)
  })
})

