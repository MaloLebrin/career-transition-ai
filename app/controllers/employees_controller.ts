import { mapEmployee } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import { updateEmployeeValidator } from '#validators/employee_update_validator'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

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

  public async update({ params, request, auth, response }: HttpContext) {
    const organizationId = auth.user?.organizationId ?? null

    const payload = await request.validateUsing(updateEmployeeValidator)

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

    employee.merge({
      advisorNotes: payload.advisorNotes ?? employee.advisorNotes,
      status: payload.status ?? employee.status,
      targetRole: payload.targetRole ?? employee.targetRole,
      summary: payload.summary ?? employee.summary,
      name: payload.name ?? employee.name,
      currentRole: payload.currentRole ?? employee.currentRole,
      onboarded: typeof payload.onboarded === 'boolean' ? payload.onboarded : employee.onboarded,
      nextAppointment: payload.nextAppointment
        ? DateTime.fromISO(payload.nextAppointment)
        : employee.nextAppointment,
    })

    await employee.save()

    const data = mapEmployee(employee)

    return response.json(data)
  }
}
