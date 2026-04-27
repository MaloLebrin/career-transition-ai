import { getProgress } from '#shared/helpers/employee/progress'
import { router } from '@inertiajs/react'
import { AccompanimentStatusBadge } from '~/components/dashboard/advisor/home/accompaniment/AccompanimentStatusBadge'
import type { Employee } from '~/types/employee'

interface EmployeesTableProps {
  employees: Employee[]
  allEmployeesCount: number
}

export function EmployeesTable({ employees, allEmployeesCount }: EmployeesTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-hidden shadow-sm">
      <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
        <thead className="bg-brand-sage/5 border-b border-brand-sage/10">
          <tr>
            <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
              Candidat
            </th>
            <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
              Rôle actuel
            </th>
            <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
              Objectif
            </th>
            <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
              Progression
            </th>
            <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
              Accompagné
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-navy/5">
          {employees.map((employee) => {
            const { completed, total, percent } = getProgress(employee.plan)
            return (
              <tr
                key={employee.id}
                className="hover:bg-brand-ivory/60 transition-colors cursor-pointer"
                onClick={() => router.visit(`/dashboard/conseiller/employees/${employee.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-xs shrink-0">
                      {employee.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-brand-navy leading-tight">{employee.name}</p>
                      <p className="text-[10px] text-brand-navy/40 mt-0.5">{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-brand-navy/70">{employee.currentRole}</td>
                <td className="px-6 py-4 text-xs text-brand-navy/70">
                  {employee.targetRole ?? <span className="text-brand-navy/30">—</span>}
                </td>
                <td className="px-6 py-4">
                  <AccompanimentStatusBadge status={employee.status} />
                </td>
                <td className="px-6 py-4 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-brand-navy/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-sage transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-brand-navy/50 font-medium whitespace-nowrap">
                      {completed}/{total}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                      employee.onboarded
                        ? 'bg-brand-sage/15 text-brand-sage'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {employee.onboarded ? 'Oui' : 'En attente'}
                  </span>
                </td>
              </tr>
            )
          })}
          {employees.length === 0 && (
            <tr>
              <td
                className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                colSpan={6}
              >
                {allEmployeesCount === 0
                  ? 'Aucun candidat pour le moment. Créez votre premier candidat !'
                  : 'Aucun candidat ne correspond à vos critères de recherche.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
