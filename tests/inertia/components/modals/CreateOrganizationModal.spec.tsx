import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { CreateOrganizationModal } from '../../../../inertia/components/modals/CreateOrganizationModal'

const mockPost = vi.fn()
const mockReset = vi.fn()

vi.mock('@inertiajs/react', () => ({
  useForm: () => ({
    data: {
      name: '',
      slug: '',
      ownerName: '',
      ownerEmail: '',
    },
    setData: vi.fn(),
    post: mockPost,
    processing: false,
    errors: {},
    reset: mockReset,
    transform: vi.fn(),
  }),
}))

describe('CreateOrganizationModal', () => {
  test('returns null when closed', () => {
    const { container } = render(<CreateOrganizationModal isOpen={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  test('closes with close button, overlay click, and Escape', () => {
    const onClose = vi.fn()
    render(<CreateOrganizationModal isOpen onClose={onClose} />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  test('submits via post and calls reset and onClose on success', () => {
    const onClose = vi.fn()
    render(<CreateOrganizationModal isOpen onClose={onClose} />)

    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    expect(mockPost).toHaveBeenCalledWith(
      '/dashboard/super-admin/organizations',
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    )

    const options = mockPost.mock.calls[0][1] as { onSuccess?: () => void }
    options.onSuccess?.()
    expect(mockReset).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
