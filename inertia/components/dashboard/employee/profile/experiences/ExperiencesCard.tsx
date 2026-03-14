import { formatDate } from '#shared/helpers/date';
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
            <li key={exp.id} className="relative flex gap-6 pb-10 last:pb-0 border-b border-brand-navy/5 last:border-0">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/10 flex items-center justify-center shrink-0">
                <span className="text-brand-sage font-bold text-sm">XP</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-xl font-bold text-brand-navy">{exp.title}</h3>
                  {exp.type && (
                    <span className="text-xs font-bold text-brand-navy/40 uppercase px-2 py-0.5 rounded-full bg-brand-navy/5">
                      {exp.type}
                    </span>
                  )}
                </div>
                <p className="text-brand-sage font-semibold mt-1">{exp.company}</p>
                <p className="text-brand-navy/50 text-sm mt-1">
                  {formatDate(exp.startDate)}
                  {exp.endDate && ` – ${exp.isCurrent ? 'aujourd\'hui' : formatDate(exp.endDate)}`}
                </p>
                {exp.description && (
                  <p className="text-brand-navy/70 mt-4 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
