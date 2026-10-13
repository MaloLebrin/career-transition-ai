import OrganizationTeamController from '#controllers/organization_team_controller'
import User from '#models/user'
import { TeamMembersService } from '#services/team_members_service'
import { createAdmin, createAdvisor } from '#tests/support/actors'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

function makeCtx(actor: User, params: Record<string, string>, body: Record<string, unknown> = {}) {
  const flashes: Record<string, unknown> = {}
  const redirects: string[] = []
  return {
    auth: { user: actor },
    params,
    request: { validateUsing: async () => body },
    session: { flash: (key: string, value: unknown) => (flashes[key] = value) },
    response: { redirect: (url: string) => redirects.push(url) },
    flashes,
    redirects,
  } as any
}

const controller = () => new OrganizationTeamController(new TeamMembersService())

async function orgOf(user: { related: (r: 'organization') => any }) {
  const organization = await user.related('organization').query().firstOrFail()
  return organization
}

test.group('OrganizationTeamController (#71)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('updateRole change le rôle, flashe et revient aux réglages', async ({ assert }) => {
    const admin = await createAdmin()
    const member = await createAdvisor(await orgOf(admin))
    const ctx = makeCtx(admin, { id: String(member.id) }, { role: 'admin' })

    await controller().updateRole(ctx)

    await member.refresh()
    assert.equal(member.role, 'admin')
    assert.equal(ctx.flashes.success, 'Rôle mis à jour.')
    assert.deepEqual(ctx.redirects, ['/dashboard/conseiller/settings'])
  })

  test('disable puis enable coupent et rétablissent l’accès', async ({ assert }) => {
    const admin = await createAdmin()
    const member = await createAdvisor(await orgOf(admin))

    const off = makeCtx(admin, { id: String(member.id) })
    await controller().disable(off)
    await member.refresh()
    assert.isNotNull(member.disabledAt)
    assert.equal(off.flashes.success, 'Accès retiré.')

    const on = makeCtx(admin, { id: String(member.id) })
    await controller().enable(on)
    await member.refresh()
    assert.isNull(member.disabledAt)
    assert.equal(on.flashes.success, 'Accès rétabli.')
  })

  test('reassign annonce le nombre de candidats déplacés', async ({ assert }) => {
    const admin = await createAdmin()
    const member = await createAdvisor(await orgOf(admin))
    const empty = makeCtx(admin, { id: String(member.id) }, { toUserId: admin.id })

    await controller().reassign(empty)

    assert.equal(empty.flashes.success, 'Aucun candidat à réassigner.')
  })
})
