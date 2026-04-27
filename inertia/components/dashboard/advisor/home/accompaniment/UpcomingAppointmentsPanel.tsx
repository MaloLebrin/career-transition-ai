import AppLink from "~/components/ui/AppLink";
import Card from "~/components/ui/Card";
import { UpcomingAppointment } from "~/types/employee";
import { formatDateTimeFR } from "../../../../../../shared/helpers/date";

export function UpcomingAppointmentsPanel({ appointments }: { appointments: UpcomingAppointment[] }) {
  return (
    <Card className="p-8">
      <h3 className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest mb-6 pb-3 border-b border-brand-sage/20">
        Prochains Rendez-vous
      </h3>
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <p className="text-center py-8 text-brand-navy/40 text-xs font-medium italic">
            Aucun rendez-vous planifié
          </p>
        ) : (
          appointments.map((appt) => (
            <AppLink
              key={appt.stepId}
              href={`/dashboard/conseiller/employees/${appt.employeeId}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-brand-terracotta/5 border border-brand-terracotta/10 hover:shadow-sm transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center">
                  <svg
                    className="w-5 h-5 stroke-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-navy">{appt.employeeName}</p>
                  {appt.title && (
                    <p className="text-[10px] font-medium text-brand-navy/60">{appt.title}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-brand-terracotta uppercase tracking-widest">
                  {formatDateTimeFR(appt.scheduledAt)}
                </p>
                {appt.locationOrLink && (
                  <p className="text-[10px] text-brand-navy/40 mt-0.5 truncate max-w-[120px]">
                    {appt.locationOrLink}
                  </p>
                )}
              </div>
            </AppLink>
          ))
        )}
      </div>
    </Card>
  )
}
