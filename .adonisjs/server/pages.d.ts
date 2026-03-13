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
    'dashboard/BulkJobs': ExtractProps<(typeof import('../../inertia/pages/dashboard/BulkJobs.tsx'))['default']>
    'dashboard/CandidatExercise': ExtractProps<(typeof import('../../inertia/pages/dashboard/CandidatExercise.tsx'))['default']>
    'dashboard/CandidatHome': ExtractProps<(typeof import('../../inertia/pages/dashboard/CandidatHome.tsx'))['default']>
    'dashboard/CandidatProfile': ExtractProps<(typeof import('../../inertia/pages/dashboard/CandidatProfile.tsx'))['default']>
    'dashboard/ConseillerExercise': ExtractProps<(typeof import('../../inertia/pages/dashboard/ConseillerExercise.tsx'))['default']>
    'dashboard/ConseillerHome': ExtractProps<(typeof import('../../inertia/pages/dashboard/ConseillerHome.tsx'))['default']>
    'dashboard/ConseillerProfile': ExtractProps<(typeof import('../../inertia/pages/dashboard/ConseillerProfile.tsx'))['default']>
    'dashboard/DesignSystem': ExtractProps<(typeof import('../../inertia/pages/dashboard/DesignSystem.tsx'))['default']>
    'dashboard/EmployeeDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/EmployeeDetail.tsx'))['default']>
    'dashboard/EmployeeProfile': ExtractProps<(typeof import('../../inertia/pages/dashboard/EmployeeProfile.tsx'))['default']>
    'dashboard/Employees': ExtractProps<(typeof import('../../inertia/pages/dashboard/Employees.tsx'))['default']>
    'dashboard/ExerciseResultDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/ExerciseResultDetail.tsx'))['default']>
    'dashboard/exercises/CandidatList': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/CandidatList.tsx'))['default']>
    'dashboard/exercises/CircleOfControl': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/CircleOfControl.tsx'))['default']>
    'dashboard/exercises/ConseillerList': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/ConseillerList.tsx'))['default']>
    'dashboard/exercises/DISC': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/DISC.tsx'))['default']>
    'dashboard/exercises/LifeCurve': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/LifeCurve.tsx'))['default']>
    'dashboard/exercises/Motivation': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Motivation.tsx'))['default']>
    'dashboard/exercises/Personality': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Personality.tsx'))['default']>
    'dashboard/exercises/SkillMapping': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/SkillMapping.tsx'))['default']>
    'dashboard/exercises/Targeting': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Targeting.tsx'))['default']>
    'dashboard/exercises/Values': ExtractProps<(typeof import('../../inertia/pages/dashboard/exercises/Values.tsx'))['default']>
    'dashboard/ExercisesUsageAdmin': ExtractProps<(typeof import('../../inertia/pages/dashboard/ExercisesUsageAdmin.tsx'))['default']>
    'dashboard/OrganizationsAdmin': ExtractProps<(typeof import('../../inertia/pages/dashboard/OrganizationsAdmin.tsx'))['default']>
    'dashboard/Settings': ExtractProps<(typeof import('../../inertia/pages/dashboard/Settings.tsx'))['default']>
    'dashboard/SuperAdminHome': ExtractProps<(typeof import('../../inertia/pages/dashboard/SuperAdminHome.tsx'))['default']>
    'dashboard/UsersAdmin': ExtractProps<(typeof import('../../inertia/pages/dashboard/UsersAdmin.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'Landing': ExtractProps<(typeof import('../../inertia/pages/Landing.tsx'))['default']>
    'Login': ExtractProps<(typeof import('../../inertia/pages/Login.tsx'))['default']>
    'onboarding/InvalidToken': ExtractProps<(typeof import('../../inertia/pages/onboarding/InvalidToken.tsx'))['default']>
    'onboarding/SetPassword': ExtractProps<(typeof import('../../inertia/pages/onboarding/SetPassword.tsx'))['default']>
    'Register': ExtractProps<(typeof import('../../inertia/pages/Register.tsx'))['default']>
    'dashboard/CandidatOnboarding': ExtractProps<(typeof import('../../inertia/pages/dashboard/CandidatOnboarding.tsx'))['default']>
  }
}
