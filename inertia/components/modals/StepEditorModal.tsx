import React, { useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { SupportPlanStep } from '~/types'
import { EXERCISE_LIST } from '~/config/exercises'

interface Props {
  employeeId: number | string
  step?: SupportPlanStep
  stepNumber?: number
  onClose: () => void
}

const StepEditorModal: React.FC<Props> = ({ employeeId, step, stepNumber, onClose }) => {
  const isEditing = !!step

  const { data, setData, post, put, processing, errors, reset } = useForm({
    instructions: step?.instructions ?? '',
    scheduledAt: step?.scheduledAt
      ? new Date(step.scheduledAt).toISOString().slice(0, 16)
      : '',
    locationOrLink: step?.locationOrLink ?? '',
    associatedExercises: (step?.associatedExercises ?? []).map((e) => e.toLowerCase()),
    isLocked: step?.isLocked ?? true,
  })

  useEffect(() => {
    if (step) {
      setData({
        instructions: step.instructions ?? '',
        scheduledAt: step.scheduledAt
          ? new Date(step.scheduledAt).toISOString().slice(0, 16)
          : '',
        locationOrLink: step.locationOrLink ?? '',
        associatedExercises: (step.associatedExercises ?? []).map((e) => e.toLowerCase()),
        isLocked: step.isLocked ?? true,
      })
    }
  }, [step])

  const handleExerciseToggle = (slug: string) => {
    const current = data.associatedExercises
    if (current.includes(slug)) {
      setData('associatedExercises', current.filter((e) => e !== slug))
    } else {
      setData('associatedExercises', [...current, slug])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...data,
      associatedExercises: data.associatedExercises.length > 0 ? data.associatedExercises : [],
      scheduledAt: data.scheduledAt || null,
      locationOrLink: data.locationOrLink || null,
    }

    if (isEditing && step) {
      put(`/dashboard/conseiller/employees/${employeeId}/steps/${step.id}`, {
        data: payload,
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    } else {
      post(`/dashboard/conseiller/employees/${employeeId}/steps`, {
        data: payload,
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    }
  }

  const displayNumber = isEditing && step?.sortOrder !== undefined
    ? step.sortOrder + 1
    : stepNumber ?? '?'

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg relative animate-slideUp max-h-[90vh] overflow-y-auto">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
        />

        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? `Modifier RDV ${displayNumber}` : `Nouveau RDV ${displayNumber}`}
          </h2>
          <p className="text-slate-500 mt-2">
            {isEditing
              ? 'Modifiez les informations de ce rendez-vous.'
              : 'Planifiez un nouveau rendez-vous pour la feuille de route.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="datetime-local"
            label="Date et heure du RDV"
            value={data.scheduledAt}
            onChange={(e) => setData('scheduledAt', e.target.value)}
            error={errors.scheduledAt}
          />

          <Input
            label="Lieu ou lien visio"
            placeholder="Ex: Salle 3 ou https://meet.google.com/..."
            value={data.locationOrLink}
            onChange={(e) => setData('locationOrLink', e.target.value)}
            error={errors.locationOrLink}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Consigne pour l'accompagné
            </label>
            <textarea
              className="w-full border border-brand-navy/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-sage transition-all resize-none min-h-[100px]"
              placeholder="Instructions à destination du candidat avant ce RDV..."
              value={data.instructions}
              onChange={(e) => setData('instructions', e.target.value)}
            />
            {errors.instructions && (
              <p className="text-red-500 text-xs mt-1">{errors.instructions}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Exercices associés
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
              {EXERCISE_LIST.map((exercise) => (
                <label
                  key={exercise.slug}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    data.associatedExercises.includes(exercise.slug)
                      ? 'border-brand-sage bg-brand-sage/5'
                      : 'border-brand-navy/10 hover:border-brand-navy/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={data.associatedExercises.includes(exercise.slug)}
                    onChange={() => handleExerciseToggle(exercise.slug)}
                    className="w-4 h-4 rounded border-brand-navy/20 text-brand-sage focus:ring-brand-sage"
                  />
                  <span className="text-sm font-medium text-slate-700">{exercise.title}</span>
                </label>
              ))}
            </div>
            {data.associatedExercises.length > 0 && (
              <p className="text-xs text-brand-sage mt-2">
                {data.associatedExercises.length} exercice{data.associatedExercises.length > 1 ? 's' : ''} sélectionné{data.associatedExercises.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isLocked"
              checked={data.isLocked}
              onChange={(e) => setData('isLocked', e.target.checked)}
              className="w-5 h-5 rounded border-brand-navy/20 text-brand-sage focus:ring-brand-sage"
            />
            <label htmlFor="isLocked" className="text-sm font-medium text-slate-700">
              RDV verrouillé (l'accompagné ne peut pas accéder aux exercices)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={processing}>
              {processing ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default StepEditorModal
