import React, { useState } from 'react'
import DatePicker from '../ui/DatePicker'
import { SupportPlanStep, ExerciseType } from '../../types'

interface Props {
  onSave: (step: Omit<SupportPlanStep, 'id' | 'completed'>) => void
  onCancel: () => void
}

const AVAILABLE_EXERCISES = [
  { value: ExerciseType.LIFE_CURVE, label: 'La courbe de vie' },
  { value: ExerciseType.MOTIVATION, label: 'Questionnaire Motivation' },
  { value: ExerciseType.VALUES, label: 'Recherche de Valeurs' },
  { value: ExerciseType.PERSONALITY, label: 'Questionnaire Personnalité' },
  { value: ExerciseType.DISC, label: 'Diagnostic DISC' },
  { value: ExerciseType.TARGETING, label: 'Ciblage Entreprises' },
]

const PlanStepEditor: React.FC<Props> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    associatedExercises: [] as ExerciseType[],
  })

  const handleExerciseToggle = (exercise: ExerciseType) => {
    setFormData((prev) => ({
      ...prev,
      associatedExercises: prev.associatedExercises.includes(exercise)
        ? prev.associatedExercises.filter((e) => e !== exercise)
        : [...prev.associatedExercises, exercise],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      associatedExercises: formData.associatedExercises.length > 0 ? formData.associatedExercises : undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 animate-slideUp"
    >
      <h4 className="font-bold text-slate-800">Ajouter une étape personnalisée</h4>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          Titre de l'étape
        </label>
        <input
          required
          type="text"
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Ex: Identification des motivations"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
        <textarea
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none h-20"
          placeholder="Détails sur l'objectif de cette étape..."
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <DatePicker
            label="Échéance"
            value={formData.dueDate}
            onChange={(val) => setFormData((prev) => ({ ...prev, dueDate: val }))}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Outils Associés
          </label>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {AVAILABLE_EXERCISES.map((exercise) => (
              <label
                key={exercise.value}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={formData.associatedExercises.includes(exercise.value)}
                  onChange={() => handleExerciseToggle(exercise.value)}
                  className="rounded border-slate-300"
                />
                <span>{exercise.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
        >
          Enregistrer l'étape
        </button>
      </div>
    </form>
  )
}

export default PlanStepEditor
