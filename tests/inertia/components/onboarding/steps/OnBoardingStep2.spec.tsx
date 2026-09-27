import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { OnBoardingStep2 } from '../../../../../inertia/components/onboarding/steps/OnBoardingStep2'
import { extractCVData } from '../../../../../inertia/helpers/ai'

vi.mock('../../../../../inertia/helpers/ai', () => ({ extractCVData: vi.fn() }))

function renderStep() {
  const onNext = vi.fn()
  const setFormData = vi.fn()
  const { container } = render(<OnBoardingStep2 onNext={onNext} setFormData={setFormData} />)
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  return { onNext, setFormData, input }
}

describe('OnBoardingStep2', () => {
  beforeEach(() => vi.mocked(extractCVData).mockReset())

  test('envoie le fichier choisi au serveur, pré-remplit le profil et passe à la suite', async () => {
    vi.mocked(extractCVData).mockResolvedValue({
      name: 'Camille Martin',
      email: '',
      currentRole: 'Comptable',
      suggestedTargetRole: 'Contrôleuse de gestion',
      summary: 'Résumé',
      skills: [{ name: 'SQL', level: 3 }],
      experiences: [],
      educations: [],
    })
    const { onNext, setFormData, input } = renderStep()
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(onNext).toHaveBeenCalled())
    expect(extractCVData).toHaveBeenCalledWith(file)
    const update = setFormData.mock.calls[0][0]
    expect(update({ name: 'Ancien' })).toMatchObject({
      name: 'Camille Martin',
      currentRole: 'Comptable',
      targetRole: 'Contrôleuse de gestion',
      skills: [{ name: 'SQL', level: 3 }],
    })
  })

  test('extraction vide : reste sur l’étape sans toucher au profil', async () => {
    vi.mocked(extractCVData).mockResolvedValue(null)
    const { onNext, setFormData, input } = renderStep()

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'cv.png', { type: 'image/png' })] },
    })

    await waitFor(() => expect(extractCVData).toHaveBeenCalled())
    expect(setFormData).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })
})
