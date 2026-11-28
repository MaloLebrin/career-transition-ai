import { describe, expect, it } from 'vitest'
import {
  LIMITER_STORES,
  PG_NOTIFY_MAX_BYTES,
  RATE_LIMITS_TABLE,
  TRANSMIT_PG_CHANNEL,
  TRANSMIT_TRANSPORTS,
} from '#shared/constants/runtime_stores'

describe('runtime_stores (#172)', () => {
  it('transport Postgres par défaut, memory et none disponibles', () => {
    expect(Object.values(TRANSMIT_TRANSPORTS)).toEqual(['postgres', 'memory', 'none'])
  })

  it('store database du limiter sur la table rate_limits', () => {
    expect(Object.values(LIMITER_STORES)).toEqual(['database', 'memory'])
    expect(RATE_LIMITS_TABLE).toBe('rate_limits')
  })

  it('canal NOTIFY : identifiant SQL simple, charge sous la limite Postgres', () => {
    expect(TRANSMIT_PG_CHANNEL).toMatch(/^[a-z_]+$/)
    expect(PG_NOTIFY_MAX_BYTES).toBeLessThan(8000)
  })
})
