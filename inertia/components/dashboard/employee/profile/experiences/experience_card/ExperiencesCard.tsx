import { ExperienceItem } from '~/components/dashboard/employee/profile/experiences/experience_card/ExperienceItem';
import Card from '~/components/ui/Card';
import { EmployeeData } from '~/types';

interface ExperiencesCardProps {
  employee: EmployeeData
}

export const ExperiencesCard = ({ employee }: ExperiencesCardProps) => {
  return (
    <Card className="p-10 rounded-[40px]">
      <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
        Expériences
      </h2>
      {employee.experiences.length === 0 ? (
        <p className="text-brand-navy/50 italic">Aucune expérience renseignée.</p>
      ) : (
        <ul className="space-y-10">
          {employee.experiences.map((exp) => (
            <ExperienceItem key={exp.id} experience={exp} />
          ))}
        </ul>
      )}
    </Card>
  );
};
