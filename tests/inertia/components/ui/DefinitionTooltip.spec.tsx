import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DefinitionTooltip } from '../../../../inertia/components/ui/DefinitionTooltip'

describe('DefinitionTooltip', () => {
  test('sans définition : libellé seul, ni bulle ni focus', () => {
    render(<DefinitionTooltip label="L'autonomie" />)
    const label = screen.getByText("L'autonomie")
    expect(label).not.toHaveAttribute('tabindex')
    fireEvent.mouseEnter(label)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('affiche la définition au survol et la masque en quittant', () => {
    render(<DefinitionTooltip label="L'autonomie" definition="Décider de sa façon de faire." />)
    const label = screen.getByText("L'autonomie")
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.mouseEnter(label)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Décider de sa façon de faire.')
    expect(label).toHaveAttribute('aria-describedby', tooltip.id)

    fireEvent.mouseLeave(label)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('s’ouvre au focus clavier et se ferme avec Échap ou à la perte du focus', () => {
    render(<DefinitionTooltip label="L'autonomie" definition="Décider de sa façon de faire." />)
    const label = screen.getByText("L'autonomie")
    expect(label).toHaveAttribute('tabindex', '0')

    fireEvent.focus(label)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(label, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.focus(label)
    fireEvent.blur(label)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('un tap ouvre puis ferme la bulle (tactile)', () => {
    render(<DefinitionTooltip label="L'autonomie" definition="Décider de sa façon de faire." />)
    const label = screen.getByText("L'autonomie")
    fireEvent.click(label)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.click(label)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
