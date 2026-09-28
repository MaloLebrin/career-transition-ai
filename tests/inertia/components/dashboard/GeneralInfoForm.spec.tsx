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

  test("pré-remplit les champs avec les données de l'organisation", () => {
    render(<GeneralInfoForm organization={mockOrg} />)

    expect(screen.getByDisplayValue('Mon Cabinet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('mon-cabinet')).toBeInTheDocument()
  })

  test("réinitialise le formulaire quand l'organisation change d'id", () => {
    const { rerender } = render(<GeneralInfoForm organization={mockOrg} />)

    const updatedOrg = { ...mockOrg, id: 2, name: 'Nouveau Cabinet', slug: 'nouveau-cabinet' }
    rerender(<GeneralInfoForm organization={updatedOrg} />)

    expect(screen.getByDisplayValue('Nouveau Cabinet')).toBeInTheDocument()
    expect(screen.getByDisplayValue('nouveau-cabinet')).toBeInTheDocument()
  })

  test('admin : champs modifiables et bouton de mise à jour', () => {
    render(<GeneralInfoForm organization={mockOrg} />)

    expect(screen.getByDisplayValue('Mon Cabinet')).not.toBeDisabled()
    expect(screen.getByText('Mettre à jour les infos')).toBeInTheDocument()
  })

  /** #61 : un conseiller ou un expert consulte le cabinet sans pouvoir le modifier. */
  test('lecture seule : champs désactivés, pas de bouton de mise à jour', () => {
    render(<GeneralInfoForm organization={mockOrg} readOnly />)

    expect(screen.getByDisplayValue('Mon Cabinet')).toBeDisabled()
    expect(screen.getByDisplayValue('mon-cabinet')).toBeDisabled()
    expect(screen.queryByText('Mettre à jour les infos')).not.toBeInTheDocument()
    expect(screen.getByText(/Seul un administrateur du cabinet/)).toBeInTheDocument()
  })
})
