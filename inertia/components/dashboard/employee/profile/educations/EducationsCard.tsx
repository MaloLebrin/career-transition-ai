import { EducationItem } from '~/components/dashboard/employee/profile/educations/EducationItem';
import { EmployeeData } from '~/types';
import Card from '../../../../ui/Card';

interface EducationsCardProps {
  employee: EmployeeData
}

export const EducationsCard = ({ employee }: EducationsCardProps) => {
  return (
    <Card className="p-10 rounded-[40px]">
      <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
        Formations
      </h2>
      {employee.educations.length === 0 ? (
        <p className="text-brand-navy/50 italic">Aucune formation renseignée.</p>
      ) : (
        <ul className="space-y-8">
          {employee.educations.map((edu) => (
            <EducationItem key={edu.id} education={edu} />
          ))}
        </ul>
      )}
    </Card>
  );
};
