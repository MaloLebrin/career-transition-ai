import { EmployeeData } from '~/types';
import Card from '../../../ui/Card';

interface SkillsProps {
  employee: EmployeeData
}

export const Skills = ({ employee }: SkillsProps) => {
  return (
    <Card className="p-10 rounded-[40px]">
      <h2 className="text-sm font-bold text-brand-navy/40 uppercase tracking-[0.2em] mb-8">
        Compétences
      </h2>
      {employee.skills.length === 0 ? (
        <p className="text-brand-navy/50 italic">Aucune compétence renseignée.</p>
      ) : (
        <div className="space-y-5">
          {employee.skills.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-brand-navy font-medium min-w-[160px]">{s.name}</span>
              <div className="flex-1 h-3 bg-brand-navy/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-sage rounded-full transition-all"
                  style={{ width: `${(s.level / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-brand-navy/60 tabular-nums w-8">{s.level}/5</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
