import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LegalNotice from '../../../inertia/pages/LegalNotice'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('LegalNotice page', () => {
  test('renders legal notice title and main blocks', () => {
    render(<LegalNotice />)

    expect(screen.getByRole('heading', { level: 1, name: /Mentions légales/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Éditeur du site/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /^Hébergement$/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Propriété intellectuelle/i).length).toBeGreaterThan(0)
  })
})
