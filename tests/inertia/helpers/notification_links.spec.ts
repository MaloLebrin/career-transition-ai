import { notificationHref } from '#shared/helpers/notification_links'
import { describe, expect, test } from 'vitest'

describe('notificationHref', () => {
  test('renvoie un chemin du tableau de bord', () => {
    expect(notificationHref({ href: '/dashboard/candidat/synthesis' })).toBe(
      '/dashboard/candidat/synthesis'
    )
  })

  test('ignore les métadonnées absentes ou sans lien', () => {
    expect(notificationHref(null)).toBeNull()
    expect(notificationHref(undefined)).toBeNull()
    expect(notificationHref({ stepId: 3 })).toBeNull()
    expect(notificationHref({ href: 42 })).toBeNull()
  })

  test('refuse les liens externes ou hors du tableau de bord', () => {
    expect(notificationHref({ href: 'https://evil.example/dashboard/' })).toBeNull()
    expect(notificationHref({ href: '//evil.example/dashboard/' })).toBeNull()
    expect(notificationHref({ href: '/auth/logout' })).toBeNull()
    expect(notificationHref({ href: 'javascript:alert(1)' })).toBeNull()
  })
})
