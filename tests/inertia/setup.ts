import { afterEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Many components use `usePage()` without an Inertia provider in tests.
// Provide a safe default implementation globally; individual tests can still override via `vi.mock`.
vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>()
  return {
    ...actual,
    usePage: () =>
      ({
        props: {},
        url: '/',
        component: 'Test',
        version: null,
      }) as any,
  }
})

afterEach(() => {
  cleanup()
})

// Provide browser APIs that are missing in jsdom but used by the UI
if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub {
    constructor(_callback: any, _options?: any) {}

    observe() {}

    unobserve() {}

    disconnect() {}
  }

  // @ts-expect-error jsdom global patch for tests
  globalThis.IntersectionObserver = IntersectionObserverStub
}

// Headless UI (Combobox…) observe la taille des éléments ancrés
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    constructor(_callback: any) {}

    observe() {}

    unobserve() {}

    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// Transmit client uses EventSource for SSE
if (!('EventSource' in globalThis)) {
  class EventSourceStub {
    url: string
    readyState = 1
    withCredentials = false

    constructor(url: string) {
      this.url = url
    }

    close() {}

    addEventListener() {}

    removeEventListener() {}

    dispatchEvent() {
      return false
    }
  }

  // @ts-expect-error jsdom global patch for tests
  globalThis.EventSource = EventSourceStub
}

// Stub window.alert used in a few components so jsdom doesn't throw
vi.stubGlobal('alert', vi.fn())
