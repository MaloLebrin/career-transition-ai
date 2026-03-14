import { formatDate } from '#shared/helpers/date';
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
            <li key={edu.id} className="pb-8 last:pb-0 border-b border-brand-navy/5 last:border-0">
              <h3 className="text-lg font-bold text-brand-navy">{edu.degree}</h3>
              <p className="text-brand-navy/70 mt-1">{edu.institution}</p>
              <p className="text-brand-navy/50 text-sm mt-1">
                {formatDate(edu.startDate)}
                {edu.endDate ? formatDate(edu.endDate) : 'Aujourd\'hui'}
              </p>
              {edu.description && (
                <p className="text-brand-navy/60 mt-3 leading-relaxed text-sm">
                  {edu.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
