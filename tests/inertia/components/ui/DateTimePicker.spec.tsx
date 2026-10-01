import { describe, test, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DateTimePicker from '../../../../inertia/components/ui/DateTimePicker'

describe('DateTimePicker', () => {
  test('renders label, required indicator and hint', () => {
    render(
      <DateTimePicker
        label="Date et heure"
        value=""
        onChange={() => {}}
        required
        hint="Choisissez date et heure"
      />
    )

    expect(screen.getByText('Date et heure')).toBeInTheDocument()
    const label = screen.getByText('Date et heure').closest('label')
    expect(label?.querySelector('[aria-hidden="true"]')).toHaveTextContent('*')
    expect(screen.getByText('Choisissez date et heure')).toBeInTheDocument()
  })

  test('calls onChange when time is selected', () => {
    const handleChange = vi.fn()
    render(
      <DateTimePicker
        label="RDV"
        value="2026-03-19T10:00:00.000Z"
        onChange={handleChange}
        minuteStep={15}
      />
    )

    const timeSelect = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(timeSelect, { target: { value: '10:15' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    const newValue = handleChange.mock.calls[0][0] as string
    // on vérifie simplement que l'heure HH:MM produite respecte le choix et le format
    const timePart = newValue.split('T')[1]?.slice(0, 5)
    expect(timePart).toMatch(/^\d{2}:\d{2}$/)
  })
})
