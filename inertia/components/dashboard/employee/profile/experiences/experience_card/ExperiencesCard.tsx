import { PlusIcon } from 'lucide-react'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { ExperienceForm } from '~/components/dashboard/employee/profile/experiences/ExperienceForm'
import { ExperienceItem } from '~/components/dashboard/employee/profile/experiences/experience_card/ExperienceItem'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import type { EmployeeData } from '~/types/employee'

interface ExperiencesCardProps {
  employee: EmployeeData
}

export const ExperiencesCard = ({ employee }: ExperiencesCardProps) => {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const experiences = useMemo(
    () =>
      [...employee.experiences].sort((a, b) => {
      if (a.startDate === null && b.startDate === null) {
        return 0
      }
      if (a.startDate === null) {
        return 1
      }
      if (b.startDate === null) {
        return -1
      }
      return DateTime.fromISO(b.startDate).diff(DateTime.fromISO(a.startDate)).toMillis()
    }),
    [employee.experiences]
  )

  return (
    <Card className="p-10 rounded-[40px]">
      <div className="flex justify-between items-start gap-6">
        <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
          Expériences
        </h2>
        <Button
          size="xs"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <PlusIcon className="w-4 h-4" />
          Ajouter une expérience
        </Button>
      </div>
      {experiences.length === 0 ? (
        <p className="text-brand-navy/50 italic">Aucune expérience renseignée.</p>
      ) : (
        <ul className="space-y-10">
          {isAdding && (
            <ExperienceForm
              experience={{
                title: '',
                company: '',
                startDate: '',
                endDate: null,
                description: '',
                type: null,
                isCurrent: false,
                sortOrder: null,
              }}
              onCancel={() => setIsAdding(false)}
              onSuccess={() => setIsAdding(false)}
            />
          )}
          {experiences.map((exp) => (
            <ExperienceItem
              key={exp.id}
              experience={exp}
              isEditing={editingId === exp.id}
              setIsEditing={(isEditing) => setEditingId(isEditing ? exp.id : null)}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
