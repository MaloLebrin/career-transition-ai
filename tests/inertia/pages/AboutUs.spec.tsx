import { beforeEach, describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import AboutUs from '../../../inertia/pages/AboutUs'
import { GaletPortrait } from '../../../inertia/components/marketing/about/GaletPortrait'
import { GALET_PATH } from '../../../inertia/components/ui/logo/logo_geometry'
import { resetInertiaMock, setPageProps } from '../support/inertia_mock'

vi.mock('@inertiajs/react', async () => {
  const { inertiaMock } = await import('../support/inertia_mock')
  return inertiaMock()
})

describe('AboutUs page (planche 50)', () => {
  beforeEach(() => resetInertiaMock())

  test('héros court, deux portraits, pourquoi ce nom', () => {
    render(<AboutUs />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Deux psychologues du travail/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Sophie' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Antoine' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Portrait de Sophie, photo à venir' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Portrait de Antoine, photo à venir' })
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: 'Domaines de Sophie' })).getAllByRole('listitem')
    ).toHaveLength(4)
    expect(screen.getByText('Pourquoi ce nom')).toBeInTheDocument()
    expect(screen.getByText(/Le U au milieu, c’est vous/)).toBeInTheDocument()
  })

  test('appel final vers l’inscription quand elle est ouverte', () => {
    setPageProps({ b2cRegistrationEnabled: true })
    render(<AboutUs />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Sautez. On tient la rampe.' })
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Commencer gratuitement' })
    ).toHaveAttribute('href', '/inscription')
  })

  test('appel final vers la liste d’attente de l’accueil quand elle est fermée', () => {
    render(<AboutUs />)

    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Être prévenu de l’ouverture' })
    ).toHaveAttribute('href', '/#contact')
  })
})

describe('GaletPortrait', () => {
  test('sans photo : galet de secours et pastille de l’initiale', () => {
    const { container } = render(
      <GaletPortrait name="Sophie" fallbackClassName="fill-sun" badgeClassName="bg-tint-sun-ink" />
    )

    const galet = container.querySelector(`path[d="${GALET_PATH}"].fill-sun`)
    expect(galet).not.toBeNull()
    expect(container.querySelector('image')).toBeNull()
    expect(screen.getByText('S')).toHaveClass('bg-tint-sun-ink')
  })

  test('avec photo : image découpée dans le galet', () => {
    const { container } = render(
      <GaletPortrait
        name="Antoine"
        photoUrl="https://example.test/antoine.jpg"
        fallbackClassName="fill-tint-lake"
        badgeClassName="bg-tint-lake-ink"
      />
    )

    expect(screen.getByRole('img', { name: 'Portrait de Antoine' })).toBeInTheDocument()
    const image = container.querySelector('image')
    expect(image).toHaveAttribute('href', 'https://example.test/antoine.jpg')
    const clipId = container.querySelector('clipPath')?.getAttribute('id')
    expect(image).toHaveAttribute('clip-path', `url(#${clipId})`)
  })
})
