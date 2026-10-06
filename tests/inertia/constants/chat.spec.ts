import {
  CHAT_ASSIGNMENTS,
  CHAT_AUTHOR_ROLES,
  CHAT_CHANNEL_PATTERN,
  CHAT_MESSAGE_MAX,
  CHAT_PATHS,
  chatAuthorRoleValues,
  chatChannel,
} from '#shared/constants/chat'
import { describe, expect, it } from 'vitest'

describe('chat constants', () => {
  it('expose les rôles d’auteur pour la contrainte CHECK', () => {
    expect(chatAuthorRoleValues).toEqual([CHAT_AUTHOR_ROLES.CANDIDATE, CHAT_AUTHOR_ROLES.EXPERT])
  })

  it('construit le canal Transmit conforme au motif', () => {
    expect(chatChannel(12)).toBe('chat/conversations/12')
    expect(CHAT_CHANNEL_PATTERN).toBe('chat/conversations/:id')
  })

  it('construit les chemins', () => {
    expect(CHAT_PATHS.candidate).toBe('/dashboard/candidat/chat')
    expect(CHAT_PATHS.expertShow(3)).toBe('/dashboard/conseiller/chat/3')
    expect(CHAT_PATHS.expertMessages(3)).toBe('/dashboard/conseiller/chat/3/messages')
    expect(CHAT_PATHS.expertClaim(3)).toBe('/dashboard/conseiller/chat/3/claim')
    expect(CHAT_PATHS.expertRead(3)).toBe('/dashboard/conseiller/chat/3/read')
  })

  it('borne un message à 2000 caractères et nomme les rattachements', () => {
    expect(CHAT_MESSAGE_MAX).toBe(2000)
    expect(Object.values(CHAT_ASSIGNMENTS)).toEqual(['me', 'queue', 'other'])
  })
})
