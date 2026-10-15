import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TEAM_PLACEHOLDER_NOTICE } from '#shared/constants/team'
import { PlaceholderNotice } from '~/components/marketing/about/PlaceholderNotice'

describe('PlaceholderNotice', () => {
  test('affiche la note de transparence par défaut', () => {
    render(<PlaceholderNotice />)

    expect(screen.getByRole('note')).toHaveTextContent(TEAM_PLACEHOLDER_NOTICE)
  })

  test('accepte un texte personnalisé et une classe', () => {
    render(<PlaceholderNotice className="mt-6">Contenu provisoire.</PlaceholderNotice>)

    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Contenu provisoire.')
    expect(note).toHaveClass('mt-6')
  })
})
