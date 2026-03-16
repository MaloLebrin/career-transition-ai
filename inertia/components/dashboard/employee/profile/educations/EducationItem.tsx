import { formatDate } from '#shared/helpers/date';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { EducationForm } from '~/components/dashboard/employee/profile/educations/EducationForm';
import { EmployeeData } from '~/types';

interface EducationItemProps {
  education: EmployeeData['educations'][0]
}

export const EducationItem = ({ education }: EducationItemProps) => {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <li className={`relative pb-10 last:pb-0 border-b border-brand-navy/5 last:border-0 ${!isEditing ? 'flex gap-6 group' : ''}`}>
      {isEditing ? (
        <div className="flex-1">
          <EducationForm
            education={education}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          <div key={education.id} className="pb-8 last:pb-0 border-b border-brand-navy/5 last:border-0">
            <h3 className="text-lg font-bold text-brand-navy">{education.degree}</h3>
            <p className="text-brand-navy/70 mt-1">{education.school}</p>
            <p className="text-brand-navy/50 text-sm mt-1">
              {formatDate(education.startDate)}
              {education.endDate ? formatDate(education.endDate) : 'Aujourd\'hui'}
            </p>
            {education.description && (
              <p className="text-brand-navy/60 mt-3 leading-relaxed text-sm">
                {education.description}
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
