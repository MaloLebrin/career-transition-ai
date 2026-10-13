import { SkillFactory } from '#database/factories/skill_factory'
import { EmployeeFactory } from '#database/factories/employee_factory'
import {
  SkillAlreadyExistsError,
  SkillInUseError,
  SkillNotFoundError,
} from '#exceptions/skill_errors'
import Skill from '#models/skill'
import { SuperAdminSkillsService } from '#services/super_admin_skills_service'
import { LIST_PAGE_SIZE } from '#shared/constants/pagination'
import { createOrganization } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('SuperAdminSkillsService (#73)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const service = new SuperAdminSkillsService()
  const params = { page: 1, search: '' }

  test('create : ajoute au catalogue global (catégorie vide → null), nom unique sans casse', async ({
    assert,
  }) => {
    const skill = await service.create({ name: '  Médiation  ', category: '   ' })

    assert.equal(skill.name, 'Médiation')
    assert.isNull(skill.category)
    await skill.refresh()
    assert.isNull(skill.organizationId)
    await assert.rejects(
      () => service.create({ name: 'médiation', category: null }),
      SkillAlreadyExistsError
    )
  })

  test('list : seulement le catalogue global, avec le nombre de candidats, recherche et page', async ({
    assert,
  }) => {
    const org = await createOrganization()
    const mine = await service.create({ name: 'Zèbre rare', category: 'Animaux' })
    await Skill.create({ name: 'Zèbre privé', organizationId: org.id })
    const employee = await EmployeeFactory.merge({ organizationId: org.id }).create()
    await db.table('employee_skills').insert({
      employee_id: employee.id,
      skill_id: mine.id,
      level: 3,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const bySearch = await service.list({ ...params, search: 'zèbre' })
    const byCategory = await service.list({ ...params, search: 'animaux' })

    assert.deepEqual(
      bySearch.items.map((i) => i.name),
      ['Zèbre rare']
    )
    assert.equal(bySearch.items[0].employeesCount, 1)
    assert.deepEqual(
      byCategory.items.map((i) => i.id),
      [mine.id]
    )

    const initial = await service.list(params)
    const base = initial.pagination.total
    await SkillFactory.merge({ organizationId: null }).createMany(LIST_PAGE_SIZE)
    const page = await service.list(params)
    assert.lengthOf(page.items, LIST_PAGE_SIZE)
    assert.equal(page.pagination.total, base + LIST_PAGE_SIZE)
  })

  test('update : renomme et recatégorise ; doublon refusé ; compétence de cabinet → 404', async ({
    assert,
  }) => {
    const org = await createOrganization()
    const skill = await service.create({ name: 'Écoute', category: null })
    await service.create({ name: 'Rigueur', category: null })
    const privateSkill = await Skill.create({ name: 'Interne', organizationId: org.id })

    await service.update(skill.id, { name: 'Écoute active', category: 'Soft skills' })
    await skill.refresh()
    assert.equal(skill.name, 'Écoute active')
    assert.equal(skill.category, 'Soft skills')

    await service.update(skill.id, { name: 'Écoute active', category: 'Soft skills' })
    await assert.rejects(
      () => service.update(skill.id, { name: 'RIGUEUR', category: null }),
      SkillAlreadyExistsError
    )
    await assert.rejects(
      () => service.update(privateSkill.id, { name: 'X', category: null }),
      SkillNotFoundError
    )
  })

  test('destroy : supprime une compétence libre, refuse une compétence utilisée ou inconnue', async ({
    assert,
  }) => {
    const org = await createOrganization()
    const free = await service.create({ name: 'Libre', category: null })
    const used = await service.create({ name: 'Utilisée', category: null })
    const employee = await EmployeeFactory.merge({ organizationId: org.id }).create()
    await db.table('employee_skills').insert({
      employee_id: employee.id,
      skill_id: used.id,
      level: 2,
      created_at: new Date(),
      updated_at: new Date(),
    })

    await service.destroy(free.id)
    assert.isNull(await Skill.find(free.id))
    await assert.rejects(() => service.destroy(used.id), SkillInUseError)
    assert.isNotNull(await Skill.find(used.id))
    await assert.rejects(() => service.destroy(999999), SkillNotFoundError)
  })
})
