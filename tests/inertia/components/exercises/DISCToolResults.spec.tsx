import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import DISCTool from '../../../../inertia/components/exercises/DISCTool'

function makeSelections(count: number, most: 'D' | 'I' | 'S' | 'C', least: 'D' | 'I' | 'S' | 'C') {
  const selections: Record<number, { most: any; least: any }> = {}
  for (let i = 0; i < count; i += 1) {
    selections[i] = { most, least }
  }
  return selections
}

describe('DISCTool results', () => {
  test('shows results screen then calls onSave when user saves', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onSaveDraft = vi.fn()

    // DISC has 24 blocks in the new questionnaire.
    const blocksCount = 24

    render(
      <DISCTool
        onSave={onSave}
        onSaveDraft={onSaveDraft}
        initialDraftPromise={Promise.resolve(null)}
        initialResultData={{
          selections: makeSelections(blocksCount, 'D', 'C'),
          currentIdx: blocksCount - 1,
        }}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Voir mon profil' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Voir mon profil' }))

    expect(await screen.findByText('Dominante')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enregistrer mon profil' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enregistrer mon profil' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const payload = onSave.mock.calls[0]?.[0]
    expect(payload.version).toBe(2)
    expect(payload.dominant).toBe('D')
    expect(payload.secondary).toBeDefined()
    expect(payload.D).toBeGreaterThanOrEqual(0)
    expect(payload.D).toBeLessThanOrEqual(100)
  })
})
