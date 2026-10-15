import { describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { TestimonialCard } from '~/components/marketing/about/TestimonialCard'

const TESTIMONIAL = {
  id: 'sophie-l',
  quote: 'Les exercices m’ont aidée à mettre des mots sur ce que je voulais.',
  author: 'Sophie L.',
  context: 'Reconversion après la logistique',
}

describe('TestimonialCard', () => {
  test('rend une figure avec la citation en blockquote et l’auteur en légende', () => {
    render(<TestimonialCard testimonial={TESTIMONIAL} />)

    const figure = screen.getByRole('figure')
    const quote = figure.querySelector('blockquote')
    expect(quote).toHaveTextContent(TESTIMONIAL.quote)

    const caption = figure.querySelector('figcaption')
    expect(caption).toHaveTextContent('Sophie L.')
    expect(caption).toHaveTextContent('Reconversion après la logistique')
    expect(within(figure).getByText('Sophie L.')).toHaveClass('font-semibold')
  })

  test('l’icône de citation est décorative et aucune note n’est affichée', () => {
    const { container } = render(<TestimonialCard testimonial={TESTIMONIAL} />)

    expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(container.textContent).not.toMatch(/\d\s*\/\s*5|★/)
  })
})
