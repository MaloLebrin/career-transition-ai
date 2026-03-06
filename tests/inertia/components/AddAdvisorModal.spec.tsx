import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddAdvisorModal from '../../../inertia/components/modals/AddAdvisorModal'

const mockPost = vi.fn()
const mockReset = vi.fn()
const mockSetData = vi.fn()

vi.mock('@inertiajs/react', () => ({
  useForm: () => ({
    data: {
      name: '',
      email: '',
      role: 'consultant',
    },
    setData: mockSetData,
    post: mockPost,
    processing: false,
    errors: {},
    reset: mockReset,
  }),
}))

describe('AddAdvisorModal', () => {
  test('renders modal content and closes with close button and overlay click', () => {
    const onClose = vi.fn()
    render(<AddAdvisorModal onClose={onClose} />)

    expect(screen.getByText(/Nouveau Collaborateur/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Définissez l'identité et le niveau d'accès du conseiller./i)
    ).toBeInTheDocument()

    const buttons = screen.getAllByRole('button')
    // first button is the close button
    buttons[0].click()
    expect(onClose).toHaveBeenCalledTimes(1)

    // overlay click (clicking on the backdrop)
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  test('submits form and calls reset and onClose on success', () => {
    const onClose = vi.fn()
    render(<AddAdvisorModal onClose={onClose} />)

    const submitButton = screen.getByRole('button', { name: /Envoyer l'invitation/i })
    submitButton.click()

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledWith(
      '/dashboard/settings/organization/advisors',
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    )

    const options = mockPost.mock.calls[0][1] as { onSuccess?: () => void }
    options.onSuccess?.()

    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
