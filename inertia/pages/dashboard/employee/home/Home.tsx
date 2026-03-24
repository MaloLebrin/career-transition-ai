import { Head } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import EmployeeHome from '~/components/dashboard/EmployeeHome'
import { EmployeeData } from '~/types/Employee'

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
        <EmployeeHome
          employee={employee}
          completedExercises={completedExercises}
          totalExercises={totalExercises}
          exerciseCompletionPercent={exerciseCompletionPercent}
          exerciseProgressByType={exerciseProgressByType}
        />
      </DashboardLayout>
    </>
  )
}
