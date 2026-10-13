import { ContactRequestFactory } from '#database/factories/contact_request_factory'
import { EmployeeFactory } from '#database/factories/employee_factory'
import ContactRequest from '#models/contact_request'
import Organization from '#models/organization'
import Skill from '#models/skill'
import User from '#models/user'
import { CONTACT_REQUEST_STATUSES } from '#shared/constants/contact_request'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import { PASSWORD, SESSION_KEY, withPassword } from '#tests/functional/auth/helpers'
import {
  createAdmin,
  createAdvisor,
  createOrganization,
  createSuperAdmin,
} from '#tests/support/actors'
import { assertPage } from '#tests/support/inertia_page'
import { truncateDb } from '#tests/utils/db'
import { test } from '@japa/runner'

/**
 * Back-office super admin (#73) : fiche et modification d'une organisation, modification /
 * désactivation / suppression d'un utilisateur, boîte des demandes de contact, catalogue de
 * compétences, carte « demandes à traiter » de l'accueil.
 */
test.group('Super admin — organisation : fiche et modification (#73)', (group) => {
  group.each.setup(() => truncateDb())

  test('GET /organizations/:id rend la fiche avec les membres', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()
    const admin = await createAdmin(org)
    await EmployeeFactory.merge({ organizationId: org.id }).createMany(2)

    const response = await client
      .get(SUPER_ADMIN_PATHS.organization(org.id))
      .loginAs(superAdmin)
      .withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/organizations/Show', [
      'organization',
    ])
    const detail = props.organization as { employeesCount: number; members: { id: number }[] }
    assert.equal(detail.employeesCount, 2)
    assert.deepEqual(
      detail.members.map((m) => m.id),
      [admin.id]
    )
  })

  test('PUT /organizations/:id renomme ; nom pris et plateforme refusés', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await Organization.create({ name: 'Avant', slug: 'avant' })
    await Organization.create({ name: 'Déjà pris', slug: 'pris' })

    const ok = await client
      .put(SUPER_ADMIN_PATHS.organization(org.id))
      .loginAs(superAdmin)
      .withInertia()
      .header('Referer', SUPER_ADMIN_PATHS.organization(org.id))
      .form({ name: 'Après', slug: 'apres' })
      .redirects(0)
    ok.assertStatus(303)
    await org.refresh()
    assert.equal(org.name, 'Après')
    assert.equal(org.slug, 'apres')

    const taken = await client
      .put(SUPER_ADMIN_PATHS.organization(org.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'Déjà pris' })
    taken.assertStatus(409)

    const platform = await Organization.findByOrFail('isPlatform', true)
    const forbidden = await client
      .put(SUPER_ADMIN_PATHS.organization(platform.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'Piraté' })
    forbidden.assertStatus(404)
  })

  test('un conseiller ne peut ni voir ni modifier une organisation (403)', async ({ client }) => {
    const advisor = await createAdvisor()
    const org = await createOrganization()

    const show = await client
      .get(SUPER_ADMIN_PATHS.organization(org.id))
      .loginAs(advisor)
      .header('Accept', 'application/json')
    const update = await client
      .put(SUPER_ADMIN_PATHS.organization(org.id))
      .loginAs(advisor)
      .header('Accept', 'application/json')
      .json({ name: 'X' })

    show.assertStatus(403)
    update.assertStatus(403)
  })
})

test.group('Super admin — utilisateurs : modifier, désactiver, supprimer (#73)', (group) => {
  group.each.setup(() => truncateDb())

  test('PUT /users/:id modifie nom et e-mail ; e-mail déjà pris → erreur', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()
    const target = await createAdvisor(org)
    const other = await createAdvisor(org)

    const ok = await client
      .put(SUPER_ADMIN_PATHS.user(target.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'Nouveau', email: 'nouveau@mail.test' })
      .redirects(0)
    ok.assertStatus(302)
    await target.refresh()
    assert.equal(target.name, 'Nouveau')
    assert.equal(target.email, 'nouveau@mail.test')

    const taken = await client
      .put(SUPER_ADMIN_PATHS.user(target.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'Nouveau', email: other.email })
    taken.assertStatus(409)
  })

  test('désactiver un compte : connexion refusée et session coupée ; réactiver le rétablit', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const target = await withPassword(await createAdvisor())

    const disable = await client
      .post(SUPER_ADMIN_PATHS.userDisable(target.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .redirects(0)
    disable.assertStatus(302)
    await target.refresh()
    assert.isNotNull(target.disabledAt)

    const login = await client
      .post('/auth/login')
      .header('Accept', 'application/json')
      .json({ email: target.email, password: PASSWORD })
      .redirects(0)
    login.assertStatus(403)
    assert.isUndefined(login.session(SESSION_KEY))

    const live = await client.get('/dashboard/conseiller').loginAs(target).redirects(0)
    live.assertStatus(302)
    live.assertHeader('location', '/auth/login')

    const enable = await client
      .post(SUPER_ADMIN_PATHS.userEnable(target.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .redirects(0)
    enable.assertStatus(302)
    await target.refresh()
    assert.isNull(target.disabledAt)

    const again = await client
      .post('/auth/login')
      .header('Accept', 'application/json')
      .json({ email: target.email, password: PASSWORD })
      .redirects(0)
    assert.notEqual(again.status(), 403)
  })

  test('DELETE /users/:id supprime un compte sans données ; refuse un compte relié à des données', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()
    const free = await createAdvisor(org)
    const busy = await createAdvisor(org)
    await EmployeeFactory.merge({ organizationId: org.id, advisorId: busy.id }).create()

    const removed = await client
      .delete(SUPER_ADMIN_PATHS.user(free.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .redirects(0)
    removed.assertStatus(302)
    assert.isNull(await User.find(free.id))

    const refused = await client
      .delete(SUPER_ADMIN_PATHS.user(busy.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
    refused.assertStatus(422)
    assert.isNotNull(await User.find(busy.id))

    const self = await client
      .delete(SUPER_ADMIN_PATHS.user(superAdmin.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
    self.assertStatus(404)
  })

  test('un compte super admin d’un cabinet ne peut être ni désactivé ni supprimé', async ({
    client,
  }) => {
    const superAdmin = await createSuperAdmin()
    const org = await createOrganization()
    const other = await createSuperAdmin(org)

    const disable = await client
      .post(SUPER_ADMIN_PATHS.userDisable(other.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
    const destroy = await client
      .delete(SUPER_ADMIN_PATHS.user(other.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')

    disable.assertStatus(422)
    destroy.assertStatus(422)
  })

  test('la liste des utilisateurs expose l’état désactivé', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    const target = await createAdvisor()
    await client
      .post(SUPER_ADMIN_PATHS.userDisable(target.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')

    const response = await client.get(SUPER_ADMIN_PATHS.users).loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/users/Index')
    const row = (props.users as Array<{ id: number; disabledAt: string | null }>).find(
      (u) => u.id === target.id
    )
    assert.isNotNull(row!.disabledAt)
    assert.equal(USERS_ROLES.ADVISOR, 'advisor')
  })
})

test.group('Super admin — demandes de contact (#73)', (group) => {
  group.each.setup(() => truncateDb())

  test('liste, filtre par statut et recherche, et expose pagination et filtres', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const pending = await ContactRequestFactory.merge({ name: 'Alice Attente' }).create()
    await ContactRequestFactory.merge({
      name: 'Bob Traité',
      status: CONTACT_REQUEST_STATUSES.TREATED,
    }).create()

    const all = await client
      .get(SUPER_ADMIN_PATHS.contactRequests)
      .loginAs(superAdmin)
      .withInertia()
    const treated = await client
      .get(`${SUPER_ADMIN_PATHS.contactRequests}?status=treated`)
      .loginAs(superAdmin)
      .withInertia()
    const search = await client
      .get(`${SUPER_ADMIN_PATHS.contactRequests}?search=alice`)
      .loginAs(superAdmin)
      .withInertia()

    const allProps = assertPage(assert, all, 'dashboard/admin/contact_requests/Index', [
      'requests',
      'pagination',
      'filters',
    ])
    assert.lengthOf(allProps.requests as unknown[], 2)
    assert.deepEqual(allProps.filters, { search: '', status: 'all', type: 'all' })
    const treatedProps = assertPage(assert, treated, 'dashboard/admin/contact_requests/Index')
    assert.deepEqual(
      (treatedProps.requests as Array<{ name: string }>).map((r) => r.name),
      ['Bob Traité']
    )
    const searchProps = assertPage(assert, search, 'dashboard/admin/contact_requests/Index')
    assert.deepEqual(
      (searchProps.requests as Array<{ id: number }>).map((r) => r.id),
      [pending.id]
    )
  })

  test('POST /contact-requests/:id/status change le statut ; statut invalide et inconnue refusés', async ({
    client,
    assert,
  }) => {
    const superAdmin = await createSuperAdmin()
    const request = await ContactRequestFactory.create()

    const ok = await client
      .post(SUPER_ADMIN_PATHS.contactRequestStatus(request.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ status: 'treated' })
      .redirects(0)
    ok.assertStatus(302)
    await request.refresh()
    assert.equal(request.status, CONTACT_REQUEST_STATUSES.TREATED)

    const invalid = await client
      .post(SUPER_ADMIN_PATHS.contactRequestStatus(request.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ status: 'bogus' })
    invalid.assertStatus(422)

    const missing = await client
      .post(SUPER_ADMIN_PATHS.contactRequestStatus(999999))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ status: 'archived' })
    missing.assertStatus(404)
    const reloaded = await ContactRequest.findOrFail(request.id)
    assert.equal(reloaded.status, 'treated')
  })

  test('l’accueil compte les demandes à traiter', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()
    await ContactRequestFactory.createMany(2)
    await ContactRequestFactory.merge({ status: CONTACT_REQUEST_STATUSES.ARCHIVED }).create()

    const response = await client.get('/dashboard/super-admin').loginAs(superAdmin).withInertia()

    const props = assertPage(assert, response, 'dashboard/admin/home/Home', ['stats'])
    assert.equal((props.stats as { pendingContactRequests: number }).pendingContactRequests, 2)
  })

  test('réservé au super admin (403 pour un conseiller)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .get(SUPER_ADMIN_PATHS.contactRequests)
      .loginAs(advisor)
      .header('Accept', 'application/json')

    response.assertStatus(403)
  })
})

test.group('Super admin — catalogue de compétences (#73)', (group) => {
  group.each.setup(() => truncateDb())

  test('crée, liste, modifie et supprime une compétence', async ({ client, assert }) => {
    const superAdmin = await createSuperAdmin()

    const created = await client
      .post(SUPER_ADMIN_PATHS.skills)
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'Médiation', category: 'Soft skills' })
      .redirects(0)
    created.assertStatus(302)
    const skill = await Skill.findByOrFail('name', 'Médiation')
    assert.isNull(skill.organizationId)

    const list = await client
      .get(`${SUPER_ADMIN_PATHS.skills}?search=médiation`)
      .loginAs(superAdmin)
      .withInertia()
    const props = assertPage(assert, list, 'dashboard/admin/skills/Index', [
      'skills',
      'pagination',
      'filters',
    ])
    assert.deepEqual(
      (props.skills as Array<{ id: number }>).map((s) => s.id),
      [skill.id]
    )

    const updated = await client
      .put(SUPER_ADMIN_PATHS.skill(skill.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'Médiation avancée', category: null })
      .redirects(0)
    updated.assertStatus(302)
    await skill.refresh()
    assert.equal(skill.name, 'Médiation avancée')

    const removed = await client
      .delete(SUPER_ADMIN_PATHS.skill(skill.id))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .redirects(0)
    removed.assertStatus(302)
    assert.isNull(await Skill.find(skill.id))
  })

  test('doublon → 422, nom vide → 422, compétence inconnue → 404', async ({ client }) => {
    const superAdmin = await createSuperAdmin()
    await Skill.create({ name: 'Existante', organizationId: null })

    const duplicate = await client
      .post(SUPER_ADMIN_PATHS.skills)
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: 'existante' })
    const empty = await client
      .post(SUPER_ADMIN_PATHS.skills)
      .loginAs(superAdmin)
      .header('Accept', 'application/json')
      .json({ name: '   ' })
    const missing = await client
      .delete(SUPER_ADMIN_PATHS.skill(999999))
      .loginAs(superAdmin)
      .header('Accept', 'application/json')

    duplicate.assertStatus(422)
    empty.assertStatus(422)
    missing.assertStatus(404)
  })

  test('réservé au super admin (403 pour un conseiller)', async ({ client }) => {
    const advisor = await createAdvisor()

    const response = await client
      .post(SUPER_ADMIN_PATHS.skills)
      .loginAs(advisor)
      .header('Accept', 'application/json')
      .json({ name: 'Intrus' })

    response.assertStatus(403)
  })
})
