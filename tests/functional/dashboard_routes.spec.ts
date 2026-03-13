import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { AuthService } from '#services/auth_service'
import { USERS_ROLES } from '#models/user'
import Employee from '#models/employee'
import Organization from '#models/organization'
import User from '#models/user'

function baseUrl(): string {
  return `http://${env.get('HOST')}:${env.get('PORT')}`
}

test.group('Dashboard routes (functional)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('POST /dashboard/conseiller/employees returns 401 when unauthenticated', async ({
    assert,
  }) => {
    const res = await fetch(`${baseUrl()}/dashboard/conseiller/employees`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
    })
    assert.equal(res.status, 401)
  })

  test('POST /dashboard/conseiller/employees creates employee and redirects when authenticated', async ({
    assert,
  }) => {
    await app.boot()
    const authService = new AuthService()
    const email = `functional-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const password = 'secret123'
    await authService.register({
      email,
      password,
      name: 'Advisor Test',
      role: USERS_ROLES.ADVISOR,
      organizationName: `Org ${Date.now()}`,
    })

    const loginRes = await fetch(`${baseUrl()}/auth/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const setCookies =
      loginRes.headers.getSetCookie?.() ?? [loginRes.headers.get('set-cookie')].filter(Boolean)
    const cookieHeader = setCookies.map((c: string) => c.split(';')[0].trim()).join('; ')

    const candidateEmail = `candidate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const res = await fetch(`${baseUrl()}/dashboard/conseiller/employees`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ name: 'New Candidate', email: candidateEmail }),
    })

    assert.equal(res.status, 302)
    const location = res.headers.get('location') ?? ''
    assert.isTrue(
      location.includes('/dashboard/conseiller/employees'),
      `Expected redirect to /dashboard/conseiller/employees, got ${location}`
    )

    const count = await Employee.query().where('email', candidateEmail).count('* as total')
    assert.equal(Number((count[0] as any).$extras.total), 1)
  })

  test('PUT /dashboard/conseiller/settings/organization returns 401 when unauthenticated', async ({
    assert,
  }) => {
    const res = await fetch(`${baseUrl()}/dashboard/conseiller/settings/organization`, {
      method: 'PUT',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name: 'My Org', slug: 'my-org' }),
    })
    assert.equal(res.status, 401)
  })

  test('PUT /dashboard/conseiller/settings/organization updates org and redirects when authenticated', async ({
    assert,
  }) => {
    await app.boot()
    const authService = new AuthService()
    const email = `settings-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    await authService.register({
      email,
      password: 'secret123',
      name: 'Settings User',
      role: USERS_ROLES.ADVISOR,
      organizationName: `Settings Org ${Date.now()}`,
    })

    const loginRes = await fetch(`${baseUrl()}/auth/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123' }),
    })
    const setCookies =
      loginRes.headers.getSetCookie?.() ?? [loginRes.headers.get('set-cookie')].filter(Boolean)
    const cookieHeader = setCookies.map((c: string) => c.split(';')[0].trim()).join('; ')

    const user = await User.query().where('email', email).firstOrFail()
    const org = await Organization.findOrFail(user.organizationId)
    const newName = `Updated Org ${Date.now()}`

    const res = await fetch(`${baseUrl()}/dashboard/conseiller/settings/organization`, {
      method: 'PUT',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ name: newName, slug: org.slug }),
    })

    assert.equal(res.status, 302)
    const location = res.headers.get('location') ?? ''
    assert.isTrue(
      location.includes('/dashboard/conseiller/settings'),
      `Expected redirect to /dashboard/conseiller/settings, got ${location}`
    )

    await org.refresh()
    assert.equal(org.name, newName)
  })

  test('POST /dashboard/conseiller/settings/organization/advisors returns 401 when unauthenticated', async ({
    assert,
  }) => {
    const res = await fetch(`${baseUrl()}/dashboard/conseiller/settings/organization/advisors`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: 'New Advisor',
        email: 'advisor@example.com',
        role: 'consultant',
      }),
    })
    assert.equal(res.status, 401)
  })

  test('POST /dashboard/conseiller/settings/organization/advisors invites advisor and redirects when authenticated', async ({
    assert,
  }) => {
    await app.boot()
    const authService = new AuthService()
    const email = `advisor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    await authService.register({
      email,
      password: 'secret123',
      name: 'Owner',
      role: USERS_ROLES.ADVISOR,
      organizationName: `Owner Org ${Date.now()}`,
    })

    const loginRes = await fetch(`${baseUrl()}/auth/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password: 'secret123' }),
    })
    const setCookies =
      loginRes.headers.getSetCookie?.() ?? [loginRes.headers.get('set-cookie')].filter(Boolean)
    const cookieHeader = setCookies.map((c: string) => c.split(';')[0].trim()).join('; ')

    const invitedEmail = `invited-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`
    const res = await fetch(`${baseUrl()}/dashboard/conseiller/settings/organization/advisors`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        name: 'Invited Advisor',
        email: invitedEmail,
        role: 'consultant',
      }),
    })

    assert.equal(res.status, 302)
    const location = res.headers.get('location') ?? ''
    assert.isTrue(
      location.includes('/dashboard/conseiller/settings'),
      `Expected redirect to /dashboard/conseiller/settings, got ${location}`
    )

    const invitedUser = await User.query().where('email', invitedEmail).first()
    assert.isNotNull(invitedUser)
    assert.equal(invitedUser!.name, 'Invited Advisor')
  })
})
