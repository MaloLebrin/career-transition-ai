import SuperAdminSkillsController from '#controllers/super_admin_skills_controller'
import Skill from '#models/skill'
import { SuperAdminSkillsService } from '#services/super_admin_skills_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function makeCtx(qs: Record<string, unknown> = {}, body: Record<string, unknown> = {}) {
  const flashes: Record<string, unknown> = {}
  const redirects: string[] = []
  return {
    request: { qs: () => qs, validateUsing: async () => body },
    inertia: {
      rendered: null as { name: string; props: any } | null,
      render(name: string, props: any) {
        this.rendered = { name, props }
        return this.rendered
      },
    },
    session: { flash: (key: string, value: unknown) => (flashes[key] = value) },
    response: { redirect: () => ({ back: () => redirects.push('back') }) },
    params: {} as Record<string, unknown>,
    flashes,
    redirects,
  } as any
}

const controller = () => new SuperAdminSkillsController(new SuperAdminSkillsService())

test.group('SuperAdminSkillsController (#73)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('index rend le catalogue filtré', async ({ assert }) => {
    await Skill.create({ name: 'Zythologie', organizationId: null })
    const ctx = makeCtx({ search: 'zytho' })

    await controller().index(ctx)

    assert.equal(ctx.inertia.rendered.name, 'dashboard/admin/skills/Index')
    assert.deepEqual(
      ctx.inertia.rendered.props.skills.map((s: { name: string }) => s.name),
      ['Zythologie']
    )
    assert.deepEqual(ctx.inertia.rendered.props.filters, { search: 'zytho' })
  })

  test('store, update et destroy flashent et reviennent en arrière', async ({ assert }) => {
    const storeCtx = makeCtx({}, { name: 'Négociation fine', category: 'Commercial' })
    await controller().store(storeCtx)
    const skill = await Skill.findByOrFail('name', 'Négociation fine')
    assert.equal(storeCtx.flashes.success, 'Compétence ajoutée au catalogue.')

    const updateCtx = makeCtx({}, { name: 'Négociation experte' })
    updateCtx.params = { id: String(skill.id) }
    await controller().update(updateCtx)
    await skill.refresh()
    assert.equal(skill.name, 'Négociation experte')
    assert.isNull(skill.category)

    const destroyCtx = makeCtx()
    destroyCtx.params = { id: String(skill.id) }
    await controller().destroy(destroyCtx)
    assert.isNull(await Skill.find(skill.id))
    assert.deepEqual(destroyCtx.redirects, ['back'])
  })
})
