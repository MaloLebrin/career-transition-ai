import { useForm } from '@inertiajs/react';
import Button from '~/components/ui/Button';
import DatePicker from '~/components/ui/DatePicker';
import Input from '~/components/ui/Input';
import type { EmployeeData } from '~/types/employee';

interface EducationFormProps {
  education: Omit<EmployeeData['educations'][0], 'id'> & { id?: number };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const EducationForm = ({ education, onCancel, onSuccess }: EducationFormProps) => {
  const { data, setData, post, put, processing, errors, isDirty } = useForm({
    id: education.id,
    degree: education.degree,
    school: education.school,
    startDate: education.startDate,
    endDate: education.endDate,
    description: education.description,
    isCurrent: education.isCurrent || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (education.id) {
      put(`/dashboard/candidat/educations`, {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      post('/dashboard/candidat/educations', {
        onSuccess: () => onSuccess?.(),
      });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-brand-navy/5 p-8 rounded-[32px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          name="degree"
          label="Diplôme"
          value={data.degree}
          onChange={(e) => setData('degree', e.target.value)}
          error={errors.degree}
          required
        />
        <Input
          name="school"
          label="Ecole"
          value={data.school}
          onChange={(e) => setData('school', e.target.value)}
          error={errors.school}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            label="Date de début"
            value={data.startDate}
            type="month"
            placeholder="MM/AAAA"
            error={errors.startDate}
            required
            onChange={(val) => setData('startDate', val)}
          />

          {(!data.isCurrent) && (
            <DatePicker
              label="Date de fin"
              value={data.endDate || ''}
              type="month"
              placeholder="MM/AAAA"
              error={errors.endDate}
              onChange={(val) => setData('endDate', val)}
            />
          )}
        </div>
      </div>

      <div className="flex items-center px-2">
        <input
          type="checkbox"
          id="isCurrent"
          checked={data.isCurrent}
          onChange={(e) => {
            const isChecked = e.target.checked
            setData('isCurrent', isChecked)
            if (isChecked) {
              setData('endDate', null)
            }
          }}
          className="w-4 h-4 rounded text-brand-sage focus:ring-brand-sage"
        />
        <label htmlFor="isCurrent" className="ml-2 text-xs font-bold text-brand-navy/60 cursor-pointer">
          Formation actuel
        </label>
      </div>

      <div className="space-y-1.5 w-full">
        <label htmlFor="description" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">
          Description
        </label>
        <textarea
          id="description"
          className="w-full p-4 bg-white border border-brand-navy/10 rounded-2xl outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5 text-sm text-brand-navy/70 h-32 resize-none transition-all"
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
          placeholder="Décrivez vos missions et réalisations..."
        />
        {errors.description && <p className="text-[9px] font-bold text-rose-500 px-2">{errors.description}</p>}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={processing || !isDirty}>
          {education.id ? 'Enregistrer les modifications' : 'Ajouter la formation'}
        </Button>
      </div>
    </form>
  );
};
