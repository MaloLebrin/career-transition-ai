import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { EmployeesService } from '#services/employees_service'
import Employee from '#models/employee'

test.group('EmployeesService', () => {
  test('create creates an employee and returns EmployeeDto', async ({ assert }) => {
    const service = new EmployeesService()

    const dto = await service.create({
      organizationId: 1,
      advisorId: null,
      name: 'New Candidate',
      email: 'new@example.com',
      currentRole: 'Développeur',
      targetRole: 'Lead Dev',
      summary: 'Résumé',
    })

    assert.equal(dto.name, 'New Candidate')
    assert.equal(dto.email, 'new@example.com')
    assert.equal(dto.organizationId, '1')
    assert.equal(dto.currentRole, 'Développeur')
    assert.equal(dto.targetRole, 'Lead Dev')
    // status may rely on DB default; just ensure it's one of expected values when set
    if (dto.status) {
      assert.include(['active', 'completed', 'on-hold'], dto.status)
    }
    assert.isFalse(dto.onboarded)
  })

  test('applyUpdate merges fields correctly', async ({ assert }) => {
    const service = new EmployeesService()

    const employee = await Employee.create({
      organizationId: 1,
      advisorId: null,
      userId: null,
      name: 'Jane Doe',
      email: 'jane@example.com',
      currentRole: 'Dev',
      targetRole: 'Lead',
      summary: 'Old summary',
      advisorNotes: 'Old notes',
      status: 'active',
      onboarded: false,
      nextAppointment: DateTime.fromISO('2025-01-10T10:00:00'),
    })

    service.applyUpdate(employee, {
      advisorNotes: 'New notes',
      targetRole: 'Manager',
      summary: 'New summary',
      currentRole: 'Senior Dev',
      onboarded: true,
    })

    assert.equal(employee.advisorNotes, 'New notes')
    assert.equal(employee.targetRole, 'Manager')
    assert.equal(employee.summary, 'New summary')
    assert.equal(employee.currentRole, 'Senior Dev')
    assert.isTrue(employee.onboarded)
  })
})

