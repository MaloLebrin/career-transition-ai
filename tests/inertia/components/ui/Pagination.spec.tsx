import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Pagination } from '../../../../inertia/components/ui/Pagination'

describe('Pagination', () => {
  test('une seule page : rien n’est rendu', () => {
    render(<Pagination page={1} lastPage={1} onPageChange={vi.fn()} />)

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })

  test('affiche la page courante et navigue vers la précédente / suivante', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} lastPage={3} onPageChange={onPageChange} />)

    expect(screen.getByText('Page 2 / 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Précédent' }))
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3)
  })

  test('boutons désactivés aux bornes', () => {
    const { rerender } = render(<Pagination page={1} lastPage={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled()

    rerender(<Pagination page={3} lastPage={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled()
  })
})
