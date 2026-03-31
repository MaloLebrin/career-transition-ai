import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OfferPage from '../../../../inertia/components/marketing/OfferPage'

describe('OfferPage', () => {
  test('calls onEnterApp when clicking Accès Expert', () => {
    const onEnterApp = vi.fn()
    render(
      <OfferPage
        onEnterApp={onEnterApp}
        onBackToHome={() => {}}
        onOffer={() => {}}
        onMethodology={() => {}}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /Accès Expert/i })[0])
    expect(onEnterApp).toHaveBeenCalledTimes(1)
  })
})

