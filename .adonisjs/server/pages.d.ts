import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'Auth': ExtractProps<(typeof import('../../inertia/pages/Auth.tsx'))['default']>
    'dashboard/admin/exercises/Usage': ExtractProps<(typeof import('../../inertia/pages/dashboard/admin/exercises/Usage.tsx'))['default']>
    'dashboard/admin/home/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/admin/home/Home.tsx'))['default']>
    'dashboard/admin/jobs/Index': ExtractProps<(typeof import('../../inertia/pages/dashboard/admin/jobs/Index.tsx'))['default']>
    'dashboard/admin/organizations/Index': ExtractProps<(typeof import('../../inertia/pages/dashboard/admin/organizations/Index.tsx'))['default']>
    'dashboard/admin/users/Index': ExtractProps<(typeof import('../../inertia/pages/dashboard/admin/users/Index.tsx'))['default']>
    'dashboard/candidat/StepDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/candidat/StepDetail.tsx'))['default']>
    'dashboard/CandidatProfile': ExtractProps<(typeof import('../../inertia/pages/dashboard/CandidatProfile.tsx'))['default']>
    'dashboard/conseiller/employees/Detail': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/employees/Detail.tsx'))['default']>
    'dashboard/conseiller/employees/List': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/employees/List.tsx'))['default']>
    'dashboard/conseiller/employees/StepDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/employees/StepDetail.tsx'))['default']>
    'dashboard/conseiller/exercises/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/exercises/Home.tsx'))['default']>
    'dashboard/conseiller/exercises/List': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/exercises/List.tsx'))['default']>
    'dashboard/conseiller/exercises/ResultDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/exercises/ResultDetail.tsx'))['default']>
    'dashboard/conseiller/home/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/home/Home.tsx'))['default']>
    'dashboard/conseiller/profile/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/profile/Home.tsx'))['default']>
    'dashboard/conseiller/settings/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/conseiller/settings/Home.tsx'))['default']>
    'dashboard/ConseillerExercise': ExtractProps<(typeof import('../../inertia/pages/dashboard/ConseillerExercise.tsx'))['default']>
    'dashboard/ConseillerHome': ExtractProps<(typeof import('../../inertia/pages/dashboard/ConseillerHome.tsx'))['default']>
    'dashboard/ConseillerProfile': ExtractProps<(typeof import('../../inertia/pages/dashboard/ConseillerProfile.tsx'))['default']>
    'dashboard/employee/exercises/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/employee/exercises/Home.tsx'))['default']>
    'dashboard/employee/exercises/List': ExtractProps<(typeof import('../../inertia/pages/dashboard/employee/exercises/List.tsx'))['default']>
    'dashboard/employee/home/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/employee/home/Home.tsx'))['default']>
    'dashboard/employee/onboarding/Onboarding': ExtractProps<(typeof import('../../inertia/pages/dashboard/employee/onboarding/Onboarding.tsx'))['default']>
    'dashboard/employee/profile/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/employee/profile/Home.tsx'))['default']>
    'dashboard/EmployeeDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/EmployeeDetail.tsx'))['default']>
    'dashboard/EmployeeProfile': ExtractProps<(typeof import('../../inertia/pages/dashboard/EmployeeProfile.tsx'))['default']>
    'dashboard/Employees': ExtractProps<(typeof import('../../inertia/pages/dashboard/Employees.tsx'))['default']>
    'dashboard/ExerciseResultDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/ExerciseResultDetail.tsx'))['default']>
    'dashboard/exercises/CircleOfControl': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/CircleOfControl.tsx'))['default']>
    'dashboard/exercises/ConseillerList': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/ConseillerList.tsx'))['default']>
    'dashboard/exercises/DISC': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/DISC.tsx'))['default']>
    'dashboard/exercises/LifeCurve': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/LifeCurve.tsx'))['default']>
    'dashboard/exercises/List': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/List.tsx'))['default']>
    'dashboard/exercises/Motivation': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Motivation.tsx'))['default']>
    'dashboard/exercises/Personality': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Personality.tsx'))['default']>
    'dashboard/exercises/SkillMapping': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/SkillMapping.tsx'))['default']>
    'dashboard/exercises/Targeting': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Targeting.tsx'))['default']>
    'dashboard/exercises/Values': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Values.tsx'))['default']>
    'dashboard/shared/exercises/CircleOfControl': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/CircleOfControl.tsx'))['default']>
    'dashboard/shared/exercises/DISC': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/DISC.tsx'))['default']>
    'dashboard/shared/exercises/LifeCurve': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/LifeCurve.tsx'))['default']>
    'dashboard/shared/exercises/Motivation': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/Motivation.tsx'))['default']>
    'dashboard/shared/exercises/Personality': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/Personality.tsx'))['default']>
    'dashboard/shared/exercises/SkillMapping': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/SkillMapping.tsx'))['default']>
    'dashboard/shared/exercises/Targeting': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/Targeting.tsx'))['default']>
    'dashboard/shared/exercises/Values': ExtractProps<(typeof import('../../inertia/pages/dashboard/shared/exercises/Values.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'Landing': ExtractProps<(typeof import('../../inertia/pages/Landing.tsx'))['default']>
    'LegalNotice': ExtractProps<(typeof import('../../inertia/pages/LegalNotice.tsx'))['default']>
    'Login': ExtractProps<(typeof import('../../inertia/pages/Login.tsx'))['default']>
    'Methodology': ExtractProps<(typeof import('../../inertia/pages/Methodology.tsx'))['default']>
    'Offer': ExtractProps<(typeof import('../../inertia/pages/Offer.tsx'))['default']>
    'onboarding/InvalidToken': ExtractProps<(typeof import('../../inertia/pages/onboarding/InvalidToken.tsx'))['default']>
    'onboarding/SetPassword': ExtractProps<(typeof import('../../inertia/pages/onboarding/SetPassword.tsx'))['default']>
    'PrivacyPolicy': ExtractProps<(typeof import('../../inertia/pages/PrivacyPolicy.tsx'))['default']>
    'Register': ExtractProps<(typeof import('../../inertia/pages/Register.tsx'))['default']>
    'Security': ExtractProps<(typeof import('../../inertia/pages/Security.tsx'))['default']>
    'Pricing': ExtractProps<(typeof import('../../inertia/pages/Pricing.tsx'))['default']>
    'dashboard/admin/DesignSystem': ExtractProps<(typeof import('../../inertia/pages/dashboard/admin/DesignSystem.tsx'))['default']>
  }
}
