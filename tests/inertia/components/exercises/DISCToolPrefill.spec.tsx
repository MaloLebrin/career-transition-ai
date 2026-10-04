import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import DISCTool from '../../../../inertia/components/exercises/DISCTool'

describe('DISCTool prefill', () => {
  test('prefills selections from completed result data when available', async () => {
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(
      <DISCTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve(null)}
        initialResultData={{
          selections: {
            0: { most: 'D', least: 'S' },
          },
          currentIdx: 0,
        }}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled()
    })
  })

  test('legacy completed result without selections starts blank but remains editable', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    render(
      <DISCTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve(null)}
        initialResultData={{ D: 80, I: 40, S: 20, C: 60 }}
      />
    )

    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled()

    // Step 1 options: pick one "most" and one "least" to unlock the Next button.
    await user.click(screen.getAllByRole('button', { name: "C'est moi" })[0])
    await user.click(screen.getAllByRole('button', { name: 'Pas du tout' })[1])

    expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled()
  })
})
