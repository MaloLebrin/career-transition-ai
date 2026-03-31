import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MethodologyPage from '../../../../inertia/components/marketing/MethodologyPage'

describe('MethodologyPage', () => {
  test('calls onEnterApp when clicking CTA', () => {
    const onEnterApp = vi.fn()
    render(<MethodologyPage onEnterApp={onEnterApp} onBackToHome={() => {}} />)

    fireEvent.click(screen.getAllByRole('button', { name: /Accès Expert/i })[0])
    expect(onEnterApp).toHaveBeenCalledTimes(1)
  })
})

