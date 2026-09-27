import { describe, expect, test, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { useState } from 'react'

import Combobox, { type ComboboxOption, type ComboboxProps } from '~/components/ui/Combobox'
import { renderWithUser } from '../../support/render'

const options: ComboboxOption[] = [
  { id: 1, label: 'React', description: 'Frontend' },
  { id: 2, label: 'Node.js', description: 'Backend' },
  { id: 3, label: 'Communication' },
]

function Controlled(props: Partial<ComboboxProps<ComboboxOption>> & { onChangeSpy?: (o: ComboboxOption | null) => void }) {
  const { onChangeSpy, ...rest } = props
  const [value, setValue] = useState<ComboboxOption | null>(props.value ?? null)
  return (
    <Combobox
      label="Compétence"
      options={options}
      {...rest}
      value={value}
      onChange={(option) => {
        setValue(option)
        onChangeSpy?.(option)
      }}
    />
  )
}

describe('Combobox', () => {
  test('affiche le label, l’astérisque obligatoire et le hint', () => {
    renderWithUser(<Controlled required hint="Tape pour rechercher" placeholder="Chercher..." />)
    expect(screen.getByText('Compétence')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByText('Tape pour rechercher')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Compétence/ })).toHaveAttribute('placeholder', 'Chercher...')
  })

  test('affiche l’erreur à la place du hint', () => {
    renderWithUser(<Controlled hint="Aide" error="Champ requis" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Champ requis')
    expect(screen.queryByText('Aide')).not.toBeInTheDocument()
  })

  test('filtre les options par libellé ou description et sélectionne au clic', async () => {
    const onChangeSpy = vi.fn()
    const { user } = renderWithUser(<Controlled onChangeSpy={onChangeSpy} />)

    const input = screen.getByRole('combobox', { name: /Compétence/ })
    await user.type(input, 'back')

    const listed = await screen.findAllByRole('option')
    expect(listed).toHaveLength(1)
    expect(listed[0]).toHaveTextContent('Node.js')

    await user.click(listed[0])
    expect(onChangeSpy).toHaveBeenCalledWith(options[1])
    expect(input).toHaveValue('Node.js')
  })

  test('limite le nombre d’options affichées avec maxDisplayed', async () => {
    const { user } = renderWithUser(<Controlled maxDisplayed={2} />)
    await user.click(screen.getByRole('button', { name: '' }))
    expect(await screen.findAllByRole('option')).toHaveLength(2)
  })

  test('affiche le message vide quand aucune option ne correspond', async () => {
    const { user } = renderWithUser(<Controlled emptyMessage="Rien ici" />)
    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), 'zzz')
    expect(await screen.findByText('Rien ici')).toBeInTheDocument()
  })

  test('propose de créer une option inconnue quand allowCreate est actif', async () => {
    const onCreate = vi.fn()
    const { user } = renderWithUser(<Controlled allowCreate onCreate={onCreate} />)

    await user.type(screen.getByRole('combobox', { name: /Compétence/ }), '  Figma  ')
    await user.click(await screen.findByText('Créer « Figma »'))

    expect(onCreate).toHaveBeenCalledWith('Figma')
  })

  test('le bouton d’effacement vide la sélection', async () => {
    const onChangeSpy = vi.fn()
    const { user } = renderWithUser(<Controlled value={options[0]} onChangeSpy={onChangeSpy} />)

    expect(screen.getByRole('combobox', { name: /Compétence/ })).toHaveValue('React')
    await user.click(screen.getByRole('button', { name: 'Effacer la sélection' }))

    expect(onChangeSpy).toHaveBeenCalledWith(null)
    expect(screen.queryByRole('button', { name: 'Effacer la sélection' })).not.toBeInTheDocument()
  })

  test('désactivé ou non effaçable : pas de bouton d’effacement', () => {
    const { unmount } = renderWithUser(<Controlled value={options[0]} disabled sizeVariant="sm" />)
    expect(screen.getByRole('combobox', { name: /Compétence/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Effacer la sélection' })).not.toBeInTheDocument()
    unmount()

    renderWithUser(<Controlled value={options[0]} clearable={false} sizeVariant="lg" />)
    expect(screen.queryByRole('button', { name: 'Effacer la sélection' })).not.toBeInTheDocument()
  })
})
