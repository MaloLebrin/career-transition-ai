import Employee from '#models/employee'
import EmployeeTransformer, { employeeToObject } from '#transformers/employee_transformer'
import { test } from '@japa/runner'

function inMemoryEmployee() {
  const employee = new Employee()
  employee.merge({
    id: 1,
    organizationId: 2,
    name: 'Jane',
    email: 'jane@example.com',
    currentRole: 'Dev',
    advisorNotes: 'Note confidentielle',
  })
  return employee
}

test.group('employee_transformer — advisorNotes', () => {
  test('le transformer d’équipe garde les notes du conseiller', ({ assert }) => {
    const object = new EmployeeTransformer(inMemoryEmployee()).toObject() as Record<string, unknown>
    assert.equal(object.advisorNotes, 'Note confidentielle')
  })

  test('employeeToObject (pages candidat) les retire', ({ assert }) => {
    const object = employeeToObject(inMemoryEmployee())
    assert.notProperty(object, 'advisorNotes')
    assert.notInclude(JSON.stringify(object), 'Note confidentielle')
    assert.equal((object as { name: string }).name, 'Jane')
  })
})
