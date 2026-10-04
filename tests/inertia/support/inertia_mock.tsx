import React, { useCallback, useMemo, useRef, useState } from 'react'
import { vi } from 'vitest'

/**
 * Doublon partagé de `@inertiajs/react` pour les specs Vitest.
 *
 * À poser en tête de spec (la factory est hoistée, d'où l'import dynamique) :
 *
 * ```ts
 * vi.mock('@inertiajs/react', async () => {
 *   const { inertiaMock } = await import('../support/inertia_mock')
 *   return inertiaMock()
 * })
 *
 * beforeEach(() => resetInertiaMock())
 * ```
 *
 * Tout ce que le composant monté envoie est ensuite observable depuis le test :
 * - `routerSpies.post` / `routerSpies.delete`… (appels à `router.*`)
 * - `formSubmissions.at(-1)` → `{ method, url, data, options }` du dernier submit `useForm`
 * - `pageState.props` → ce que rend `usePage()` (via `setPageProps`)
 *
 * Par défaut les requêtes restent « en vol » (aucun callback appelé). Pour simuler
 * la réponse du serveur : `setInertiaOutcome('success')` ou
 * `setInertiaOutcome({ errors: { name: 'Requis' } })` avant l'interaction.
 */

type Callbacks = {
  onBefore?: (...args: unknown[]) => unknown
  onStart?: (...args: unknown[]) => unknown
  onSuccess?: (...args: unknown[]) => unknown
  onError?: (...args: unknown[]) => unknown
  onFinish?: (...args: unknown[]) => unknown
  [key: string]: unknown
}

export type InertiaOutcome = 'pending' | 'success' | { errors: Record<string, string> }

export interface FakePage {
  props: Record<string, unknown>
  url: string
  component: string
  version: string | null
}

export const pageState: FakePage = {
  props: {},
  url: '/',
  component: 'Test',
  version: null,
}

let outcome: InertiaOutcome = 'pending'

/** Définit la réponse simulée des prochaines requêtes `router.*` et `useForm().*`. */
export function setInertiaOutcome(next: InertiaOutcome) {
  outcome = next
}

/** Remplace les props renvoyées par `usePage()` (et optionnellement l'URL). */
export function setPageProps(props: Record<string, unknown>, url?: string) {
  pageState.props = props
  if (url !== undefined) pageState.url = url
}

function settle(options: Callbacks | undefined) {
  if (!options) return
  options.onStart?.()
  if (outcome === 'success') {
    options.onSuccess?.({ props: pageState.props, url: pageState.url })
    options.onFinish?.()
  } else if (outcome !== 'pending') {
    options.onError?.(outcome.errors)
    options.onFinish?.()
  }
}

export const routerSpies = {
  visit: vi.fn((_url: string, options?: Callbacks) => settle(options)),
  get: vi.fn((_url: string, _data?: unknown, options?: Callbacks) => settle(options)),
  post: vi.fn((_url: string, _data?: unknown, options?: Callbacks) => settle(options)),
  put: vi.fn((_url: string, _data?: unknown, options?: Callbacks) => settle(options)),
  patch: vi.fn((_url: string, _data?: unknown, options?: Callbacks) => settle(options)),
  delete: vi.fn((_url: string, options?: Callbacks) => settle(options)),
  reload: vi.fn((options?: Callbacks) => settle(options)),
  replace: vi.fn(),
  prefetch: vi.fn(),
  on: vi.fn(() => () => {}),
}

export type FormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface FormSubmission {
  method: FormMethod
  url: string
  data: Record<string, unknown>
  options: Callbacks
}

/** Chaque submit `useForm` depuis le dernier `resetInertiaMock()`, dans l'ordre. */
export const formSubmissions: FormSubmission[] = []

function fakeUseForm(...args: unknown[]) {
  // Signature `useForm(rememberKey, data)` ou `useForm(data)`.
  const rawInitial = (typeof args[0] === 'string' ? args[1] : args[0]) ?? {}
  const initialRef = useRef<Record<string, unknown> | null>(null)
  if (initialRef.current === null) {
    initialRef.current = (
      typeof rawInitial === 'function' ? (rawInitial as () => unknown)() : rawInitial
    ) as Record<string, unknown>
  }

  const [defaults, setDefaultsState] = useState<Record<string, unknown>>(initialRef.current)
  const [data, setDataState] = useState<Record<string, unknown>>(initialRef.current)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)
  const [wasSuccessful, setWasSuccessful] = useState(false)
  const transformRef = useRef((d: Record<string, unknown>) => d)

  const setData = useCallback((keyOrData: unknown, value?: unknown) => {
    if (typeof keyOrData === 'string') {
      setDataState((prev) => ({ ...prev, [keyOrData]: value }))
    } else if (typeof keyOrData === 'function') {
      setDataState((prev) =>
        (keyOrData as (p: Record<string, unknown>) => Record<string, unknown>)(prev)
      )
    } else {
      setDataState(keyOrData as Record<string, unknown>)
    }
  }, [])

  const reset = useCallback(
    (...fields: string[]) => {
      if (fields.length === 0) {
        setDataState(defaults)
        return
      }
      setDataState((prev) => {
        const next = { ...prev }
        for (const field of fields) next[field] = defaults[field]
        return next
      })
    },
    [defaults]
  )

  const clearErrors = useCallback((...fields: string[]) => {
    if (fields.length === 0) {
      setErrors({})
      return
    }
    setErrors((prev) => {
      const next = { ...prev }
      for (const field of fields) delete next[field]
      return next
    })
  }, [])

  const setError = useCallback((keyOrErrors: string | Record<string, string>, value?: string) => {
    setErrors((prev) =>
      typeof keyOrErrors === 'string'
        ? { ...prev, [keyOrErrors]: value ?? '' }
        : { ...prev, ...keyOrErrors }
    )
  }, [])

  const submit = useCallback(
    (method: FormMethod, url: string, options: Callbacks = {}) => {
      formSubmissions.push({ method, url, data: transformRef.current(data), options })
      setProcessing(outcome === 'pending')
      if (outcome === 'success') {
        setErrors({})
        setWasSuccessful(true)
      } else if (outcome !== 'pending') {
        setErrors(outcome.errors)
      }
      settle(options)
    },
    [data]
  )

  const isDirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(defaults), [data, defaults])

  return {
    data,
    setData,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    processing,
    progress: null,
    isDirty,
    wasSuccessful,
    recentlySuccessful: wasSuccessful,
    transform: (fn: (d: Record<string, unknown>) => Record<string, unknown>) => {
      transformRef.current = fn
    },
    setDefaults: (keyOrData?: string | Record<string, unknown>, value?: unknown) => {
      if (keyOrData === undefined) setDefaultsState(data)
      else if (typeof keyOrData === 'string')
        setDefaultsState((prev) => ({ ...prev, [keyOrData]: value }))
      else setDefaultsState((prev) => ({ ...prev, ...keyOrData }))
    },
    reset,
    resetAndClearErrors: (...fields: string[]) => {
      reset(...fields)
      clearErrors(...fields)
    },
    clearErrors,
    setError,
    cancel: vi.fn(),
    submit: (
      methodOrRoute: FormMethod | { method: FormMethod; url: string },
      urlOrOptions?: unknown,
      maybeOptions?: Callbacks
    ) => {
      if (typeof methodOrRoute === 'object') {
        submit(methodOrRoute.method, methodOrRoute.url, urlOrOptions as Callbacks)
      } else {
        submit(methodOrRoute, urlOrOptions as string, maybeOptions)
      }
    },
    get: (url: string, options?: Callbacks) => submit('get', url, options),
    post: (url: string, options?: Callbacks) => submit('post', url, options),
    put: (url: string, options?: Callbacks) => submit('put', url, options),
    patch: (url: string, options?: Callbacks) => submit('patch', url, options),
    delete: (url: string, options?: Callbacks) => submit('delete', url, options),
  }
}

const INERTIA_LINK_PROPS = [
  'method',
  'data',
  'as',
  'preserveScroll',
  'preserveState',
  'replace',
  'only',
  'except',
  'headers',
  'queryStringArrayFormat',
  'prefetch',
  'cacheFor',
  'async',
  'viewTransition',
]

type FakeLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { url: string }
  [key: string]: unknown
}

function FakeLink({ href, children, ...rest }: FakeLinkProps) {
  const anchorProps: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (!INERTIA_LINK_PROPS.includes(key) && !key.startsWith('on')) anchorProps[key] = value
  }
  const url = typeof href === 'string' ? href : href.url
  return (
    <a
      {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      href={url}
      onClick={(event) => {
        event.preventDefault()
        ;(rest.onClick as ((e: React.MouseEvent) => void) | undefined)?.(event)
        routerSpies.visit(url, { method: rest.method ?? 'get', data: rest.data })
      }}
    >
      {children}
    </a>
  )
}

/** Module de remplacement complet de `@inertiajs/react`. */
export function inertiaMock() {
  return {
    router: routerSpies,
    usePage: () => pageState,
    useForm: fakeUseForm,
    useRemember: (initial: unknown) => useState(initial),
    Link: FakeLink,
    Head: ({ title }: { title?: string }) => (title ? <title>{title}</title> : null),
    createInertiaApp: vi.fn(),
  }
}

/** Remet tous les espions, la page et le résultat simulé à zéro (à appeler en `beforeEach`). */
export function resetInertiaMock() {
  for (const spy of Object.values(routerSpies)) spy.mockClear()
  formSubmissions.length = 0
  outcome = 'pending'
  pageState.props = {}
  pageState.url = '/'
  pageState.component = 'Test'
  pageState.version = null
}
