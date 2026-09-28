import { describe, expect, expectTypeOf, test } from 'vitest'
import type { AiProvider } from '#shared/helpers/ai/ai_client'
import {
  AI_PROVIDER_MODES,
  aiProviderModeValues,
  type AiProviderMode,
} from '#shared/constants/ai_provider'
import { expectConsistentEnum } from './enum_contract.js'

describe('shared/constants/ai_provider', () => {
  test('enum cohérent : Mistral ou désactivé', () => {
    expectConsistentEnum(AI_PROVIDER_MODES, aiProviderModeValues, ['mistral', 'none'])
  })

  test('« none » existe : c’est le repli quand AI_PROVIDER est absent', () => {
    expect(aiProviderModeValues).toContain(AI_PROVIDER_MODES.NONE)
  })

  test('aligné sur le type AiProvider du client IA partagé', () => {
    expectTypeOf<AiProviderMode>().toEqualTypeOf<AiProvider>()
    const providers: Record<AiProvider, true> = { mistral: true, none: true }
    expect(Object.keys(providers).sort()).toEqual([...aiProviderModeValues].sort())
  })
})
