/** Import de CV (`POST /dashboard/ai/cv`) : limites partagées front / validateur. */
export const CV_IMPORT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const
export const CV_IMPORT_MAX_SIZE = '10mb'

/** Endpoints d'assistance IA (authentifiés, `start/routes/dashboard/ai.ts`). */
export const AI_ASSIST_ROUTES = {
  CV: '/dashboard/ai/cv',
  SKILL_MAPPING: '/dashboard/ai/skill-mapping',
  TARGETS: '/dashboard/ai/targets',
} as const
