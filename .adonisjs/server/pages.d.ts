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
    'dashboard/DesignSystem': ExtractProps<(typeof import('../../inertia/pages/dashboard/DesignSystem.tsx'))['default']>
    'dashboard/EmployeeDetail': ExtractProps<(typeof import('../../inertia/pages/dashboard/EmployeeDetail.tsx'))['default']>
    'dashboard/Employees': ExtractProps<(typeof import('../../inertia/pages/dashboard/Employees.tsx'))['default']>
    'dashboard/Exercise': ExtractProps<(typeof import('../../inertia/pages/dashboard/Exercise.tsx'))['default']>
    'dashboard/Home': ExtractProps<(typeof import('../../inertia/pages/dashboard/Home.tsx'))['default']>
    'dashboard/OrganizationsAdmin': ExtractProps<(typeof import('../../inertia/pages/dashboard/OrganizationsAdmin.tsx'))['default']>
    'dashboard/Profile': ExtractProps<(typeof import('../../inertia/pages/dashboard/Profile.tsx'))['default']>
    'dashboard/Settings': ExtractProps<(typeof import('../../inertia/pages/dashboard/Settings.tsx'))['default']>
    'dashboard/SuperAdminHome': ExtractProps<(typeof import('../../inertia/pages/dashboard/SuperAdminHome.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'Landing': ExtractProps<(typeof import('../../inertia/pages/Landing.tsx'))['default']>
  }
}
