import { describe, expect, test } from 'vitest'
import { formatFileSize } from '#shared/helpers/media'

describe('formatFileSize', () => {
  test('octets, kilo-octets et méga-octets en français', () => {
    expect(formatFileSize(512)).toBe('512 o')
    expect(formatFileSize(1536)).toBe('1,5 Ko')
    expect(formatFileSize(20 * 1024)).toBe('20 Ko')
    expect(formatFileSize(4.5 * 1024 * 1024)).toBe('4,5 Mo')
    expect(formatFileSize(3 * 1024 ** 3)).toBe('3 Go')
  })
})
