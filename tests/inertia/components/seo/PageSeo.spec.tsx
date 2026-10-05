import { render } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { PageSeo } from '~/components/seo/PageSeo'

const headSpy = vi.fn()

vi.mock('@inertiajs/react', () => ({
  Head: (props: { title?: string; children?: React.ReactNode }) => {
    headSpy(props)
    return null
  },
}))

describe('PageSeo', () => {
  test('transmet le titre et les métadonnées description, Open Graph et Twitter', () => {
    render(<PageSeo title="Tarifs" description="Un forfait unique." />)

    const props = headSpy.mock.calls.at(-1)?.[0]
    expect(props.title).toBe('Tarifs')

    const metas = (Array.isArray(props.children) ? props.children : [props.children]).map(
      (m: { props: Record<string, string> }) => m.props
    )
    const byKey = Object.fromEntries(metas.map((m: Record<string, string>) => [m['head-key'], m]))
    expect(byKey['description'].content).toBe('Un forfait unique.')
    expect(byKey['og:title'].content).toBe('Tarifs - Transition Carrière')
    expect(byKey['og:description'].content).toBe('Un forfait unique.')
    expect(byKey['og:locale'].content).toBe('fr_FR')
    expect(byKey['twitter:card'].content).toBe('summary')
  })
})
