import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NavButton from '../../../../inertia/components/ui/NavButton'

describe('NavButton', () => {
  test('renders label and icon', () => {
    render(<NavButton active={false} onClick={() => {}} icon="dashboard" label="Tableau de bord" />)
    expect(screen.getByRole('button', { name: 'Tableau de bord' })).toBeInTheDocument()
  })

  test('sets aria-current when active', () => {
    render(<NavButton active={true} onClick={() => {}} icon="settings" label="Réglages" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'page')
  })

  test('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<NavButton active={false} onClick={onClick} icon="users" label="Utilisateurs" />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
