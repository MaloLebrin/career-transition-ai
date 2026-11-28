import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { QualitativeAnalysisStatusNotice } from '~/components/dashboard/exercises/QualitativeAnalysisStatusNotice'
import { resetInertiaMock, routerSpies } from '../../../support/inertia_mock'
import { renderWithUser } from '../../../support/render'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../../../support/inertia_mock')
  return inertiaMock()
})

describe('QualitativeAnalysisStatusNotice (#171)', () => {
  beforeEach(() => resetInertiaMock())

  test('échec définitif : message et relance par router.post', async () => {
    const { user } = renderWithUser(
      <QualitativeAnalysisStatusNotice employeeId="5" type="values" status="failed" />
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/n’a pas pu être générée/)
    await user.click(screen.getByRole('button', { name: 'Relancer l’analyse' }))

    expect(routerSpies.post).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/5/exercises/results/values/analysis/retry',
      {},
      expect.objectContaining({ preserveScroll: true })
    )
  })

  test('analyse en cours : indication sans bouton', () => {
    render(<QualitativeAnalysisStatusNotice employeeId="5" type="values" status="pending" />)

    expect(screen.getByRole('status')).toHaveTextContent(/en cours de génération/)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test.each(['done', null, undefined] as const)('statut %s : rien n’est affiché', (status) => {
    const { container } = render(
      <QualitativeAnalysisStatusNotice employeeId="5" type="values" status={status} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
