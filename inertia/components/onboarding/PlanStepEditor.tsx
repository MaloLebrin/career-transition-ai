import React, { useState } from 'react'
import DatePicker from '../ui/DatePicker'
import { SupportPlanStep, ExerciseType } from '../../types'

interface Props {
  onSave: (step: Omit<SupportPlanStep, 'id' | 'completed'>) => void
  onCancel: () => void
}

const PlanStepEditor: React.FC<Props> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    associatedExercise: '' as ExerciseType | '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      associatedExercise: formData.associatedExercise || undefined,
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
            Outil Associé
          </label>
          <select
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            value={formData.associatedExercise}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                associatedExercise: e.target.value as ExerciseType,
              }))
            }
          >
            <option value="">Aucun</option>
            <option value={ExerciseType.LIFE_CURVE}>La courbe de vie</option>
            <option value={ExerciseType.MOTIVATION}>Questionnaire Motivation</option>
            <option value={ExerciseType.VALUES}>Recherche de Valeurs</option>
            <option value={ExerciseType.PERSONALITY}>Questionnaire Personnalité</option>
            <option value={ExerciseType.DISC}>Diagnostic DISC</option>
            <option value={ExerciseType.TARGETING}>Ciblage Entreprises</option>
          </select>
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
