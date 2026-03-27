import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import React, { useCallback, useState } from 'react'
import { OnBoardingStep1 } from '~/components/onboarding/steps/OnBoardingStep1'
import { OnBoardingStep2 } from '~/components/onboarding/steps/OnBoardingStep2'
import { Employee, Skill } from '../../types'
import ProfilePage from '../profile/ProfilePage'
import Card from '../ui/Card'

interface Props {
  employee: Employee
  onComplete: (updatedEmployee: Employee) => void
}

const OnboardingFlow: React.FC<Props> = ({ employee, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Added missing organizationId to match Omit<Employee, ...> type requirements
  const [formData, setFormData] = useState<
    Omit<Employee, 'id' | 'status' | 'onboarded' | 'exercises' | 'plan'>
  >({
    organizationId: employee.organizationId,
    name: employee.name,
    email: employee.email,
    currentRole: employee.currentRole ?? '',
    targetRole: employee.targetRole ?? '',
    skills: [] as Skill[],
    summary: employee.summary ?? '',
    experiences: [],
    educations: [],
  })

  const handleFinalize = useCallback((updated: Employee) => {
    onComplete({
      ...updated,
      onboarded: true,
      status: EMPLOYEES_STATUS.ACTIVE,
    } as any)
  }, [onComplete])

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fadeIn">
      <Card className="w-full max-w-4xl overflow-hidden p-0 border-brand-navy/5">
        <div className="h-2 bg-brand-navy/5 w-full">
          <div
            className="h-full bg-brand-sage transition-all duration-700"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="p-10 md:p-14">
          {step === 1 && (
            <OnBoardingStep1 employee={employee} onNext={() => setStep(2)} />
          )}

          {step === 2 && (
            <OnBoardingStep2 setFormData={setFormData} onNext={() => setStep(3)} />
          )}

          {step === 3 && (
            <ProfilePage
              employee={{ ...employee, ...formData } as any}
              onSave={(updated) => handleFinalize(updated)}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default OnboardingFlow
