import { PlusIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { EducationForm } from '~/components/dashboard/employee/profile/educations/EducationForm';
import { EducationItem } from '~/components/dashboard/employee/profile/educations/EducationItem';
import Button from '~/components/ui/Button';
import { EmployeeData } from '~/types/employee';
import Card from '../../../../ui/Card';

interface EducationsCardProps {
  employee: EmployeeData
}

export const EducationsCard = ({ employee }: EducationsCardProps) => {
  const [isAdding, setIsAdding] = useState(false)

  const educations = useMemo(() => {
    return employee.educations.sort((a, b) => {
      return DateTime.fromISO(b.startDate).diff(DateTime.fromISO(a.startDate)).toMillis()
    })
  }, [employee.educations])

  return (
    <Card className="p-10 rounded-[40px]">
      <div className="flex justify-between items-start gap-6">
        <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
          Formations
        </h2>
        <Button
          size="xs"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Ajouter une formation
        </Button>
      </div>

      {educations.length === 0 ? (
        <p className="text-brand-navy/50 italic">Aucune formation renseignée.</p>
      ) : (
        <ul className="space-y-8">
          {isAdding && (
            <EducationForm
              education={{
                degree: '',
                school: '',
                startDate: '',
                endDate: null,
                description: '',
                isCurrent: false,
                sortOrder: null,
              }}
              onCancel={() => setIsAdding(false)}
              onSuccess={() => setIsAdding(false)}
            />
          )}
          {educations.map((edu) => (
            <EducationItem key={edu.id} education={edu} />
          ))}
        </ul>
      )}
    </Card>
  );
};
