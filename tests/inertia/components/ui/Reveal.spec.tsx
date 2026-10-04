import { act, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Reveal } from '~/components/ui/Reveal'

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void

describe('Reveal', () => {
  const original = globalThis.IntersectionObserver

  afterEach(() => {
    globalThis.IntersectionObserver = original
  })

  it('reste masqué jusqu’à son entrée dans la fenêtre, puis apparaît', () => {
    let trigger: Callback = () => {}
    const disconnect = vi.fn()
    class Observer {
      constructor(callback: Callback) {
        trigger = callback
      }
      observe() {}
      disconnect = disconnect
    }
    // @ts-expect-error stub de test
    globalThis.IntersectionObserver = Observer

    render(<Reveal delay={200}>Contenu</Reveal>)
    const block = screen.getByText('Contenu')
    expect(block).toHaveAttribute('data-revealed', 'false')
    expect(block).toHaveClass('opacity-0')
    expect(block).toHaveStyle({ transitionDelay: '200ms' })

    act(() => trigger([{ isIntersecting: true }]))
    expect(block).toHaveAttribute('data-revealed', 'true')
    expect(block).toHaveClass('opacity-100')
    expect(disconnect).toHaveBeenCalled()
  })

  it('reste visible sans IntersectionObserver', () => {
    // @ts-expect-error absence simulée
    delete globalThis.IntersectionObserver
    render(<Reveal>Contenu</Reveal>)
    expect(screen.getByText('Contenu')).toHaveAttribute('data-revealed', 'true')
  })
})
