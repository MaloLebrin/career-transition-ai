import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BulletList } from '~/components/marketing/BulletList'

describe('BulletList', () => {
  test('rend un élément de liste par item avec titre et description', () => {
    render(
      <BulletList
        items={[
          { title: 'Transparence', description: 'Les résultats sont expliqués.' },
          { title: 'Sûreté', description: 'Accès contrôlés.' },
        ]}
      />
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Transparence')).toHaveClass('text-ink')
    expect(screen.getByText('Accès contrôlés.')).toHaveClass('text-muted')
  })

  test('rend une liste vide sans item', () => {
    render(<BulletList items={[]} />)

    expect(screen.getByRole('list')).toBeEmptyDOMElement()
  })
})
