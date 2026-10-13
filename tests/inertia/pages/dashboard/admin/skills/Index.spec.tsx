import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SkillsAdmin from '../../../../../../inertia/pages/dashboard/admin/skills/Index'
import { formSubmissions, resetInertiaMock, routerSpies } from '../../../../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../../support/inertia_mock')
  return inertiaMock()
})

vi.mock('../../../../../../inertia/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const SKILLS = [
  { id: 1, name: 'Agile', category: 'Méthodes', employeesCount: 3 },
  { id: 2, name: 'Médiation', category: null, employeesCount: 0 },
]
const PAGINATION = { page: 1, pageSize: 25, total: 2, lastPage: 1 }

function renderPage(skills = SKILLS, search = '') {
  return render(<SkillsAdmin skills={skills} pagination={PAGINATION} filters={{ search }} />)
}

describe('SkillsAdmin page (#73)', () => {
  beforeEach(() => resetInertiaMock())

  test('liste le catalogue avec catégorie et nombre de candidats', () => {
    renderPage()
    const table = screen.getByRole('table', { name: 'Compétences du catalogue' })

    expect(within(table).getByText('Agile')).toBeInTheDocument()
    expect(within(table).getByText('Méthodes')).toBeInTheDocument()
    expect(within(table).getByText('3')).toBeInTheDocument()
    expect(within(table).getByText('—')).toBeInTheDocument()
  })

  test('ajouter envoie un POST avec nom et catégorie', async () => {
    const user = userEvent.setup()
    renderPage()
    const form = screen.getByRole('form', { name: 'Ajouter une compétence' })

    await user.type(within(form).getByRole('textbox', { name: /Nom/ }), 'Écoute')
    await user.type(within(form).getByRole('textbox', { name: /Catégorie/ }), 'Soft skills')
    await user.click(within(form).getByRole('button', { name: 'Ajouter' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'post',
      url: '/dashboard/super-admin/skills',
      data: { name: 'Écoute', category: 'Soft skills' },
    })
  })

  test('modifier ouvre un formulaire pré-rempli et envoie un PUT', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Modifier' })[0])
    const form = screen.getByRole('form', { name: 'Modifier Agile' })
    const name = within(form).getByRole('textbox', { name: /Nom/ })
    expect(name).toHaveValue('Agile')
    await user.clear(name)
    await user.type(name, 'Agilité')
    await user.click(within(form).getByRole('button', { name: 'Enregistrer' }))

    expect(formSubmissions.at(-1)).toMatchObject({
      method: 'put',
      url: '/dashboard/super-admin/skills/1',
      data: { name: 'Agilité', category: 'Méthodes' },
    })
  })

  test('supprimer demande confirmation puis envoie un DELETE', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getAllByRole('button', { name: 'Supprimer' })[1])
    expect(screen.getByText('Supprimer cette compétence ?')).toBeInTheDocument()
    expect(routerSpies.delete).not.toHaveBeenCalled()

    await user.click(screen.getAllByRole('button', { name: 'Supprimer' }).at(-1)!)
    expect(routerSpies.delete).toHaveBeenCalledWith(
      '/dashboard/super-admin/skills/2',
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('catalogue vide : message selon la recherche', () => {
    const { unmount } = renderPage([])
    expect(screen.getByText('Le catalogue est vide.')).toBeInTheDocument()
    unmount()

    renderPage([], 'zzz')
    expect(
      screen.getByText('Aucune compétence ne correspond à cette recherche.')
    ).toBeInTheDocument()
  })
})
