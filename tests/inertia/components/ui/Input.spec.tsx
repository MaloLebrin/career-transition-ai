import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Input, { type InputType } from '../../../../inertia/components/ui/Input'

const INPUT_TYPES: InputType[] = [
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'color',
  'range',
]

describe('Input', () => {
  describe('types d’input', () => {
    test.each(INPUT_TYPES)('renders correctly with type="%s"', (type) => {
      const { container } = render(
        <Input type={type} label="Champ" placeholder={`Placeholder ${type}`} />
      )
      const input = container.querySelector('input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', type === 'password' ? 'password' : type)
    })

    test('default type is text', () => {
      const { container } = render(<Input aria-label="Champ" />)
      const input = container.querySelector('input')
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  describe('bouton afficher/masquer mot de passe', () => {
    test('affiche le bouton quand type="password"', () => {
      render(<Input type="password" label="Mot de passe" />)
      expect(screen.getByRole('button', { name: /afficher le mot de passe/i })).toBeInTheDocument()
    })

    test('masque le bouton quand showPasswordToggle={false}', () => {
      render(<Input type="password" showPasswordToggle={false} />)
      expect(screen.queryByRole('button', { name: /mot de passe/i })).not.toBeInTheDocument()
    })

    test('pas de bouton password pour type="text"', () => {
      render(<Input type="text" label="Texte" />)
      expect(screen.queryByRole('button', { name: /mot de passe/i })).not.toBeInTheDocument()
    })

    test('clic sur le bouton affiche le mot de passe puis le masque', () => {
      const { container } = render(
        <Input type="password" label="Mot de passe" defaultValue="secret123" />
      )
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.type).toBe('password')

      const toggleBtn = screen.getByRole('button', { name: /afficher le mot de passe/i })
      fireEvent.click(toggleBtn)
      expect(input.type).toBe('text')
      expect(screen.getByRole('button', { name: /masquer le mot de passe/i })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /masquer le mot de passe/i }))
      expect(input.type).toBe('password')
    })

    test('bouton password masqué quand disabled', () => {
      render(<Input type="password" disabled />)
      expect(screen.queryByRole('button', { name: /mot de passe/i })).not.toBeInTheDocument()
    })
  })

  describe('bouton vider', () => {
    test('affiche le bouton vider quand le champ a une valeur (type text)', () => {
      render(<Input type="text" defaultValue="hello" aria-label="Champ" />)
      expect(screen.getByRole('button', { name: /vider le champ/i })).toBeInTheDocument()
    })

    test('masque le bouton vider quand le champ est vide', () => {
      render(<Input type="text" aria-label="Champ" />)
      expect(screen.queryByRole('button', { name: /vider le champ/i })).not.toBeInTheDocument()
    })

    test('masque le bouton vider quand showClearButton={false}', () => {
      render(<Input type="text" defaultValue="hello" showClearButton={false} />)
      expect(screen.queryByRole('button', { name: /vider le champ/i })).not.toBeInTheDocument()
    })

    test('clic sur vider vide le champ (mode contrôlé)', () => {
      const onChange = vi.fn()
      render(<Input type="text" value="hello" onChange={onChange} aria-label="Champ" />)
      fireEvent.click(screen.getByRole('button', { name: /vider le champ/i }))
      expect(onChange).toHaveBeenCalledTimes(1)
      const event = onChange.mock.calls[0][0]
      expect(event.target.value).toBe('')
    })

    test('clic sur vider vide le champ (mode non contrôlé)', () => {
      const { container } = render(
        <Input type="email" defaultValue="test@example.com" aria-label="Email" />
      )
      const input = container.querySelector('input') as HTMLInputElement
      expect(input.value).toBe('test@example.com')

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /vider le champ/i }))
      })
      expect(container.querySelector('input')).toHaveValue('')
    })

    test('bouton vider masqué quand disabled', () => {
      render(<Input type="text" defaultValue="hello" disabled />)
      expect(screen.queryByRole('button', { name: /vider le champ/i })).not.toBeInTheDocument()
    })

    test('types clearable affichent le bouton vider quand il y a une valeur', () => {
      const { rerender } = render(
        <Input type="number" value={42} onChange={() => {}} aria-label="Nombre" />
      )
      expect(screen.getByRole('button', { name: /vider le champ/i })).toBeInTheDocument()

      rerender(<Input type="date" value="2025-01-15" onChange={() => {}} aria-label="Date" />)
      expect(screen.getByRole('button', { name: /vider le champ/i })).toBeInTheDocument()
    })
  })

  describe('label, erreur, hint, required', () => {
    test('affiche le label et l’astérisque quand required', () => {
      render(<Input label="Email" required />)
      expect(screen.getByText(/Email/)).toBeInTheDocument()
      const label = screen.getByText(/Email/).closest('label')
      expect(label?.querySelector('[aria-hidden="true"]')).toHaveTextContent('*')
    })

    test('affiche le message d’erreur', () => {
      render(<Input error="Ce champ est requis" />)
      expect(screen.getByText('Ce champ est requis')).toBeInTheDocument()
      expect(screen.getByText('Ce champ est requis')).toHaveAttribute('role', 'alert')
    })

    test('affiche le hint quand pas d’erreur', () => {
      render(<Input hint="Indice pour l’utilisateur" />)
      expect(screen.getByText((content) => content.includes('Indice pour l'))).toBeInTheDocument()
    })

    test('masque le hint quand une erreur est affichée', () => {
      render(<Input hint="Indice" error="Erreur" />)
      expect(screen.getByText('Erreur')).toBeInTheDocument()
      expect(screen.queryByText('Indice')).not.toBeInTheDocument()
    })
  })

  describe('accessibilité', () => {
    test('input a aria-invalid quand error est défini', () => {
      const { container } = render(<Input error="Erreur" />)
      const input = container.querySelector('input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    test('label est associé à l’input via htmlFor/id', () => {
      render(<Input label="Mon champ" id="my-id" />)
      const label = screen.getByText('Mon champ', { selector: 'label' })
      expect(label).toHaveAttribute('for', 'my-id')
      const input = screen.getByRole('textbox', { name: 'Mon champ' })
      expect(input).toHaveAttribute('id', 'my-id')
    })

    test('boutons d’action ont des aria-label', () => {
      render(<Input type="password" value="x" onChange={() => {}} />)
      expect(screen.getByRole('button', { name: /afficher le mot de passe/i })).toBeInTheDocument()
    })
  })

  describe('addons', () => {
    test('affiche leftAddon et rightAddon', () => {
      render(
        <Input leftAddon={<span>€</span>} rightAddon={<span>.00</span>} aria-label="Montant" />
      )
      expect(screen.getByText('€')).toBeInTheDocument()
      expect(screen.getByText('.00')).toBeInTheDocument()
    })
  })
})
