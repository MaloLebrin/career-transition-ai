import { useState } from 'react'
import { AccompanimentsSection } from '~/components/dashboard/advisor/home/accompaniment/AccompanimentsSection'
import { UpcomingAppointmentsPanel } from '~/components/dashboard/advisor/home/accompaniment/UpcomingAppointmentsPanel'
import type {
  AdvisorHomeProps,
} from '~/types/employee'
import AddEmployeeModal from '../../../modals/AddEmployeeModal'
import Button from '../../../ui/Button'
import { StatsRow } from './stats/StatsRow'

export function AdvisorHome({ stats, accompaniments, upcomingAppointments }: AdvisorHomeProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand-navy">Tableau de bord</h2>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          size="md"
          variant="secondary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        >
          Nouveau Candidat
        </Button>
      </div>

      <StatsRow stats={stats} />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5'>
        <AccompanimentsSection accompaniments={accompaniments} />

        <UpcomingAppointmentsPanel appointments={upcomingAppointments} />
      </div>


      {isAddModalOpen && <AddEmployeeModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  )
}
