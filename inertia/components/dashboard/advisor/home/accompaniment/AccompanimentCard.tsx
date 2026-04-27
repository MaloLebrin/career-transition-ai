import { formatDateTimeFR } from "#shared/helpers/date";
import { AccompanimentStatusBadge } from "~/components/dashboard/advisor/home/accompaniment/AccompanimentStatusBadge";
import AppLink from "~/components/ui/AppLink";
import { AccompanimentProgress } from "~/types/employee";

export function AccompanimentCard({ acc }: { acc: AccompanimentProgress }) {
  return (
    <AppLink
      href={`/dashboard/conseiller/employees/${acc.employeeId}`}
      className="block p-5 rounded-2xl bg-brand-ivory/50 border border-brand-navy/5 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-sm shrink-0">
            {acc.name[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-brand-navy leading-tight">{acc.name}</p>
            {acc.targetRole && (
              <p className="text-[10px] text-brand-navy/50 mt-0.5">{acc.targetRole}</p>
            )}
          </div>
        </div>
        <AccompanimentStatusBadge status={acc.status} />
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-[10px] font-medium text-brand-navy/50 mb-1">
          <span>Progression</span>
          <span>
            {acc.completedSteps}/{acc.totalSteps} étapes
          </span>
        </div>
        <div className="h-2 rounded-full bg-brand-navy/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-sage transition-all"
            style={{ width: `${acc.progressPercent}%` }}
          />
        </div>
      </div>

      {acc.nextAppointment ? (
        <p className="text-[10px] text-brand-terracotta font-medium mt-2">
          Prochain RDV : {formatDateTimeFR(acc.nextAppointment.scheduledAt)}
          {acc.nextAppointment.title && ` — ${acc.nextAppointment.title}`}
        </p>
      ) : (
        <p className="text-[10px] text-brand-navy/30 mt-2 italic">Aucun RDV planifié</p>
      )}
    </AppLink>
  )
}
