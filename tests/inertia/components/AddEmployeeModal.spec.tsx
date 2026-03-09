import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddEmployeeModal from '../../../inertia/components/modals/AddEmployeeModal'

const mockPost = vi.fn()
const mockReset = vi.fn()
const mockSetData = vi.fn()

vi.mock('@inertiajs/react', () => ({
  useForm: () => ({
    data: {
      name: '',
      email: '',
      currentRole: '',
      targetRole: '',
      summary: '',
    },
    setData: mockSetData,
    post: mockPost,
    processing: false,
    errors: {},
    reset: mockReset,
  }),
}))

describe('AddEmployeeModal', () => {
  test('renders title and can be closed with close button', () => {
    const onClose = vi.fn()
    render(<AddEmployeeModal onClose={onClose} />)

    expect(screen.getByText(/Inviter un Talent/i)).toBeInTheDocument()
    expect(screen.getByText(/L'invitation sera envoyée par email/i)).toBeInTheDocument()

    // first button is the close (top-right); second is submit
    const buttons = screen.getAllByRole('button')
    buttons[0].click()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('submits form, then reset and onClose are called on success', () => {
    const onClose = vi.fn()
    render(<AddEmployeeModal onClose={onClose} />)

    const submitButton = screen.getByRole('button', { name: /Envoyer l'invitation/i })
    const form = submitButton.closest('form') as HTMLFormElement
    expect(form).toBeTruthy()
    fireEvent.submit(form)

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees',
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    )

    const options = mockPost.mock.calls[0][1] as { onSuccess?: () => void }
    options.onSuccess?.()
  })
})
