import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SelectField from '../../../../inertia/components/ui/SelectField'

describe('SelectField', () => {
  test('renders options and calls onChange', () => {
    const onChange = vi.fn()
    render(
      <SelectField
        aria-label="Choisir"
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B', description: 'Aide B' },
        ]}
        value="a"
        onChange={onChange}
      />
    )

    const el = screen.getByRole('combobox', { name: /Choisir/i })
    fireEvent.change(el, { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  test('shows selected option description when showSelectedOptionDescription is true', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SelectField
        aria-label="Rôle"
        options={[
          { value: 'x', label: 'X', description: 'Desc X' },
          { value: 'y', label: 'Y', description: 'Desc Y' },
        ]}
        value="x"
        onChange={onChange}
        showSelectedOptionDescription
      />
    )

    expect(screen.getByText('Desc X')).toBeInTheDocument()

    rerender(
      <SelectField
        aria-label="Rôle"
        options={[
          { value: 'x', label: 'X', description: 'Desc X' },
          { value: 'y', label: 'Y', description: 'Desc Y' },
        ]}
        value="y"
        onChange={onChange}
        showSelectedOptionDescription
      />
    )

    expect(screen.getByText('Desc Y')).toBeInTheDocument()
    expect(screen.queryByText('Desc X')).not.toBeInTheDocument()
  })

  test('renders label and field description', () => {
    render(
      <SelectField
        label="Statut"
        description="Choisissez un statut pour filtrer."
        options={[{ value: 'all', label: 'Tous' }]}
        value="all"
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('Statut')).toBeInTheDocument()
    expect(screen.getByText(/Choisissez un statut pour filtrer/)).toBeInTheDocument()
  })

  test('shows error message instead of field description when error is set', () => {
    render(
      <SelectField
        label="Statut"
        description="Ne doit pas s’afficher."
        error="Champ requis."
        options={[{ value: 'all', label: 'Tous' }]}
        value="all"
        onChange={vi.fn()}
      />
    )

    expect(screen.queryByText(/Ne doit pas s’afficher/)).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Champ requis.')
  })
})
