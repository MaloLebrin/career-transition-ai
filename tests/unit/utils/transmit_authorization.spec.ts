import {
  canSubscribeToChatConversation,
  canSubscribeToOrganizationPdfExports,
  type ChatSubscriptionAccess,
} from '#utils/transmit_authorization'
import { USERS_ROLES, type UserRole } from '#shared/types/advisor/roles'
import { test } from '@japa/runner'

test.group('canSubscribeToOrganizationPdfExports', () => {
  test('refuse un invité', ({ assert }) => {
    assert.isFalse(canSubscribeToOrganizationPdfExports(null, '3'))
  })

  test('autorise le super admin', ({ assert }) => {
    assert.isTrue(
      canSubscribeToOrganizationPdfExports(
        { role: USERS_ROLES.SUPER_ADMIN, organizationId: 1 },
        '3'
      )
    )
  })

  test("autorise conseiller, admin et expert de l'organisation", ({ assert }) => {
    for (const role of [USERS_ROLES.ADVISOR, USERS_ROLES.ADMIN, USERS_ROLES.EXPERT]) {
      assert.isTrue(canSubscribeToOrganizationPdfExports({ role, organizationId: 3 }, '3'))
    }
  })

  test("refuse un candidat, même de l'organisation", ({ assert }) => {
    assert.isFalse(
      canSubscribeToOrganizationPdfExports({ role: USERS_ROLES.EMPLOYEE, organizationId: 3 }, '3')
    )
  })

  test('refuse une autre organisation', ({ assert }) => {
    assert.isFalse(
      canSubscribeToOrganizationPdfExports({ role: USERS_ROLES.ADVISOR, organizationId: 4 }, '3')
    )
  })

  test('refuse un utilisateur sans organisation', ({ assert }) => {
    assert.isFalse(
      canSubscribeToOrganizationPdfExports(
        { role: USERS_ROLES.ADVISOR, organizationId: null },
        'NaN'
      )
    )
  })
})

test.group('canSubscribeToChatConversation', () => {
  const access = (over: Partial<ChatSubscriptionAccess> = {}): ChatSubscriptionAccess => ({
    candidateUserId: 10,
    effectiveExpertId: null,
    isPlatformMember: true,
    ...over,
  })
  const user = (role: UserRole, id: number) => ({ id, role, organizationId: 1 })

  test('refuse un invité ou une conversation inconnue', ({ assert }) => {
    assert.isFalse(canSubscribeToChatConversation(null, access()))
    assert.isFalse(canSubscribeToChatConversation(user(USERS_ROLES.ADVISOR, 1), null))
  })

  test('autorise le candidat propriétaire seulement', ({ assert }) => {
    assert.isTrue(canSubscribeToChatConversation(user(USERS_ROLES.EMPLOYEE, 10), access()))
    assert.isFalse(canSubscribeToChatConversation(user(USERS_ROLES.EMPLOYEE, 11), access()))
  })

  test('autorise le super admin', ({ assert }) => {
    assert.isTrue(canSubscribeToChatConversation(user(USERS_ROLES.SUPER_ADMIN, 1), access()))
  })

  test('expert : sa conversation ou la file, jamais celle d’un autre', ({ assert }) => {
    const expert = user(USERS_ROLES.ADVISOR, 5)
    assert.isTrue(canSubscribeToChatConversation(expert, access({ effectiveExpertId: 5 })))
    assert.isTrue(canSubscribeToChatConversation(expert, access({ effectiveExpertId: null })))
    assert.isFalse(canSubscribeToChatConversation(expert, access({ effectiveExpertId: 6 })))
  })

  test('admin de la plateforme : tout ; membre d’un cabinet client : rien', ({ assert }) => {
    assert.isTrue(
      canSubscribeToChatConversation(user(USERS_ROLES.ADMIN, 2), access({ effectiveExpertId: 6 }))
    )
    assert.isFalse(
      canSubscribeToChatConversation(
        user(USERS_ROLES.ADMIN, 2),
        access({ isPlatformMember: false })
      )
    )
    assert.isFalse(
      canSubscribeToChatConversation(
        user(USERS_ROLES.ADVISOR, 5),
        access({ isPlatformMember: false })
      )
    )
  })
})
