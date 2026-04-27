import { Head, router } from '@inertiajs/react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import OnboardingFlow from '~/components/onboarding/OnboardingFlow'
import { candidatProfileUpdatePayload } from '~/helpers/candidat_profile_payload'
import { EmployeeData } from '~/types/employee'

export default function CandidatOnboarding({
  employee,
}: { employee: EmployeeData }) {
  return (
    <>
      <Head title="Onboarding" />
      <DashboardLayout>
        <OnboardingFlow
          employee={employee as any}
          onComplete={(updated) => {
            router.put(
              '/dashboard/candidat/onboarding',
              {
                ...candidatProfileUpdatePayload(updated as any),
                onboarded: true,
              },
              {
                onSuccess: () => router.visit('/dashboard/candidat'),
              }
            )
          }}
        />
      </DashboardLayout>
    </>
  )
}
