import { Pencil } from 'lucide-react';
import { EmployeeData } from '~/types';
import { formatDate } from '../../../../../../../shared/helpers/date';
import { ExperienceForm } from '../ExperienceForm';

interface ExperienceItemProps {
  experience: EmployeeData['experiences'][0]
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
}

export const ExperienceItem = ({ experience, isEditing, setIsEditing }: ExperienceItemProps) => {
  return (
    <li className={`relative pb-10 last:pb-0 border-b border-brand-navy/5 last:border-0 ${!isEditing ? 'flex gap-6 group' : ''}`}>
      {isEditing ? (
        <div className="flex-1">
          <ExperienceForm
            experience={experience}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-2xl bg-brand-sage/10 flex items-center justify-center shrink-0">
            <span className="text-brand-sage font-bold text-sm">XP</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-xl font-bold text-brand-navy">{experience.title}</h3>
              {experience.type && (
                <span className="text-xs font-bold text-brand-navy/40 uppercase px-2 py-0.5 rounded-full bg-brand-navy/5">
                  {experience.type}
                </span>
              )}
            </div>
            <p className="text-brand-sage font-semibold mt-1">{experience.company}</p>
            <p className="text-brand-navy/50 text-sm mt-1">
              {formatDate(experience.startDate)}
              {experience.endDate && ` – ${experience.isCurrent ? "aujourd'hui" : formatDate(experience.endDate)}`}
            </p>
            {experience.description && (
              <p className="text-brand-navy/70 mt-4 leading-relaxed">
                {experience.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditing(true)
            }}
            className="opacity-0 group-hover:opacity-100 absolute top-0 right-0 p-2 text-brand-navy/20 hover:text-brand-sage transition-all cursor-pointer"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </>
      )}
    </li>
  );
};
