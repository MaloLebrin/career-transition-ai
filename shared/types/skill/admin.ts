import type { ListParams } from '#shared/types/pagination'

/** Paramètres du catalogue de compétences (`?page=&search=`). */
export type SkillListParams = ListParams

/** Une compétence du catalogue global, avec le nombre de candidats qui la portent. */
export interface SkillItem {
  id: number
  name: string
  category: string | null
  employeesCount: number
}

export interface SkillInput {
  name: string
  category: string | null
}
