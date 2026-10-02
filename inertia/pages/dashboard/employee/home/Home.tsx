import { Head } from '@inertiajs/react'
import { isB2cAccount } from '#shared/helpers/b2c_access'
import type { ExerciseAccess } from '#shared/types/exercise/access'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { EmailVerificationBanner } from '~/components/dashboard/EmailVerificationBanner'
import EmployeeHome from '~/components/dashboard/EmployeeHome'
import { B2cEmployeeHome } from '~/components/dashboard/b2c/B2cEmployeeHome'
import { useAuth } from '~/hooks/use_auth'
import { EmployeeData } from '~/types/employee'

export default function CandidatHome({
  employee,
  completedExercises,
  totalExercises,
  exerciseCompletionPercent,
  exerciseProgressByType,
  advisor = null,
  exerciseAccess,
}: {
  employee: EmployeeData
  completedExercises: number
  totalExercises: number
  exerciseCompletionPercent: number
  exerciseProgressByType: Record<string, number>
  /** Expert assigné (#100), `null` sans accompagnement. */
  advisor?: { name: string } | null
  /** Accès aux exercices (plan B2B ou forfait B2C, #100). */
  exerciseAccess?: ExerciseAccess
}) {
  const { user } = useAuth()
  const b2c = isB2cAccount(user?.accountType) && exerciseAccess

  return (
    <>
      <Head title="Tableau de bord - Candidat" />
      <DashboardLayout>
        <div className="w-full space-y-6">
          {/* Particuliers non vérifiés seulement (#98) ; rend `null` sinon. */}
          <EmailVerificationBanner />
          {b2c ? (
            <B2cEmployeeHome
              employee={employee}
              advisor={advisor}
              exerciseAccess={exerciseAccess}
              completedExercises={completedExercises}
              totalExercises={totalExercises}
              exerciseCompletionPercent={exerciseCompletionPercent}
              exerciseProgressByType={exerciseProgressByType}
            />
          ) : (
            <EmployeeHome
              employee={employee}
              completedExercises={completedExercises}
              totalExercises={totalExercises}
              exerciseCompletionPercent={exerciseCompletionPercent}
              exerciseProgressByType={exerciseProgressByType}
            />
          )}
        </div>
      </DashboardLayout>
    </>
  )
}
