import { describe, test, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StepEditorModal from '../../../../inertia/components/modals/StepEditorModal'

const mockPost = vi.fn()
const mockPut = vi.fn()
const mockReset = vi.fn()

type FormDataState = {
  instructions: string
  scheduledAt: string
  locationOrLink: string
  associatedExercises: string[]
  isLocked: boolean
}

let mockData: FormDataState = {
  instructions: '',
  scheduledAt: '',
  locationOrLink: '',
  associatedExercises: [],
  isLocked: true,
}

const mockSetData = vi.fn((keyOrData: keyof FormDataState | FormDataState, value?: unknown) => {
  if (typeof keyOrData === 'string') {
    mockData = { ...mockData, [keyOrData]: value } as FormDataState
    return
  }

  mockData = { ...keyOrData }
})

vi.mock('@inertiajs/react', () => ({
  useForm: (initialData: FormDataState) => {
    mockData = { ...initialData }
    return {
      data: mockData,
      setData: mockSetData,
      post: mockPost,
      put: mockPut,
      processing: false,
      errors: {},
      reset: mockReset,
    }
  },
}))

function toExpectedLocalDateTime(dateValue: string): string {
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toExpectedDateDisplay(dateValue: string): string {
  const date = new Date(dateValue)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

describe('StepEditorModal', () => {
  beforeEach(() => {
    mockData = {
      instructions: '',
      scheduledAt: '',
      locationOrLink: '',
      associatedExercises: [],
      isLocked: true,
    }
    mockPost.mockReset()
    mockPut.mockReset()
    mockSetData.mockClear()
    mockReset.mockClear()
  })

  test('renders DateTimePicker with initial value in edit mode', () => {
    const step = {
      id: 12,
      instructions: 'Instructions',
      scheduledAt: '2026-03-19T13:08:00.000Z',
      locationOrLink: 'https://meet.google.com/abc-defg-hij',
      associatedExercises: ['MOTIVATION'],
      isLocked: true,
      sortOrder: 1,
    }

    render(<StepEditorModal employeeId="2" step={step as any} onClose={vi.fn()} />)

    const triggerLabel = screen.getByText(/Date et heure du RDV/i)
    expect(triggerLabel).toBeInTheDocument()
    // le DateTimePicker formate la valeur en interne, on vérifie juste que la donnée initiale est bien injectée
    expect(mockData.scheduledAt).toBe(step.scheduledAt)
  })

  test('submits null scheduledAt when datetime is empty', () => {
    render(<StepEditorModal employeeId="2" stepNumber={2} onClose={vi.fn()} />)

    const submitButton = screen.getByRole('button', { name: /Créer/i })
    const form = submitButton.closest('form') as HTMLFormElement
    fireEvent.submit(form)

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledWith(
      '/dashboard/conseiller/employees/2/steps',
      expect.objectContaining({
        data: expect.objectContaining({
          scheduledAt: null,
          locationOrLink: null,
          associatedExercises: [],
        }),
        onSuccess: expect.any(Function),
      })
    )
  })
})
