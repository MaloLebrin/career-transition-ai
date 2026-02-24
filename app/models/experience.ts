export const EXPERIENCES_TYPES = {
  CDI: 'cdi',
  CDD: 'cdd',
  INTERIM: 'interim',
  FREELANCE: 'freelance',
  INDEPENDENT: 'independent',
  ALTERNANCE: 'alternance',
  OTHER: 'other',
} as const

export type ExperienceType = (typeof EXPERIENCES_TYPES)[keyof typeof EXPERIENCES_TYPES]
