import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { GeneralInfoForm } from '../../../../inertia/components/dashboard/settings/organisation/infos/GeneralInfoForm'

const mockOrg = {
  id: 1,
  name: 'Mon Cabinet',
  slug: 'mon-cabinet',
  createdAt: '2025-01-01T00:00:00.000Z',
}

describe('GeneralInfoForm', () => {
  /**
   * Régression : orgForm figurait dans le tableau de dépendances du useEffect.
   * Comme useForm() retourne un nouvel objet à chaque rendu, appeler setData()
   * déclenchait un nouveau rendu → nouvelle référence → useEffect relancé →
   * boucle infinie ("Maximum update depth exceeded").
   * Ce test échoue si orgForm est réintroduit dans les dépendances.
   */
  test('ne provoque pas de boucle infinie au montage', () => {
    expect(() => render(<GeneralInfoForm organization={mockOrg} />)).not.toThrow()
  })

  test('pré-remplit les champs avec les données de l\'organisation', () => {
    render(<GeneralInfoForm organization={mockOrg} />)

    expect(screen.getByDisplayValue('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('mon-cabinet')).toBeInTheDocument()
  })

  test('réinitialise le formulaire quand l\'organisation change d\'id', () => {
    const { rerender } = render(<GeneralInfoForm organization={mockOrg} />)

    const updatedOrg = { ...mockOrg, id: 2, name: 'Nouveau Cabinet', slug: 'nouveau-cabinet' }
    rerender(<GeneralInfoForm organization={updatedOrg} />)

    expect(screen.getByDisplayValue('Nouveau Cabinet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('nouveau-cabinet')).toBeInTheDocument()
  })
})
