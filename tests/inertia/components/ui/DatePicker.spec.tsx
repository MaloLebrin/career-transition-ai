import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DatePicker from '../../../../inertia/components/ui/DatePicker'

describe('DatePicker', () => {
  test('renders with label and required indicator', () => {
    render(<DatePicker label="Date" value="" onChange={() => {}} required />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    const label = screen.getByText('Date').closest('label')
    expect(label?.querySelector('[aria-hidden="true"]')).toHaveTextContent('*')
  })

  test('shows error message', () => {
    render(<DatePicker value="" onChange={() => {}} error="Date invalide" />)
    expect(screen.getByText('Date invalide')).toBeInTheDocument()
    expect(screen.getByText('Date invalide')).toHaveAttribute('role', 'alert')
  })

  test('shows hint when no error', () => {
    render(<DatePicker value="" onChange={() => {}} hint="Format JJ/MM/AAAA" />)
    expect(screen.getByText('Format JJ/MM/AAAA')).toBeInTheDocument()
  })

  test('hides hint when error is set', () => {
    render(<DatePicker value="" onChange={() => {}} hint="Indice" error="Erreur" />)
    expect(screen.getByText('Erreur')).toBeInTheDocument()
    expect(screen.queryByText('Indice')).not.toBeInTheDocument()
  })

  test('associates label with input via id', () => {
    render(<DatePicker label="Ma date" id="date-id" value="" onChange={() => {}} />)
    const label = screen.getByText('Ma date')
    expect(label).toHaveAttribute('for', 'date-id')
  })
})
