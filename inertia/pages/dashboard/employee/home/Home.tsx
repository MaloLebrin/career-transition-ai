import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { EmailVerificationBanner } from '~/components/dashboard/EmailVerificationBanner'
import EmployeeHome from '~/components/dashboard/EmployeeHome'
import { EmployeeData } from '~/types/employee'

export default function CandidatHome({
  employee,
  completedExercises,
  totalExercises,
  exerciseCompletionPercent,
  exerciseProgressByType,
}: {
  employee: EmployeeData
  completedExercises: number
  totalExercises: number
  exerciseCompletionPercent: number
  exerciseProgressByType: Record<string, number>
}) {
  return (
    <>
      <Head title="Tableau de bord - Candidat" />
      <DashboardLayout>
        <div className="w-full space-y-6">
          {/* Particuliers non vérifiés seulement (#98) ; rend `null` sinon. */}
          <EmailVerificationBanner />
          <EmployeeHome
            employee={employee}
            completedExercises={completedExercises}
            totalExercises={totalExercises}
            exerciseCompletionPercent={exerciseCompletionPercent}
            exerciseProgressByType={exerciseProgressByType}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
