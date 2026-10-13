/** Chemins du back-office super admin (`start/routes/dashboard/admin/super_admin.ts`). */
export const SUPER_ADMIN_PATHS = {
  organizations: '/dashboard/super-admin/organizations',
  organization: (id: number) => `/dashboard/super-admin/organizations/${id}`,
  users: '/dashboard/super-admin/users',
  user: (id: number) => `/dashboard/super-admin/users/${id}`,
  userDisable: (id: number) => `/dashboard/super-admin/users/${id}/disable`,
  userEnable: (id: number) => `/dashboard/super-admin/users/${id}/enable`,
  contactRequests: '/dashboard/super-admin/contact-requests',
  contactRequestStatus: (id: number) => `/dashboard/super-admin/contact-requests/${id}/status`,
  skills: '/dashboard/super-admin/skills',
  skill: (id: number) => `/dashboard/super-admin/skills/${id}`,
} as const
