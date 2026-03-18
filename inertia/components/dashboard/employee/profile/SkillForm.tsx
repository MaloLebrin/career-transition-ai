import { useForm } from '@inertiajs/react'
import { useCallback, useMemo, useState } from 'react'
import Button from '~/components/ui/Button'
import Combobox, { type ComboboxOption } from '~/components/ui/Combobox'

interface AvailableSkill {
  id: number
  name: string
  category: string | null
}

type Props = {
  onCancel: () => void
  availableSkills?: AvailableSkill[]
}

interface SkillOption extends ComboboxOption {
  id: number | string
  label: string
  description?: string
  category?: string | null
}

export default function SkillForm({ onCancel, availableSkills = [] }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    category: '',
    level: 3 as 1 | 2 | 3 | 4 | 5,
  })

  const [selectedSkill, setSelectedSkill] = useState<SkillOption | null>(null)

  const skillOptions: SkillOption[] = useMemo(
    () =>
      availableSkills.map((skill) => ({
        id: skill.id,
        label: skill.name,
        description: skill.category ?? undefined,
        category: skill.category,
      })),
    [availableSkills]
  )

  const handleSkillChange = useCallback(
    (option: SkillOption | null) => {
      setSelectedSkill(option)
      if (option) {
        setData('name', option.label)
        setData('category', option.category ?? '')
      } else {
        setData('name', '')
        setData('category', '')
      }
    },
    [setData]
  )

  const handleCreateSkill = useCallback(
    (inputValue: string) => {
      const newOption: SkillOption = {
        id: `new-${Date.now()}`,
        label: inputValue,
      }
      setSelectedSkill(newOption)
      setData('name', inputValue)
      setData('category', '')
    },
    [setData]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      post('/dashboard/candidat/skills', {
        onSuccess: () => {
          reset()
          setSelectedSkill(null)
          onCancel()
        },
      })
    },
    [post, reset, onCancel]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Combobox
        label="Compétence"
        required
        placeholder="Rechercher ou créer une compétence..."
        options={skillOptions}
        value={selectedSkill}
        onChange={handleSkillChange}
        allowCreate
        onCreate={handleCreateSkill}
        error={errors.name}
        emptyMessage="Aucune compétence trouvée"
        hint="Tape pour rechercher ou créer une nouvelle compétence"
      />

      {selectedSkill && typeof selectedSkill.id === 'string' && selectedSkill.id.startsWith('new-') && (
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">
            Catégorie (optionnel)
          </label>
          <input
            type="text"
            className="w-full p-4 bg-white border border-brand-navy/10 rounded-2xl outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5 font-medium transition-all text-sm min-h-[54px]"
            placeholder="Ex: Frontend, Backend, Soft skills..."
            value={data.category}
            onChange={(e) => setData('category', e.target.value)}
          />
          {errors.category && (
            <p className="text-[9px] font-bold text-rose-500 px-2">{errors.category}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5 w-full">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">
          Niveau
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setData('level', lvl as 1 | 2 | 3 | 4 | 5)}
              className={[
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all',
                data.level === lvl
                  ? 'bg-brand-sage text-white shadow-lg'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              ].join(' ')}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p className="text-[9px] font-medium text-slate-400 px-2 mt-1">
          1 = Débutant · 5 = Expert
        </p>
        {errors.level && <p className="text-[9px] font-bold text-rose-500 px-2">{errors.level}</p>}
      </div>

      <div className="flex justify-end gap-4 pt-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={processing}>
          Annuler
        </Button>
        <Button type="submit" disabled={processing || !selectedSkill}>
          {processing ? 'Ajout...' : 'Ajouter'}
        </Button>
      </div>
    </form>
  )
}
