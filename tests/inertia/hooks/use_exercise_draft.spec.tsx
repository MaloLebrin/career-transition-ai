import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  EXERCISE_DRAFT_DEBOUNCE_MS,
  EXERCISE_DRAFT_MAX_WAIT_MS,
  useExerciseDraft,
  type ExerciseDraftOptions,
} from '../../../inertia/hooks/use_exercise_draft'

type Draft = { text: string; step: number }

function setup(initial: Draft, options: ExerciseDraftOptions<Draft> = {}) {
  const save = vi.fn()
  const hook = renderHook(
    ({ data, opts }: { data: Draft; opts: ExerciseDraftOptions<Draft> }) =>
      useExerciseDraft(data, save, opts),
    { initialProps: { data: initial, opts: options } }
  )
  const type = (data: Draft, opts: ExerciseDraftOptions<Draft> = options) =>
    hook.rerender({ data, opts })
  return { save, type, ...hook }
}

describe('useExerciseDraft (#170)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("n'envoie pas l'état initial", () => {
    const { save } = setup({ text: '', step: 1 })
    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 4))
    expect(save).not.toHaveBeenCalled()
  })

  test('100 modifications rapides donnent un seul POST, avec le dernier état', () => {
    const { save, type } = setup({ text: '', step: 1 })
    const text = 'x'.repeat(100)

    for (let i = 1; i <= 100; i++) {
      type({ text: text.slice(0, i), step: 1 })
      act(() => vi.advanceTimersByTime(50))
    }
    expect(save).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ text, step: 1 })
  })

  test('une saisie continue est tout de même enregistrée au bout de maxWaitMs', () => {
    const { save, type } = setup({ text: '', step: 1 })
    const steps = (EXERCISE_DRAFT_MAX_WAIT_MS / 500) * 2

    for (let i = 1; i <= steps; i++) {
      type({ text: 'a'.repeat(i), step: 1 })
      act(() => vi.advanceTimersByTime(500))
    }

    // 20 s de frappe ininterrompue : un envoi toutes les 10 s, jamais un par frappe.
    expect(save.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(save.mock.calls.length).toBeLessThanOrEqual(2)
  })

  test('dédoublonne par clé JSON : revenir au dernier état envoyé annule l’envoi', () => {
    const { save, type } = setup({ text: '', step: 1 })

    type({ text: 'a', step: 1 })
    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS))
    expect(save).toHaveBeenCalledTimes(1)

    type({ text: 'ab', step: 1 })
    type({ text: 'a', step: 1 })
    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 2))
    expect(save).toHaveBeenCalledTimes(1)

    // Même contenu, nouvel objet : aucun envoi.
    type({ text: 'a', step: 1 })
    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 2))
    expect(save).toHaveBeenCalledTimes(1)
  })

  test('envoie le brouillon en attente au démontage', () => {
    const { save, type, unmount } = setup({ text: '', step: 1 })
    type({ text: 'en cours', step: 1 })
    expect(save).not.toHaveBeenCalled()

    unmount()

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({ text: 'en cours', step: 1 })
  })

  test('cancel() abandonne le brouillon en attente (résultat final)', () => {
    const { save, type, result, unmount } = setup({ text: '', step: 1 })
    type({ text: 'fini', step: 2 })

    act(() => result.current.cancel())
    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 2))
    unmount()

    expect(save).not.toHaveBeenCalled()
  })

  test('flush() envoie tout de suite', () => {
    const { save, type, result } = setup({ text: '', step: 1 })
    type({ text: 'vite', step: 1 })
    act(() => result.current.flush())
    expect(save).toHaveBeenCalledWith({ text: 'vite', step: 1 })
  })

  test('enabled: false ignore les modifications', () => {
    const { save, type } = setup({ text: '', step: 1 }, { enabled: false })
    type({ text: 'ignoré', step: 1 })
    act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 2))
    expect(save).not.toHaveBeenCalled()
  })

  test('une erreur de sauvegarde ne casse pas le hook', () => {
    const save = vi.fn().mockRejectedValue(new Error('réseau'))
    const { rerender } = renderHook(({ data }: { data: Draft }) => useExerciseDraft(data, save), {
      initialProps: { data: { text: '', step: 1 } },
    })
    rerender({ data: { text: 'a', step: 1 } })
    expect(() => act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS))).not.toThrow()
    expect(save).toHaveBeenCalledTimes(1)
  })

  describe('hydratation', () => {
    test('applique le brouillon initial une seule fois sans le renvoyer', async () => {
      const save = vi.fn()
      const onHydrate = vi.fn()
      const initialDraftPromise = Promise.resolve({ data: { text: 'repris', step: 2 } })

      // Comme un outil : l'hydratation alimente l'état local qui est enregistré.
      const { result, rerender } = renderHook(
        ({ promise }: { promise: Promise<{ data: Draft }> }) => {
          const [draft, setDraft] = useState<Draft>({ text: '', step: 1 })
          const controls = useExerciseDraft(draft, save, {
            initialDraftPromise: promise,
            onHydrate: (data) => {
              onHydrate(data)
              if (data) setDraft({ text: data.text ?? '', step: data.step ?? 1 })
            },
          })
          return { ...controls, draft, setDraft }
        },
        { initialProps: { promise: initialDraftPromise } }
      )
      expect(result.current.hydrated).toBe(false)

      // Avant hydratation, rien n'est planifié.
      act(() => result.current.setDraft({ text: 'trop tôt', step: 1 }))
      act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 2))
      expect(save).not.toHaveBeenCalled()

      await act(async () => {
        await initialDraftPromise
      })
      expect(onHydrate).toHaveBeenCalledTimes(1)
      expect(onHydrate).toHaveBeenCalledWith({ text: 'repris', step: 2 })
      expect(result.current.hydrated).toBe(true)
      expect(result.current.draft).toEqual({ text: 'repris', step: 2 })

      // L'état hydraté sert de référence : il n'est pas renvoyé.
      act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS * 2))
      expect(save).not.toHaveBeenCalled()

      // Une nouvelle promesse (nouveau rendu de la page) n'est pas relue.
      const other = Promise.resolve({ data: { text: 'écrasé', step: 1 } })
      rerender({ promise: other })
      await act(async () => {
        await other
      })
      expect(onHydrate).toHaveBeenCalledTimes(1)

      act(() => result.current.setDraft({ text: 'repris !', step: 2 }))
      act(() => vi.advanceTimersByTime(EXERCISE_DRAFT_DEBOUNCE_MS))
      expect(save).toHaveBeenCalledTimes(1)
      expect(save).toHaveBeenCalledWith({ text: 'repris !', step: 2 })
    })

    test('sans brouillon (ou promesse rejetée), onHydrate reçoit null', async () => {
      const onHydrate = vi.fn()
      setup({ text: '', step: 1 }, { onHydrate })
      expect(onHydrate).toHaveBeenCalledWith(null)

      const failing = Promise.reject(new Error('absent'))
      const onHydrateAfterError = vi.fn()
      const { result } = setup(
        { text: '', step: 1 },
        { initialDraftPromise: failing, onHydrate: onHydrateAfterError }
      )
      await act(async () => {
        await failing.catch(() => {})
      })
      expect(onHydrateAfterError).toHaveBeenCalledWith(null)
      expect(result.current.hydrated).toBe(true)
    })
  })
})
