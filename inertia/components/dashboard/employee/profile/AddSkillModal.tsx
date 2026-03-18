import SkillForm from '~/components/dashboard/employee/profile/SkillForm'
import Card from '~/components/ui/Card'

interface AvailableSkill {
  id: number
  name: string
  category: string | null
}

type Props = {
  onClose: () => void
  availableSkills?: AvailableSkill[]
}

export default function AddSkillModal({ onClose, availableSkills = [] }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg relative animate-slideUp">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ajouter une compétence</h2>
          <p className="text-slate-500 mt-2">Sélectionne ou crée une compétence et indique ton niveau (1 à 5).</p>
        </div>

        <SkillForm onCancel={onClose} availableSkills={availableSkills} />
      </Card>
    </div>
  )
}

