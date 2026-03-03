import type { HttpContext } from '@adonisjs/core/http'
import Employee from '#models/employee'
import { mapEmployee } from '#mappers/employee_mapper'

export default class EmployeesController {
  public async index({ auth, response }: HttpContext) {
    const user = auth.user
    const organizationId = user?.organizationId ?? null
    const advisorId = user?.id ?? null

    const query = Employee.query()
      .if(organizationId !== null, (q) => q.where('organizationId', organizationId!))
      .if(advisorId !== null, (q) => q.where('advisorId', advisorId!))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const employees = await query

    const data = employees.map(mapEmployee)

    return response.json(data)
  }

  public async show({ params, auth, response }: HttpContext) {
    const organizationId = auth.user?.organizationId ?? null

    const employeeQuery = Employee.query()
      .where('id', Number(params.id))
      .if(organizationId !== null, (q) => q.where('organizationId', organizationId!))
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const employee = await employeeQuery.firstOrFail()

    const data = mapEmployee(employee)

    return response.json(data)
  }
}

