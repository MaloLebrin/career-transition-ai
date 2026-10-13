import {
  SkillAlreadyExistsError,
  SkillInUseError,
  SkillNotFoundError,
} from '#exceptions/skill_errors'
import Skill from '#models/skill'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import type { Paginated } from '#shared/types/pagination'
import type { SkillInput, SkillItem, SkillListParams } from '#shared/types/skill/admin'
import { paginationMeta, whereAnyColumnContains } from '#utils/pagination'
import db from '@adonisjs/lucid/services/db'

/**
 * Catalogue de compétences global géré par le super admin : les compétences sans
 * organisation (`skills.organization_id` nul). Celles propres à un cabinet restent
 * du ressort de ce cabinet.
 */
export class SuperAdminSkillsService {
  public async list(params: SkillListParams): Promise<Paginated<SkillItem>> {
    const query = Skill.query()
      .whereNull('organizationId')
      .whereNull('deletedAt')
      .withCount('employees', (q) => q.as('employeesCount'))
      .orderBy([
        { column: 'name', order: 'asc' },
        { column: 'id', order: 'asc' },
      ])
    whereAnyColumnContains(query, ['name', 'category'], params.search)

    const paginator = await query.paginate(params.page, LIST_PAGE_SIZE)
    return {
      items: paginator.all().map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        employeesCount: Number(skill.$extras.employeesCount),
      })),
      pagination: paginationMeta(paginator, LIST_PAGE_SIZE),
    }
  }

  public async create(input: SkillInput): Promise<Skill> {
    const name = input.name.trim()
    await this.assertNameFree(name)
    return Skill.create({ name, category: this.normalizeCategory(input.category) })
  }

  public async update(id: number, input: SkillInput): Promise<Skill> {
    const skill = await this.findGlobal(id)
    const name = input.name.trim()
    await this.assertNameFree(name, skill.id)
    skill.name = name
    skill.category = this.normalizeCategory(input.category)
    await skill.save()
    return skill
  }

  /** Supprime une compétence du catalogue ; refusée tant que des candidats la portent. */
  public async destroy(id: number): Promise<void> {
    const skill = await this.findGlobal(id)
    const [row] = await db.from('employee_skills').where('skill_id', skill.id).count('* as total')
    if (Number(row.total) > 0) throw new SkillInUseError()
    await skill.delete()
  }

  private normalizeCategory(category: string | null | undefined): string | null {
    const trimmed = category?.trim()
    return trimmed ? trimmed : null
  }

  private async assertNameFree(name: string, exceptId?: number) {
    const existing = await Skill.query()
      .whereNull('organizationId')
      .whereNull('deletedAt')
      .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
      .if(exceptId !== undefined, (q) => q.whereNot('id', exceptId!))
      .first()
    if (existing) throw new SkillAlreadyExistsError()
  }

  private async findGlobal(id: number): Promise<Skill> {
    const skill = await Skill.query()
      .where('id', id)
      .whereNull('organizationId')
      .whereNull('deletedAt')
      .first()
    if (!skill) throw new SkillNotFoundError()
    return skill
  }
}
