import { USERS_ROLES } from '#models/user'
import { mapEmployee } from '#mappers/employee_mapper'
import Employee from '#models/employee'
import { EmployeesService } from '#services/employees_service'
import { createEmployeeValidator } from '#validators/employee_create_validator'
import { updateEmployeeValidator } from '#validators/employee_update_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  public async index({ auth, response }: HttpContext) {
    const user = auth.user
    const organizationId = user?.organizationId ?? null
    // Admin sees all org employees; advisor sees only their advised employees
    const advisorId =
      user?.role === USERS_ROLES.ADVISOR ? user.id : null

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

  public async store({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized()
    }

    const payload = await request.validateUsing(createEmployeeValidator)

    const dto = await this.employeesService.create({
      organizationId: user.organizationId,
      advisorId: user.id,
      ...payload,
    })

    return response.json(dto)
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

    this.employeesService.applyUpdate(employee, payload)
    await employee.save()

    const data = mapEmployee(employee)

    return response.json(data)
  }

  /**
   * Inertia form: create employee then redirect with flash.
   */
  public async storeFromDashboard({ auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const payload = await request.validateUsing(createEmployeeValidator)

    await this.employeesService.create({
      organizationId: user.organizationId,
      advisorId: user.id,
      ...payload,
    })

    session.flash('success', 'Candidat ajouté.')
    return response.redirect('/dashboard/employees')
  }

  /**
   * Inertia form: update employee then redirect with flash.
   */
  public async updateFromDashboard({ params, auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized()

    const payload = await request.validateUsing(updateEmployeeValidator)

    const employeeQuery = Employee.query()
      .where('id', Number(params.id))
      .where('organizationId', user.organizationId)
      .preload('skills', (q) => q.pivotColumns(['level']))
      .preload('experiences')
      .preload('educations')
      .preload('exerciseResults')
      .preload('supportPlanSteps')
      .preload('appointments')

    const employee = await employeeQuery.firstOrFail()

    this.employeesService.applyUpdate(employee, payload)
    await employee.save()

    session.flash('success', 'Candidat mis à jour.')
    return response.redirect(`/dashboard/employees/${params.id}`)
  }
}
