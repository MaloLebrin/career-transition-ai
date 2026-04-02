import { experiencesTypesValues } from '#shared/constants/experience';
import { useForm } from '@inertiajs/react';
import Button from '~/components/ui/Button';
import DatePicker from '~/components/ui/DatePicker';
import Input from '~/components/ui/Input';
import type { EmployeeData } from '~/types/employee';

interface ExperienceFormProps {
  experience: Omit<EmployeeData['experiences'][0], 'id'> & { id?: number };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const ExperienceForm = ({ experience, onCancel, onSuccess }: ExperienceFormProps) => {
  const { data, setData, post, put, processing, errors, isDirty } = useForm({
    id: experience.id,
    title: experience.title,
    company: experience.company,
    type: experience.type?.toLowerCase() || 'cdi',
    startDate: experience.startDate ? experience.startDate.split('T')[0] : '',
    endDate: experience.endDate ? experience.endDate.split('T')[0] : '',
    description: experience.description || '',
    isCurrent: experience.isCurrent || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (experience.id) {
      put('/dashboard/candidat/experiences', {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      post('/dashboard/candidat/experiences', {
        onSuccess: () => onSuccess?.(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-brand-navy/5 p-8 rounded-[32px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          name="title"
          label="Poste"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          error={errors.title}
          required
        />

        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block">
            Type de contrat
          </label>
          <select
            className="w-full p-4 bg-white border border-brand-navy/10 rounded-2xl outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/5 font-medium transition-all text-sm h-[54px]"
            value={data.type}
            onChange={(e) => setData('type', e.target.value as any)}
          >
            {experiencesTypesValues.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-[9px] font-bold text-rose-500 px-2">{errors.type}</p>}
        </div>

        <Input
          name="company"
          label="Entreprise"
          value={data.company}
          onChange={(e) => setData('company', e.target.value)}
          error={errors.company}
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
              setData('endDate', '')
            }
          }}
          className="w-4 h-4 rounded text-brand-sage focus:ring-brand-sage"
        />
        <label htmlFor="isCurrent" className="ml-2 text-xs font-bold text-brand-navy/60 cursor-pointer">
          Poste actuel
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
          {experience.id ? 'Enregistrer les modifications' : 'Ajouter l\'expérience'}
        </Button>
      </div>
    </form>
  );
};
