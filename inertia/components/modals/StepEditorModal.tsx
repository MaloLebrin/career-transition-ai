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
  onClose: () => void
}

const StepEditorModal: React.FC<Props> = ({ employeeId, step, onClose }) => {
  const isEditing = !!step

  const { data, setData, post, put, processing, errors, reset } = useForm({
    title: step?.title ?? '',
    description: step?.description ?? '',
    dueDate: step?.dueDate ?? new Date().toISOString().split('T')[0],
    associatedExercise: step?.associatedExercise?.toLowerCase() ?? '',
    isLocked: step?.isLocked ?? true,
  })

  useEffect(() => {
    if (step) {
      setData({
        title: step.title,
        description: step.description ?? '',
        dueDate: step.dueDate,
        associatedExercise: step.associatedExercise?.toLowerCase() ?? '',
        isLocked: step.isLocked ?? true,
      })
    }
  }, [step])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...data,
      associatedExercise: data.associatedExercise || null,
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg relative animate-slideUp">
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
            {isEditing ? 'Modifier l\'étape' : 'Ajouter une étape'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isEditing
              ? 'Modifiez les informations de cette étape de la feuille de route.'
              : 'Créez une nouvelle étape pour la feuille de route.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Titre de l'étape"
            required
            placeholder="Ex: Analyse de motivation"
            value={data.title}
            onChange={(e) => setData('title', e.target.value)}
            error={errors.title}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full border border-brand-navy/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-sage transition-all resize-none min-h-[100px]"
              placeholder="Description de l'étape..."
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <Input
            type="date"
            label="Date prévue"
            required
            value={data.dueDate}
            onChange={(e) => setData('dueDate', e.target.value)}
            error={errors.dueDate}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Exercice associé
            </label>
            <select
              className="w-full border border-brand-navy/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-sage transition-all bg-white"
              value={data.associatedExercise}
              onChange={(e) => setData('associatedExercise', e.target.value)}
            >
              <option value="">Aucun exercice</option>
              {EXERCISE_LIST.map((exercise) => (
                <option key={exercise.slug} value={exercise.slug}>
                  {exercise.title}
                </option>
              ))}
            </select>
            {errors.associatedExercise && (
              <p className="text-red-500 text-xs mt-1">{errors.associatedExercise}</p>
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
              Étape verrouillée (l'accompagné ne peut pas accéder à l'exercice)
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
