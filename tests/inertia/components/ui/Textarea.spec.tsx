import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { Textarea } from '../../../../inertia/components/ui/Textarea'

describe('Textarea', () => {
  test('binds the label and forwards changes', () => {
    const onChange = vi.fn()
    render(<Textarea label="Message" required onChange={onChange} />)
    const field = screen.getByLabelText(/Message/)
    expect(field.tagName).toBe('TEXTAREA')
    expect(field).toHaveAttribute('aria-required', 'true')
    fireEvent.change(field, { target: { value: 'Bonjour' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('shows the error with role alert and the danger border', () => {
    render(<Textarea label="Message" error="Requis" />)
    const field = screen.getByLabelText('Message')
    expect(screen.getByRole('alert')).toHaveTextContent('Requis')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveClass('border-danger')
  })

  test('shows the hint when there is no error', () => {
    render(<Textarea label="Message" hint="Facultatif" />)
    expect(screen.getByText('Facultatif')).toHaveClass('text-muted')
  })
})
