import DomainException from '#exceptions/domain_exception'

/**
 * Erreurs métier du catalogue de compétences géré par le super admin
 * (`#services/super_admin_skills_service`).
 */

/** Compétence absente ou propre à une organisation (hors catalogue global) → 404. */
export class SkillNotFoundError extends DomainException {
  constructor(message: string = 'Compétence introuvable.') {
    super(message, { status: 404, code: 'E_SKILL_NOT_FOUND' })
  }
}

/** Une compétence du catalogue porte déjà ce nom → 422. */
export class SkillAlreadyExistsError extends DomainException {
  constructor(message: string = 'Une compétence du catalogue porte déjà ce nom.') {
    super(message, { status: 422, code: 'E_SKILL_ALREADY_EXISTS' })
  }
}

/** Compétence rattachée à des candidats : suppression refusée → 422. */
export class SkillInUseError extends DomainException {
  constructor(message: string = 'Cette compétence est utilisée par des candidats.') {
    super(message, { status: 422, code: 'E_SKILL_IN_USE' })
  }
}
