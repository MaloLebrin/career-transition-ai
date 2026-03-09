import { afterEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Provide browser APIs that are missing in jsdom but used by the UI
if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_callback: any, _options?: any) {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    observe() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unobserve() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect() {}
  }

  // @ts-expect-error jsdom global patch for tests
  globalThis.IntersectionObserver = IntersectionObserverStub
}

// Stub window.alert used in a few components so jsdom doesn't throw
vi.stubGlobal('alert', vi.fn())
