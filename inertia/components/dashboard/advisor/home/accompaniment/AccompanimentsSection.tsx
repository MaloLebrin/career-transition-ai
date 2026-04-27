import { AccompanimentCard } from "~/components/dashboard/advisor/home/accompaniment/AccompanimentCard";
import Card from "~/components/ui/Card";
import { AccompanimentProgress } from "~/types/employee";

export function AccompanimentsSection({ accompaniments }: { accompaniments: AccompanimentProgress[] }) {
  return (
    <Card className="p-8">
      <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6 pb-3 border-b border-brand-sage/20">
        Vue des accompagnements
      </h3>
      {accompaniments.length === 0 ? (
        <p className="text-center py-8 text-brand-navy/40 text-xs font-medium italic">
          Aucun candidat suivi
        </p>
      ) : (
        <div className="space-y-3">
          {accompaniments.map((acc) => (
            <AccompanimentCard key={acc.employeeId} acc={acc} />
          ))}
        </div>
      )}
    </Card>
  )
}
