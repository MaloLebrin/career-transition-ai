import EmailAlreadyUsedException from '#exceptions/email_already_used_exception'
import Education from '#models/education'
import Employee from '#models/employee'
import EmployeeSkill from '#models/employee_skill'
import Experience from '#models/experience'
import Skill from '#models/skill'
import User from '#models/user'
import { EmployeesService } from '#services/employees_service'
import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { EXPERIENCES_TYPES } from '#shared/constants/experience'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type Payload = {
  name?: string
  email?: string
  currentRole?: string
  targetRole?: string
  summary?: string
  onboarded?: boolean
  experiences?: Array<{
    title?: string
    company?: string
    type?: string
    startDate?: string
    endDate?: string | null
    isCurrent?: boolean
    description?: string
  }>
  educations?: Array<{
    degree?: string
    school?: string
    startDate?: string
    endDate?: string | null
    isCurrent?: boolean
    description?: string
  }>
  skills?: Array<{
    name?: string
    level?: number
  }>
}

type UpdateOptions = {
  /**
   * When true, forces onboarded=true and status=active (used by onboarding completion).
   */
  forceOnboarded?: boolean
}

@inject()
export class CandidatProfileService {
  constructor(private employeesService: EmployeesService) {}

  private parseLenientDate(raw?: string | null): DateTime | null {
    const value = (raw ?? '').trim()
    if (!value) return null

    // Accept YYYY-MM
    if (/^\d{4}-\d{2}$/.test(value)) {
      const dt = DateTime.fromFormat(value, 'yyyy-MM')
      return dt.isValid ? dt.startOf('month') : null
    }

    // Accept ISO-like (YYYY-MM-DD or YYYY-MM-01)
    const dt = DateTime.fromISO(value)
    return dt.isValid ? dt : null
  }

  private mapFrontExperienceTypeToDb(raw?: string | null): string | null {
    const value = (raw ?? '').trim()
    if (!value) return null

    const lower = value.toLowerCase()
    if (Object.values(EXPERIENCES_TYPES).includes(lower as any)) {
      return lower
    }

    switch (value) {
      case 'CDI':
        return EXPERIENCES_TYPES.CDI
      case 'CDD':
        return EXPERIENCES_TYPES.CDD
      case 'Alternance':
        return EXPERIENCES_TYPES.ALTERNANCE
      case 'Freelance':
        return EXPERIENCES_TYPES.FREELANCE
      case 'Stage':
        return EXPERIENCES_TYPES.OTHER
      default:
        return EXPERIENCES_TYPES.OTHER
    }
  }

  private normalizeLevel(level: unknown): number {
    const n = Number(level)
    if (Number.isNaN(n)) return 3
    return Math.min(5, Math.max(1, Math.round(n)))
  }

  /**
   * Updates the authenticated candidate's User + Employee, and optionally syncs arrays.
   * Arrays are synced "exactly" only when provided (delete + recreate).
   */
  public async updateForUser(user: User, payload: Payload, options?: UpdateOptions) {
    const forceOnboarded = options?.forceOnboarded === true

    const effectivePayload: Payload = forceOnboarded
      ? {
          ...payload,
          onboarded: true,
        }
      : payload

    const hasArrays =
      effectivePayload.experiences !== undefined ||
      effectivePayload.educations !== undefined ||
      effectivePayload.skills !== undefined

    const trx = hasArrays ? await db.transaction() : null

    try {
      // Update user
      if (effectivePayload.name !== undefined || effectivePayload.email !== undefined) {
        const nextName = effectivePayload.name ?? user.name
        const nextEmail = effectivePayload.email ?? user.email

        if (trx) {
          if (nextEmail !== user.email) {
            const existing = await User.query({ client: trx })
              .where('email', nextEmail)
              .whereNot('id', '=', user.id)
              .first()
            if (existing) throw new EmailAlreadyUsedException()
          }
          user.merge({ name: nextName, email: nextEmail })
          await user.useTransaction(trx).save()
        } else {
          // no transaction => keep existing AuthService behavior elsewhere; here we do minimal update
          if (nextEmail !== user.email) {
            const existing = await User.query()
              .where('email', nextEmail)
              .whereNot('id', '=', user.id)
              .first()
            if (existing) throw new EmailAlreadyUsedException()
          }
          user.merge({ name: nextName, email: nextEmail })
          await user.save()
        }
      }

      // Load employee
      const employee = trx
        ? await Employee.query({ client: trx })
            .where('userId', user.id)
            .where('organizationId', user.organizationId)
            .firstOrFail()
        : await this.employeesService.getEmployeeForUser(user)

      this.employeesService.applyUpdate(employee, {
        name: effectivePayload.name ?? employee.name,
        currentRole: effectivePayload.currentRole ?? employee.currentRole,
        targetRole: effectivePayload.targetRole ?? employee.targetRole ?? undefined,
        summary: effectivePayload.summary ?? employee.summary ?? undefined,
        onboarded: effectivePayload.onboarded ?? employee.onboarded,
        status:
          effectivePayload.onboarded === true || forceOnboarded
            ? EMPLOYEES_STATUS.ACTIVE
            : undefined,
      })

      if (trx) employee.useTransaction(trx)
      await employee.save()

      if (trx) {
        if (effectivePayload.experiences !== undefined) {
          await Experience.query({ client: trx }).where('employeeId', employee.id).delete()
          for (const exp of effectivePayload.experiences ?? []) {
            const title = (exp.title ?? '').trim()
            const company = (exp.company ?? '').trim()
            const start = this.parseLenientDate(exp.startDate)
            if (!title || !company || !start) continue
            const end = this.parseLenientDate(exp.endDate ?? null)

            await Experience.create(
              {
                employeeId: employee.id,
                title,
                company,
                type: this.mapFrontExperienceTypeToDb(exp.type) as any,
                startDate: start,
                endDate: end,
                isCurrent: exp.isCurrent === true,
                description: (exp.description ?? '').trim() || null,
                sortOrder: null,
              },
              { client: trx }
            )
          }
        }

        if (effectivePayload.educations !== undefined) {
          await Education.query({ client: trx }).where('employeeId', employee.id).delete()
          for (const edu of effectivePayload.educations ?? []) {
            const degree = (edu.degree ?? '').trim()
            const school = (edu.school ?? '').trim()
            const start = this.parseLenientDate(edu.startDate)
            if (!degree || !school || !start) continue
            const end = this.parseLenientDate(edu.endDate ?? null)

            await Education.create(
              {
                employeeId: employee.id,
                degree,
                school,
                startDate: start,
                endDate: end,
                isCurrent: edu.isCurrent === true,
                description: (edu.description ?? '').trim() || null,
                sortOrder: null,
              },
              { client: trx }
            )
          }
        }

        if (effectivePayload.skills !== undefined) {
          await EmployeeSkill.query({ client: trx }).where('employeeId', employee.id).delete()
          for (const s of effectivePayload.skills ?? []) {
            const name = String(s.name ?? '').trim()
            if (!name) continue
            const level = this.normalizeLevel(s.level)

            const existing = await Skill.query({ client: trx })
              .where((q) =>
                q.where('organizationId', employee.organizationId).orWhereNull('organizationId')
              )
              .where('name', name)
              .whereNull('deletedAt')
              .first()

            const skill = existing
              ? existing
              : await Skill.create(
                  { organizationId: employee.organizationId, name, category: null },
                  { client: trx }
                )

            await EmployeeSkill.create(
              {
                employeeId: employee.id,
                skillId: skill.id,
                level,
              },
              { client: trx }
            )
          }
        }

        await trx.commit()
      }

      return { user, employee }
    } catch (err) {
      if (trx) await trx.rollback()
      throw err
    }
  }
}
